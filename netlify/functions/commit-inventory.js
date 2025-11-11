const inventory = require('../../server/inventory');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? require('stripe')(stripeSecretKey) : null;

const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return jsonResponse(400, { error: 'Invalid JSON payload.' });
  }

  const { sessionId } = payload ?? {};
  if (typeof sessionId !== 'string' || !sessionId.trim()) {
    return jsonResponse(400, { error: 'sessionId is required.' });
  }

  if (!stripe) {
    return jsonResponse(500, { error: 'Stripe secret key not configured on the server.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId.trim());
    if (!session) {
      return jsonResponse(404, { error: 'Checkout session not found.' });
    }

    if (session.payment_status !== 'paid') {
      return jsonResponse(409, {
        error: 'Payment has not completed.',
        paymentStatus: session.payment_status
      });
    }

    const rawItems = session.metadata?.items;
    const holdId = typeof session.metadata?.holdId === 'string' ? session.metadata.holdId : null;
    if (typeof rawItems !== 'string') {
      return jsonResponse(400, { error: 'Checkout metadata missing line items.' });
    }

    let parsedItems;
    try {
      parsedItems = JSON.parse(rawItems);
    } catch (parseError) {
      console.error('Unable to parse checkout metadata', parseError);
      return jsonResponse(400, { error: 'Checkout metadata is invalid.' });
    }

    if (!Array.isArray(parsedItems) || !parsedItems.length) {
      return jsonResponse(400, { error: 'No purchasable items recorded for this checkout.' });
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
      return jsonResponse(409, result);
    }

    return jsonResponse(200, result);
  } catch (error) {
    console.error('Inventory commit error', error);
    return jsonResponse(500, { error: 'Unable to update inventory.' });
  }
};
