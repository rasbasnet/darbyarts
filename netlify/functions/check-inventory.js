const { connectLambda } = require('@netlify/blobs');
const inventory = require('../../server/inventory');

const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

exports.handler = async (event) => {
  try {
    connectLambda(event);
  } catch (error) {
    console.warn('Unable to initialise Netlify Blobs context', error);
  }
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return jsonResponse(400, { error: 'Invalid JSON payload.' });
  }

  const { items } = payload ?? {};
  if (!Array.isArray(items) || items.length === 0) {
    return jsonResponse(400, { error: 'No items supplied for availability check.' });
  }

  try {
    const result = await inventory.checkAvailability(items);
    if (!result.ok) {
      return jsonResponse(409, result);
    }

    return jsonResponse(200, result);
  } catch (error) {
    console.error('Inventory availability error', error);
    return jsonResponse(500, { error: 'Unable to verify inventory.' });
  }
};
