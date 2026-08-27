// AI summary service that calls backend /api/summary with retries and safe parsing
async function safeParseJson(response) {
  try { return await response.json(); } catch (e) {
    try { const t = await response.text(); return JSON.parse(t); } catch (e2) { return null; }
  }
}

export async function getAiSummary(order, { maxRetries = 2 } = {}) {
  let attempt = 0;
  const url = '/api/summary';

  const payload = JSON.stringify(order);

  while (attempt <= maxRetries) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: payload,
      });

      if (!resp.ok) {
        const body = await safeParseJson(resp) || {};
        const message = body.message || `Server returned ${resp.status}`;
        return { ok: false, status: resp.status, message };
      }

      const data = await safeParseJson(resp);
      if (!data) return { ok: false, message: 'Invalid JSON from AI service' };
      return { ok: true, data };
    } catch (err) {
      if (attempt === maxRetries) return { ok: false, message: 'AI service unavailable' };
      attempt++;
    }
  }
}
