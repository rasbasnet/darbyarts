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

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (error) {
    return jsonResponse(400, { error: 'Invalid JSON payload.' });
  }

  const { holdId } = body ?? {};
  if (typeof holdId !== 'string' || !holdId.trim()) {
    return jsonResponse(400, { error: 'holdId is required.' });
  }

  try {
    const result = await inventory.releaseHold(holdId.trim());
    if (!result.released) {
      return jsonResponse(404, { error: 'Hold not found or already released.' });
    }
    return jsonResponse(200, result);
  } catch (error) {
    console.error('Inventory hold release error', error);
    return jsonResponse(500, { error: 'Unable to release inventory hold.' });
  }
};
