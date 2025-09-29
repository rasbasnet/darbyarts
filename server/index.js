/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const posters = require('../src/data/posters.json');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' }) : null;

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

    const lineItems = [];

    for (const { posterId: id, editionId: entryEditionId, quantity: qty } of aggregated.values()) {
      const poster = findPoster(id);
      if (!poster) {
        return res.status(404).json({ error: `Poster not found: ${id}` });
      }

      const edition = poster.editions?.find((variant) => variant.id === entryEditionId);
      if (poster.editions?.length && !edition) {
        return res.status(404).json({ error: `Edition not found for poster: ${id}` });
      }

      const unitAmount = edition?.priceCents ?? poster.priceCents;

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
      success_url: `${origin}/posters/checkout/result?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/posters/checkout/result?status=cancelled&session_id={CHECKOUT_SESSION_ID}`,
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA']
      },
      metadata: {
        items: JSON.stringify(Array.from(aggregated.values()))
      }
    });

    return res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout session error', error);
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
      expand: ['line_items', 'line_items.data.price.product']
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
      metadata: session.metadata ?? null
    });
  } catch (error) {
    console.error('Stripe session lookup error', error);
    return res.status(500).json({ error: 'Unable to retrieve checkout session.' });
  }
});

app.listen(port, () => {
  console.log(`Payment service listening on port ${port}`);
});
