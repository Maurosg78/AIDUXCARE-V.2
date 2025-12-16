#!/usr/bin/env tsx
import crypto from 'node:crypto';

const VERTEX_URL = 'https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy';
const prompt = `You are AiduxCare's physiotherapy assistant. Summarize a simple Canadian physiotherapy consult focusing on observations, concerns, and safety.`;

async function main() {
  const traceId = `cli-virtual-assistant|${crypto.randomUUID()}`;
  const res = await fetch(VERTEX_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'analyze', prompt, traceId })
  });
  const data = await res.json();
  console.log('[Vertex CLI Test] status:', res.status);
  console.log('[Vertex CLI Test] traceId:', data.traceId);
  console.log('[Vertex CLI Test] response snippet:', (data.text || '').slice(0, 200));
}

main().catch((err) => {
  console.error('Vertex CLI test failed:', err);
  process.exit(1);
});
