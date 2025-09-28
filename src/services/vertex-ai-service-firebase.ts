// @ts-nocheck
import { PromptFactory } from "../core/ai/PromptFactory-v3";

export async function analyzeWithVertexProxy(payload: {
  action: 'analyze';
  prompt?: string;
  transcript?: string;
  traceId?: string;
}) {
  // Si hay transcript, construir prompt con esquema JSON
  let finalPrompt = payload.prompt;
  if (payload.transcript && !payload.prompt) {
    const structuredPrompt = PromptFactory.create({
      contextoPaciente: "Paciente en evaluación fisioterapéutica",
      instrucciones: "Analiza la siguiente transcripción y extrae información clínica relevante.",
      transcript: payload.transcript
    });
    finalPrompt = structuredPrompt;
  }
  
  const url = 'https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy';
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: payload.action,
      prompt: finalPrompt,
      traceId: payload.traceId
    })
  });
  
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`vertexAIProxy HTTP ${r.status}: ${text}`);
  }
  return r.json();
}

export class VertexAIServiceViaFirebase {
  static async processWithNiagara(text: string) {
    if (!text || !text.trim()) return null;
    return analyzeWithVertexProxy({
      action: 'analyze',
      transcript: text,
      traceId: 'ui-niagara'
    });
  }
}

console.log("[OK] vertex-ai-service-firebase.ts integrated with PromptFactory");