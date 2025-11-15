const apiBaseUrl = (process.env.REACT_APP_API_BASE_URL ?? '').replace(/\/$/, '');

const resolveEndpoint = (path: string) => (apiBaseUrl ? `${apiBaseUrl}${path}` : path);

const parseJson = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return (await response.json()) as any;
  } catch {
    return null;
  }
};

export type InventoryLineItem = {
  posterId: string;
  editionId?: string | null;
  quantity: number;
};

export type InventorySource = {
  posterId?: string | null;
  editionId?: string | null;
  quantity: number;
};

export type InventoryShortage = {
  inventoryKey: string;
  available: number;
  requested: number;
  sources?: InventorySource[];
};

export type InventorySnapshotEntry = {
  available: number;
  initial: number;
  updatedAt: string | null;
  reserved?: number;
};

export type InventorySnapshot = Record<string, InventorySnapshotEntry>;

export type InventoryCheckResult = {
  ok: boolean;
  shortages?: InventoryShortage[];
  snapshot?: InventorySnapshot | null;
};

export type InventoryCommitResult = {
  ok: boolean;
  shortages?: InventoryShortage[];
  snapshot?: InventorySnapshot | null;
  alreadyProcessed?: boolean;
  orderId?: string;
};

export type InventorySnapshotResponse = {
  snapshot: InventorySnapshot | null;
};

export type InventoryReleaseResponse = {
  released: boolean;
  snapshot?: InventorySnapshot | null;
};

const postJson = (path: string, body: Record<string, unknown>) =>
  fetch(resolveEndpoint(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

export const getInventorySnapshot = async (): Promise<InventorySnapshotResponse> => {
  let response: Response;
  try {
    response = await fetch(resolveEndpoint('/api/posters/inventory/snapshot'));
  } catch (networkError) {
    console.error('Inventory snapshot network error', networkError);
    throw new Error('Unable to load poster inventory. Check your connection and try again.');
  }

  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Unable to load poster inventory.');
  }

  return {
    snapshot: payload?.snapshot ?? null
  };
};

export const verifyInventory = async (items: InventoryLineItem[]): Promise<InventoryCheckResult> => {
  const response = await postJson('/api/posters/inventory/check', { items });
  const payload = await parseJson(response);

  if (response.status === 409) {
    return {
      ok: false,
      shortages: payload?.shortages ?? [],
      snapshot: payload?.snapshot ?? null
    };
  }

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Unable to verify poster inventory.');
  }

  return {
    ok: true,
    shortages: payload?.shortages ?? [],
    snapshot: payload?.snapshot ?? null
  };
};

export const commitInventoryFromSession = async (sessionId: string): Promise<InventoryCommitResult> => {
  const response = await postJson('/api/posters/inventory/commit', { sessionId });
  const payload = await parseJson(response);

  if (response.status === 409) {
    return {
      ok: false,
      shortages: payload?.shortages ?? [],
      snapshot: payload?.snapshot ?? null
    };
  }

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Unable to update poster inventory.');
  }

  return {
    ok: true,
    shortages: payload?.shortages ?? [],
    snapshot: payload?.snapshot ?? null,
    alreadyProcessed: Boolean(payload?.alreadyProcessed),
    orderId: payload?.orderId
  };
};

export const releaseInventoryHold = async (holdId: string): Promise<InventoryReleaseResponse> => {
  const response = await postJson('/api/posters/inventory/release', { holdId });
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Unable to release inventory hold.');
  }

  return {
    released: Boolean(payload?.released),
    snapshot: payload?.snapshot ?? null
  };
};
