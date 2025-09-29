const posters = require('../../src/data/posters.json');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? require('stripe')(stripeSecretKey) : null;

const findPoster = (posterId) => posters.find((poster) => poster.id === posterId);

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

  const lineItems = [];

  for (const { posterId: id, editionId: entryEditionId, quantity: qty } of aggregated.values()) {
    const poster = findPoster(id);
    if (!poster) {
      return jsonResponse(404, { error: `Poster not found: ${id}` });
    }

    let unitAmount = poster.priceCents;
    let name = poster.title;

    if (poster.editions?.length) {
      const edition = poster.editions.find((variant) => variant.id === entryEditionId);
      if (!edition) {
        return jsonResponse(404, { error: `Edition not found for poster: ${id}` });
      }
      unitAmount = edition.priceCents;
      name = `${poster.title} — ${edition.label}`;
    }

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

    return jsonResponse(200, { sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout session error', error);
    return jsonResponse(500, { error: 'Unable to create checkout session.' });
  }
};
