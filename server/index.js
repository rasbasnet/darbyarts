/* eslint-disable no-console */
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const inventory = require('./inventory');

const posters = require('../src/data/posters.json');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' }) : null;
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
const isPasswordGateEnabled =
  (process.env.POSTERS_REQUIRE_PASSWORD ?? '').toLowerCase() === 'true' ||
  (process.env.POSTERS_PASSWORD_REQUIRED ?? '').toLowerCase() === 'true';
const testAccessPassword = process.env.POSTER_TEST_ACCESS_PASSWORD || null;
const isTestAccessRequired = Boolean(testPriceCents) || isPasswordGateEnabled;

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

const app = express();
const port = process.env.PORT || 4242;

app.use(cors());
app.use(express.json());

const findPoster = (posterId) => posters.find((poster) => poster.id === posterId);

const resolveOrigin = (req) => {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }

  const headerOrigin = req.headers.origin;
  if (headerOrigin) {
    return headerOrigin.replace(/\/$/, '');
  }

  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;

  return `${protocol}://${host}`;
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/posters/access', (req, res) => {
  if (!isTestAccessRequired) {
    return res.json({ granted: true });
  }

  if (!testAccessPassword) {
    return res.status(500).json({ error: 'Access password not configured on the server.' });
  }

  const { password } = req.body ?? {};
  if (typeof password !== 'string' || password.trim() === '') {
    return res.status(400).json({ error: 'Password is required.' });
  }

  if (password !== testAccessPassword) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }

  return res.json({ granted: true });
});

app.post('/api/posters/inventory/check', async (req, res) => {
  try {
    const { items } = req.body ?? {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items supplied for availability check.' });
    }

    const result = await inventory.checkAvailability(items);
    if (!result.ok) {
      return res.status(409).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Inventory availability error', error);
    return res.status(500).json({ error: 'Unable to verify inventory.' });
  }
});

app.get('/api/posters/inventory/snapshot', async (_req, res) => {
  try {
    const snapshot = await inventory.getInventorySnapshot();
    return res.json({ snapshot });
  } catch (error) {
    console.error('Inventory snapshot error', error);
    return res.status(500).json({ error: 'Unable to load inventory.' });
  }
});

app.post('/api/posters/inventory/release', async (req, res) => {
  try {
    const { holdId } = req.body ?? {};
    if (typeof holdId !== 'string' || !holdId.trim()) {
      return res.status(400).json({ error: 'holdId is required.' });
    }
    const result = await inventory.releaseHold(holdId.trim());
    if (!result.released) {
      return res.status(404).json({ error: 'Hold not found or already released.' });
    }
    return res.json(result);
  } catch (error) {
    console.error('Inventory release error', error);
    return res.status(500).json({ error: 'Unable to release inventory hold.' });
  }
});

app.post('/api/posters/inventory/commit', async (req, res) => {
  try {
    const { sessionId } = req.body ?? {};
    if (typeof sessionId !== 'string' || !sessionId.trim()) {
      return res.status(400).json({ error: 'sessionId is required.' });
    }

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe secret key not configured on the server.' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId.trim());
    if (!session) {
      return res.status(404).json({ error: 'Checkout session not found.' });
    }

    if (session.payment_status !== 'paid') {
      return res.status(409).json({ error: 'Payment has not completed.' });
    }

    const rawItems = session.metadata?.items;
    const holdId = typeof session.metadata?.holdId === 'string' ? session.metadata.holdId : null;
    if (typeof rawItems !== 'string') {
      return res.status(400).json({ error: 'Checkout metadata missing line items.' });
    }

    let parsedItems;
    try {
      parsedItems = JSON.parse(rawItems);
    } catch (parseError) {
      console.error('Unable to parse checkout metadata', parseError);
      return res.status(400).json({ error: 'Checkout metadata is invalid.' });
    }

    if (!Array.isArray(parsedItems) || !parsedItems.length) {
      return res.status(400).json({ error: 'No purchasable items recorded for this checkout.' });
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent && typeof session.payment_intent === 'object'
          ? session.payment_intent.id
          : null;

    const result = await inventory.commitInventory(parsedItems, {
      orderId: paymentIntentId ?? session.id,
      sessionId: session.id,
      holdId
    });

    if (!result.ok) {
      return res.status(409).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Inventory commit error', error);
    return res.status(500).json({ error: 'Unable to update inventory.' });
  }
});

app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe secret key not configured on the server.' });
    }

    const { items, posterId, editionId = null, quantity = 1 } = req.body;

    const requestedItems = Array.isArray(items) && items.length > 0
      ? items
      : posterId
        ? [{ posterId, editionId, quantity }]
        : [];

    if (requestedItems.length === 0) {
      return res.status(400).json({ error: 'No items supplied for checkout.' });
    }

    const origin = resolveOrigin(req);

    const aggregated = new Map();
    for (const entry of requestedItems) {
      if (!entry || typeof entry.posterId !== 'string') {
        return res.status(400).json({ error: 'Each item must include a posterId.' });
      }

      const parsedQuantity = Number(entry.quantity ?? 1);
      if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
        return res.status(400).json({ error: 'Each item quantity must be at least 1.' });
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
        return res.status(409).json({
          error: 'One or more selected editions are sold out.',
          shortages: holdResult.shortages,
          snapshot: holdResult.snapshot
        });
      }

      holdReserved = true;
    } catch (availabilityError) {
      console.error('Inventory reservation failed', availabilityError);
      return res.status(500).json({ error: 'Unable to reserve inventory before checkout.' });
    }

    const lineItems = [];

    for (const { posterId: id, editionId: entryEditionId, quantity: qty } of aggregated.values()) {
      const poster = findPoster(id);
      if (!poster) {
        await releaseHoldIfNeeded();
        return res.status(404).json({ error: `Poster not found: ${id}` });
      }

      const edition = poster.editions?.find((variant) => variant.id === entryEditionId);
      if (poster.editions?.length && !edition) {
        await releaseHoldIfNeeded();
        return res.status(404).json({ error: `Edition not found for poster: ${id}` });
      }

      const unitAmount = resolveUnitAmount(poster, edition);

      const productData = {
        name: edition ? `${poster.title} — ${edition.label}` : poster.title,
        description: poster.description
      };

      const imageUrl = `${origin.replace(/\/$/, '')}/${poster.image.replace(/^\//, '')}`;
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

    return res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout session error', error);
    if (typeof releaseHoldIfNeeded === 'function') {
      await releaseHoldIfNeeded();
    }
    return res.status(500).json({ error: 'Unable to create checkout session.' });
  }
});

app.get('/api/stripe/checkout-session/:sessionId', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe secret key not configured on the server.' });
    }

    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required.' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product', 'payment_intent']
    });

    return res.json({
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
      customerName: session.customer_details?.name ?? null,
      lineItems: session.line_items?.data.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        amountSubtotal: item.amount_subtotal,
        amountTotal: item.amount_total,
        currency: item.currency,
        description: item.description,
        product: item.price?.product && typeof item.price.product === 'object' ? {
          id: item.price.product.id,
          name: item.price.product.name,
          images: item.price.product.images
        } : null
      })) ?? [],
      metadata: session.metadata ?? null,
      paymentIntentId:
        session.payment_intent && typeof session.payment_intent === 'object'
          ? session.payment_intent.id
          : typeof session.payment_intent === 'string'
            ? session.payment_intent
            : null
    });
  } catch (error) {
    console.error('Stripe session lookup error', error);
    return res.status(500).json({ error: 'Unable to retrieve checkout session.' });
  }
});

app.listen(port, () => {
  console.log(`Payment service listening on port ${port}`);
});
