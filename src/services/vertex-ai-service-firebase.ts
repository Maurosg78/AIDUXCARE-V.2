export async function analyzeWithVertexProxy(payload: {
  action: 'analyze';
  prompt?: string;
  transcript?: string;
  traceId?: string;
}) {
  const url = 'https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy';
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`vertexAIProxy HTTP ${r.status}: ${text}`);
  }
  return r.json();
}
