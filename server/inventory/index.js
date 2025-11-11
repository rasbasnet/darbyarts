const { readStore, writeStore } = require('./storage');
const { INVENTORY_SEED, INVENTORY_KEY_OVERRIDES } = require('./config');

const DEFAULT_ITEM_SHAPE = () => ({
  quantity: 0,
  initial: 0,
  updatedAt: new Date().toISOString()
});

const makeCompositeKey = (posterId, editionId) => {
  const normalizedPoster = typeof posterId === 'string' ? posterId.trim() : '';
  const normalizedEdition = typeof editionId === 'string' && editionId.trim().length ? editionId.trim() : null;
  if (!normalizedPoster) {
    throw new Error('posterId is required to resolve inventory key.');
  }

  return `${normalizedPoster}::${normalizedEdition ?? 'default'}`;
};

const resolveInventoryKey = (posterId, editionId) => {
  const composite = makeCompositeKey(posterId, editionId);
  return INVENTORY_KEY_OVERRIDES[composite] ?? composite;
};

const cloneStore = (data = {}) => ({
  inventory: { ...(data.inventory ?? {}) },
  orders: { ...(data.orders ?? {}) },
  holds: { ...(data.holds ?? {}) }
});

const cleanupExpiredHolds = (store) => {
  const now = Date.now();
  let mutated = false;

  Object.entries(store.holds).forEach(([holdId, hold]) => {
    if (!hold || !hold.expiresAt) {
      return;
    }
    const expiresAt = Date.parse(hold.expiresAt);
    if (Number.isNaN(expiresAt) || expiresAt <= now) {
      delete store.holds[holdId];
      mutated = true;
    }
  });

  return mutated;
};

const ensureSeededInventory = async (data) => {
  const now = new Date().toISOString();
  const store = cloneStore(data);
  let mutated = false;

  Object.entries(INVENTORY_SEED).forEach(([key, quantity]) => {
    const entry = store.inventory[key];
    if (!entry || typeof entry.quantity !== 'number') {
      store.inventory[key] = {
        quantity,
        initial: quantity,
        updatedAt: now
      };
      mutated = true;
      return;
    }

    if (typeof entry.initial !== 'number') {
      entry.initial = quantity;
      mutated = true;
    }
    if (!entry.updatedAt) {
      entry.updatedAt = now;
      mutated = true;
    }
  });

  if (cleanupExpiredHolds(store)) {
    mutated = true;
  }

  if (mutated || !data || typeof data !== 'object' || !data.inventory) {
    await writeStore(store);
  }

  return store;
};

const normalizeRequestItems = (items) => {
  if (!Array.isArray(items)) {
    throw new Error('items must be an array.');
  }

  const aggregated = new Map();

  items.forEach((raw) => {
    if (!raw || typeof raw.posterId !== 'string') {
      throw new Error('Each item must include a posterId.');
    }

    const posterId = raw.posterId.trim();
    if (!posterId) {
      throw new Error('posterId cannot be empty.');
    }

    const editionId = typeof raw.editionId === 'string' && raw.editionId.trim().length ? raw.editionId.trim() : null;
    const parsedQuantity = Number(raw.quantity ?? 1);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
      throw new Error('Each item quantity must be at least 1.');
    }

    const quantity = Math.floor(parsedQuantity);
    const inventoryKey = resolveInventoryKey(posterId, editionId);
    const source = {
      posterId,
      editionId,
      quantity
    };

    const existing = aggregated.get(inventoryKey);
    if (existing) {
      existing.quantity += quantity;
      existing.sources.push(source);
    } else {
      aggregated.set(inventoryKey, {
        inventoryKey,
        quantity,
        sources: [source]
      });
    }
  });

  return Array.from(aggregated.values());
};

const computeReservedQuantities = (store, { excludeHoldId = null } = {}) => {
  const reserved = {};
  Object.entries(store.holds ?? {}).forEach(([holdId, hold]) => {
    if (!hold || (excludeHoldId && holdId === excludeHoldId)) {
      return;
    }
    (hold.items ?? []).forEach((item) => {
      if (!item || typeof item.inventoryKey !== 'string') {
        return;
      }
      reserved[item.inventoryKey] = (reserved[item.inventoryKey] ?? 0) + Number(item.quantity ?? 0);
    });
  });
  return reserved;
};

const evaluateInventory = (store, aggregatedItems, { reservedMap = null } = {}) => {
  const shortages = [];
  const reservations = reservedMap ?? computeReservedQuantities(store);

  aggregatedItems.forEach((item) => {
    const entry = store.inventory[item.inventoryKey];
    const available = entry && typeof entry.quantity === 'number' ? entry.quantity : 0;
    const reserved = reservations[item.inventoryKey] ?? 0;
    const effectiveAvailable = Math.max(0, available - reserved);

    if (item.quantity > effectiveAvailable) {
      shortages.push({
        inventoryKey: item.inventoryKey,
        available: effectiveAvailable,
        requested: item.quantity,
        sources: item.sources
      });
    }
  });

  return {
    ok: shortages.length === 0,
    shortages
  };
};

const buildSnapshot = (store) => {
  const reservations = computeReservedQuantities(store);

  return Object.entries(store.inventory).reduce((acc, [key, entry]) => {
    const reserved = Math.max(0, reservations[key] ?? 0);
    const quantity = entry && typeof entry.quantity === 'number' ? entry.quantity : 0;
    acc[key] = {
      available: Math.max(0, quantity - reserved),
      initial: typeof entry.initial === 'number' ? entry.initial : quantity,
      updatedAt: entry.updatedAt ?? null,
      reserved
    };
    return acc;
  }, {});
};

const getStore = async () => {
  const data = await readStore();
  if (!data) {
    return ensureSeededInventory({});
  }

  return ensureSeededInventory(data);
};

const checkAvailability = async (items) => {
  const aggregated = normalizeRequestItems(items);
  const store = await getStore();
  const result = evaluateInventory(store, aggregated);

  return {
    ...result,
    snapshot: buildSnapshot(store)
  };
};

const reserveInventory = async (items, { holdId, holdSeconds = 600 } = {}) => {
  const aggregated = normalizeRequestItems(items);
  if (!aggregated.length) {
    throw new Error('No items supplied for reservation.');
  }

  const store = await getStore();
  const resolvedHoldId =
    typeof holdId === 'string' && holdId.trim().length ? holdId.trim() : `hold_${Date.now()}`;

  if (store.holds[resolvedHoldId]) {
    return {
      ok: true,
      holdId: resolvedHoldId,
      expiresAt: store.holds[resolvedHoldId].expiresAt,
      snapshot: buildSnapshot(store)
    };
  }

  const evaluation = evaluateInventory(store, aggregated);
  if (!evaluation.ok) {
    return {
      ...evaluation,
      snapshot: buildSnapshot(store)
    };
  }

  const expiresInMs = Math.max(1, Math.floor(Number(holdSeconds ?? 600) * 1000));
  const expiresAt = new Date(Date.now() + expiresInMs).toISOString();

  store.holds[resolvedHoldId] = {
    id: resolvedHoldId,
    items: aggregated.map((item) => ({
      inventoryKey: item.inventoryKey,
      quantity: item.quantity,
      sources: item.sources
    })),
    expiresAt
  };

  await writeStore(store);

  return {
    ok: true,
    holdId: resolvedHoldId,
    expiresAt,
    snapshot: buildSnapshot(store)
  };
};

const releaseHold = async (holdId) => {
  const resolvedHoldId = typeof holdId === 'string' && holdId.trim().length ? holdId.trim() : null;
  if (!resolvedHoldId) {
    throw new Error('holdId is required.');
  }

  const store = await getStore();
  if (!store.holds[resolvedHoldId]) {
    return {
      released: false,
      snapshot: buildSnapshot(store)
    };
  }

  delete store.holds[resolvedHoldId];
  await writeStore(store);

  return {
    released: true,
    snapshot: buildSnapshot(store)
  };
};

const commitInventory = async (items, { orderId = null, sessionId = null, holdId = null } = {}) => {
  const aggregated = normalizeRequestItems(items);
  if (aggregated.length === 0) {
    throw new Error('No items provided for inventory commit.');
  }

  const store = await getStore();
  const resolvedHoldId = typeof holdId === 'string' && holdId.trim().length ? holdId.trim() : null;

  const resolvedOrderId = typeof orderId === 'string' && orderId.trim().length ? orderId.trim() : null;
  if (resolvedOrderId && store.orders[resolvedOrderId]) {
    if (resolvedHoldId && store.holds[resolvedHoldId]) {
      delete store.holds[resolvedHoldId];
      await writeStore(store);
    }
    return {
      ok: true,
      alreadyProcessed: true,
      snapshot: buildSnapshot(store),
      orderId: resolvedOrderId
    };
  }

  let targetItems = aggregated;
  if (resolvedHoldId && store.holds[resolvedHoldId]?.items?.length) {
    const mapped = store.holds[resolvedHoldId].items.map((holdItem) => {
      const sourceMatch = aggregated.find((entry) => entry.inventoryKey === holdItem.inventoryKey);
      return {
        inventoryKey: holdItem.inventoryKey,
        quantity: holdItem.quantity,
        sources: sourceMatch?.sources ?? holdItem.sources ?? []
      };
    });
    if (mapped.length) {
      targetItems = mapped;
    }
  }

  const reservedMap = computeReservedQuantities(store, { excludeHoldId: resolvedHoldId });
  const evaluation = evaluateInventory(store, targetItems, { reservedMap });
  if (!evaluation.ok) {
    if (resolvedHoldId && store.holds[resolvedHoldId]) {
      delete store.holds[resolvedHoldId];
      await writeStore(store);
    }
    return {
      ...evaluation,
      snapshot: buildSnapshot(store)
    };
  }

  const now = new Date().toISOString();

  targetItems.forEach((item) => {
    const entry = store.inventory[item.inventoryKey] ?? DEFAULT_ITEM_SHAPE();
    entry.quantity = Math.max(0, entry.quantity - item.quantity);
    entry.updatedAt = now;
    if (typeof entry.initial !== 'number') {
      entry.initial = entry.quantity + item.quantity;
    }
    store.inventory[item.inventoryKey] = entry;
  });

  if (resolvedOrderId) {
    store.orders[resolvedOrderId] = {
      sessionId: sessionId ?? null,
      committedAt: now,
      items: targetItems
    };
  }

  if (resolvedHoldId && store.holds[resolvedHoldId]) {
    delete store.holds[resolvedHoldId];
  }

  await writeStore(store);

  return {
    ok: true,
    snapshot: buildSnapshot(store),
    orderId: resolvedOrderId ?? undefined
  };
};

const getInventorySnapshot = async () => {
  const store = await getStore();
  return buildSnapshot(store);
};

module.exports = {
  resolveInventoryKey,
  checkAvailability,
  reserveInventory,
  releaseHold,
  commitInventory,
  getInventorySnapshot,
  normalizeRequestItems
};
