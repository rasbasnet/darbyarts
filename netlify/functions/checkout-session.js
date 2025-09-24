const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? require('stripe')(stripeSecretKey) : null;

const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

exports.handler = async (event) => {
  if (!stripe) {
    return jsonResponse(500, { error: 'Stripe secret key not configured on the server.' });
  }

  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  const sessionId = event.path.split('/').pop();

  if (!sessionId) {
    return jsonResponse(400, { error: 'session_id is required.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product']
    });

    return jsonResponse(200, {
      id: session.id,
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
      customerName: session.customer_details?.name ?? null,
      metadata: session.metadata ?? null,
      lineItems: session.line_items?.data.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        amountSubtotal: item.amount_subtotal,
        amountTotal: item.amount_total,
        currency: item.currency,
        description: item.description,
        product: item.price?.product && typeof item.price.product === 'object'
          ? {
              id: item.price.product.id,
              name: item.price.product.name,
              images: item.price.product.images
            }
          : null
      })) ?? []
    });
  } catch (error) {
    console.error('Stripe session lookup error', error);
    return jsonResponse(500, { error: 'Unable to retrieve checkout session.' });
  }
};
