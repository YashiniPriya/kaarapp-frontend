// Lightweight order service with retry and safe JSON parsing
async function safeParseJson(response) {
  try {
    return await response.json();
  } catch (e) {
    try {
      const text = await response.text();
      return JSON.parse(text);
    } catch (e2) {
      return null;
    }
  }
}

export async function fetchOrders({ maxRetries = 2 } = {}) {
  let attempt = 0;
  const url = '/api/orders';

  while (attempt <= maxRetries) {
    try {
      const resp = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
      if (!resp.ok) {
        const body = await safeParseJson(resp) || {};
        const message = body.message || `Server returned ${resp.status}`;
        return { ok: false, status: resp.status, message };
      }

      const data = await safeParseJson(resp);
      if (!data) return { ok: false, message: 'Invalid JSON from server' };
      return { ok: true, data };
    } catch (err) {
      // network or parsing error
      if (attempt === maxRetries) return { ok: false, message: 'Service unavailable' };
      attempt++;
    }
  }
}
