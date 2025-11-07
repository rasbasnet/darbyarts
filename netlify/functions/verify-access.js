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

const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  const testPriceCents = parseTestPriceCents();
  if (!testPriceCents) {
    return jsonResponse(200, { granted: true });
  }

  const passwordEnv = process.env.POSTER_TEST_ACCESS_PASSWORD || null;
  if (!passwordEnv) {
    return jsonResponse(500, { error: 'Access password not configured on the server.' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (_error) {
    return jsonResponse(400, { error: 'Invalid JSON payload.' });
  }

  const password = typeof body.password === 'string' ? body.password.trim() : '';
  if (!password) {
    return jsonResponse(400, { error: 'Password is required.' });
  }

  if (password !== passwordEnv) {
    return jsonResponse(401, { error: 'Incorrect password.' });
  }

  return jsonResponse(200, { granted: true });
};
