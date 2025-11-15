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
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    const snapshot = await inventory.getInventorySnapshot();
    return jsonResponse(200, { snapshot });
  } catch (error) {
    console.error('Inventory snapshot error', error);
    return jsonResponse(500, { error: 'Unable to load inventory.' });
  }
};
