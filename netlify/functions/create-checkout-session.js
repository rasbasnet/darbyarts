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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_COUNTRIES = new Set(['US', 'CA']);

const normaliseString = (value) => (typeof value === 'string' ? value.trim() : '');
const normaliseCountry = (value) => normaliseString(value).toUpperCase();

const normaliseCustomer = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return { error: 'Customer details are required for checkout.' };
  }

  const name = normaliseString(raw.name);
  const email = normaliseString(raw.email).toLowerCase();
  const addressLine1 = normaliseString(raw.addressLine1);
  const addressLine2 = normaliseString(raw.addressLine2);
  const city = normaliseString(raw.city);
  const region = normaliseString(raw.region);
  const postalCode = normaliseString(raw.postalCode);
  const country = normaliseCountry(raw.country);

  const required = [name, email, addressLine1, city, region, postalCode, country];
  if (required.some((value) => !value)) {
    return { error: 'Complete shipping details are required before checking out.' };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: 'A valid email address is required before checking out.' };
  }

  if (!ALLOWED_COUNTRIES.has(country)) {
    return { error: 'Selected shipping country is not supported.' };
  }

  return {
    value: {
      name,
      email,
      address: {
        line1: addressLine1,
        line2: addressLine2 || undefined,
        city,
        state: region,
        postal_code: postalCode,
        country
      }
    }
  };
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

  const { items, posterId, editionId = null, quantity = 1, customer: rawCustomer } = body;

  const normalisedCustomer = normaliseCustomer(rawCustomer);
  if (normalisedCustomer.error) {
    return jsonResponse(400, { error: normalisedCustomer.error });
  }

  const checkoutCustomer = normalisedCustomer.value;

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
    lineItems.push({
      quantity: qty,
      price_data: {
        currency: poster.currency,
        unit_amount: unitAmount,
        product_data: {
          name,
          description: poster.description,
          images: [`${origin}/${imagePath}`]
        }
      }
    });
  }

  try {
    const createdCustomer = await stripe.customers.create({
      name: checkoutCustomer.name,
      email: checkoutCustomer.email,
      address: checkoutCustomer.address,
      shipping: {
        name: checkoutCustomer.name,
        address: checkoutCustomer.address
      },
      metadata: {
        checkout_source: 'poster_checkout'
      }
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${origin}/posters/checkout/result?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/posters/checkout/result?status=cancelled&session_id={CHECKOUT_SESSION_ID}`,
      line_items: lineItems,
      customer: createdCustomer.id,
      customer_email: checkoutCustomer.email,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA']
      },
      payment_intent_data: {
        receipt_email: checkoutCustomer.email,
        shipping: {
          name: checkoutCustomer.name,
          address: checkoutCustomer.address
        }
      },
      metadata: {
        items: JSON.stringify(Array.from(aggregated.values())),
        customer: JSON.stringify({
          name: checkoutCustomer.name,
          email: checkoutCustomer.email,
          addressLine1: checkoutCustomer.address.line1,
          addressLine2: checkoutCustomer.address.line2 ?? '',
          city: checkoutCustomer.address.city,
          region: checkoutCustomer.address.state,
          postalCode: checkoutCustomer.address.postal_code,
          country: checkoutCustomer.address.country
        })
      }
    });

    return jsonResponse(200, { sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout session error', error);
    return jsonResponse(500, { error: 'Unable to create checkout session.' });
  }
};
