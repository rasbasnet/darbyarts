const crypto = require('crypto');
const { connectLambda } = require('@netlify/blobs');
const posters = require('../../src/data/posters.json');
const inventory = require('../../server/inventory');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? require('stripe')(stripeSecretKey) : null;
const INVENTORY_HOLD_TTL_SECONDS = (() => {
  const parsed = Number(process.env.INVENTORY_HOLD_TTL_SECONDS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 900;
})();

const generateHoldId = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `hold_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const findPoster = (posterId) => posters.find((poster) => poster.id === posterId);

const parseTestPriceCents = () => {
  const raw = process.env.POSTER_TEST_PRICE_CENTS || process.env.REACT_APP_POSTER_TEST_PRICE_CENTS;
  if (!raw) {
    return null;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.round(value);
};

const testPriceCents = parseTestPriceCents();

const resolveUnitAmount = (poster, edition) => {
  if (testPriceCents) {
    return testPriceCents;
  }

  return edition?.priceCents ?? poster.priceCents;
};

const resolveShippingOption = () => {
  const amount = testPriceCents ? 0 : 1500;

  return [
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: {
          amount,
          currency: 'usd'
        },
        display_name: testPriceCents ? 'Test shipping (free)' : 'Flat rate shipping',
        delivery_estimate: {
          minimum: { unit: 'business_day', value: 5 },
          maximum: { unit: 'business_day', value: 10 }
        }
      }
    }
  ];
};

const normaliseOrigin = (event) => {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }

  const origin = event.headers?.origin || event.headers?.referer;
  if (origin) {
    return origin.replace(/\/$/, '');
  }

  return 'http://localhost:3000';
};

const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

exports.handler = async (event) => {
  if (event?.blobs) {
    try {
      connectLambda(event);
    } catch (error) {
      console.warn('Unable to initialise Netlify Blobs context', error);
    }
  }
  if (!stripe) {
    return jsonResponse(500, { error: 'Stripe secret key not configured on the server.' });
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (error) {
    return jsonResponse(400, { error: 'Invalid JSON payload.' });
  }

  const { items, posterId, editionId = null, quantity = 1 } = body;

  const requestedItems = Array.isArray(items) && items.length > 0
    ? items
    : posterId
      ? [{ posterId, editionId, quantity }]
      : [];

  if (!requestedItems.length) {
    return jsonResponse(400, { error: 'No items supplied for checkout.' });
  }

  const origin = normaliseOrigin(event);
  const aggregated = new Map();

  for (const entry of requestedItems) {
    if (!entry || typeof entry.posterId !== 'string') {
      return jsonResponse(400, { error: 'Each item must include a posterId.' });
    }

    const parsedQuantity = Number(entry.quantity ?? 1);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
      return jsonResponse(400, { error: 'Each item quantity must be at least 1.' });
    }

    const editionKey = typeof entry.editionId === 'string' ? entry.editionId : null;
    const key = `${entry.posterId}::${editionKey ?? 'default'}`;
    const existing = aggregated.get(key);
    if (existing) {
      existing.quantity += Math.floor(parsedQuantity);
    } else {
      aggregated.set(key, {
        posterId: entry.posterId,
        editionId: editionKey,
        quantity: Math.floor(parsedQuantity)
      });
    }
  }

  const aggregatedValues = Array.from(aggregated.values());
  const holdId = generateHoldId();
  let holdReserved = false;

  const releaseHoldIfNeeded = async () => {
    if (!holdReserved) {
      return;
    }
    holdReserved = false;
    try {
      await inventory.releaseHold(holdId);
    } catch (releaseError) {
      console.error('Inventory hold release error', releaseError);
    }
  };

  try {
    const holdResult = await inventory.reserveInventory(aggregatedValues, {
      holdId,
      holdSeconds: INVENTORY_HOLD_TTL_SECONDS
    });

    if (!holdResult.ok) {
      return jsonResponse(409, {
        error: 'One or more selected editions are sold out.',
        shortages: holdResult.shortages,
        snapshot: holdResult.snapshot
      });
    }

    holdReserved = true;
  } catch (availabilityError) {
    console.error('Inventory reservation failed', availabilityError);
    return jsonResponse(500, { error: 'Unable to reserve inventory before checkout.' });
  }

  const lineItems = [];

  for (const { posterId: id, editionId: entryEditionId, quantity: qty } of aggregated.values()) {
    const poster = findPoster(id);
    if (!poster) {
      await releaseHoldIfNeeded();
      return jsonResponse(404, { error: `Poster not found: ${id}` });
    }

    let unitAmount = poster.priceCents;
    let name = poster.title;
    let edition = null;

    if (poster.editions?.length) {
      edition = poster.editions.find((variant) => variant.id === entryEditionId);
      if (!edition) {
        await releaseHoldIfNeeded();
        return jsonResponse(404, { error: `Edition not found for poster: ${id}` });
      }
      name = `${poster.title} — ${edition.label}`;
    }

    unitAmount = resolveUnitAmount(poster, edition);

    const imagePath = poster.image.replace(/^\/+/, '');
    const productData = {
      name,
      description: poster.description
    };

    const imageUrl = `${origin}/${imagePath}`;
    if (!/^https?:\/\/localhost(?::\d+)?/i.test(imageUrl)) {
      productData.images = [imageUrl];
    }

    lineItems.push({
      quantity: qty,
      price_data: {
        currency: poster.currency,
        unit_amount: unitAmount,
        product_data: productData
      }
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_creation: 'always',
      invoice_creation: {
        enabled: true
      },
      success_url: `${origin}/posters/checkout/result?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/posters/checkout/result?status=cancelled&session_id={CHECKOUT_SESSION_ID}`,
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA']
      },
      shipping_options: resolveShippingOption(),
      metadata: {
        items: JSON.stringify(aggregatedValues),
        holdId
      }
    });

    return jsonResponse(200, { sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout session error', error);
    if (typeof releaseHoldIfNeeded === 'function') {
      await releaseHoldIfNeeded();
    }
    return jsonResponse(500, { error: 'Unable to create checkout session.' });
  }
};
