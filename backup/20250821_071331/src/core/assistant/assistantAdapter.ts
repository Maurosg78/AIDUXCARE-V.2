import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { routeQuery as localRoute } from './dataLookup';
import { logAction } from '../../analytics/events';

export type DataIntent = 'age' | 'mri' | 'todayAppointments' | 'pendingNotes';

export type AssistantRoute = { 
  type: 'data' | 'llm' | 'both' | 'free'; 
  dataIntent?: DataIntent; 
  entities: Record<string, string>;
  confidence: number;
};

export type AssistantResult = {
  ok: boolean;
  routeType: 'data' | 'llm' | 'both';
  answerMarkdown?: string;
  data?: unknown;
  entities?: unknown[];
  error?: string;
  tookMs: number;
  confidence: number;
};

// Mocks temporales para cuando las Functions no estén disponibles
const mockDataLookup = async (intent: string, _params: Record<string, unknown>): Promise<{ ok: boolean; answerMarkdown: string; data?: Record<string, unknown> }> => {
  console.info('[Assistant] Usando mock para data lookup:', intent);
  
  switch (intent) {
    case 'todayAppointments':
      return { ok: true, answerMarkdown: 'Tienes 2 citas programadas para hoy.', data: { count: 2 } };
    case 'pendingNotes':
      return { ok: true, answerMarkdown: 'Tienes 3 notas clínicas pendientes de revisión.', data: { total: 3 } };
    case 'age':
      return { ok: true, answerMarkdown: 'El paciente tiene 35 años.', data: { age: 35 } };
    case 'mri':
      return { ok: true, answerMarkdown: 'Última resonancia: 15/08/2024 - Sin hallazgos significativos.', data: { date: '2024-08-15' } };
    default:
      return { ok: false, answerMarkdown: 'Intención no soportada.' };
  }
};

const mockLLMQuery = async (input: string): Promise<{ ok: boolean; answerMarkdown: string; entities: Record<string, unknown>[] }> => {
  console.info('[Assistant] Usando mock para LLM query:', input);
  
  return {
    ok: true,
    answerMarkdown: `Respuesta simulada para: "${input}". Esta es una respuesta de prueba mientras se configuran las Functions.`,
    entities: [
      { type: 'medication', name: 'Ibuprofeno', dosage: '400mg', frequency: 'c/8h' }
    ]
  };
};

// Configuración de Firebase Functions
const getFirebaseFunctions = () => {
  try {
    // Usar región por defecto correcta para UAT
    const region = 'europe-west1';
    const functions = getFunctions();
    
    // Configurar región
    functions.region = region;
    
    // Conectar a emuladores en desarrollo
    if (typeof window !== 'undefined' && (window as any).import?.meta?.env?.DEV) {
      try {
        connectFunctionsEmulator(functions, '127.0.0.1', 5001);
        console.info(`[Assistant] Conectado a emulador Functions en puerto 5001`);
      } catch (_error) {
        console.warn('[Assistant] Emulador Functions ya conectado o no disponible');
      }
    }
    
    return functions;
  } catch (error) {
    console.warn('[Assistant] Error configurando Functions, usando mocks:', error);
    return null;
    
  }
};

export function routeQuery(input: string): AssistantRoute {
  const query = input.toLowerCase();
  
  // Detectar intención mixta (datos + conocimiento clínico) - PRIORIDAD ALTA
  const hasDataKeywords = /(edad|años|age|resonancia|mri|rmn|citas|agenda|notas|pendientes)/i.test(query);
  const hasClinicalKeywords = /(medicamento|dosis|tratamiento|diagnóstico|síntoma|dolor|terapia|ejercicios|ejercicio|recomiendas|recomiendo|recomendar)/i.test(query);
  
  // Si es consulta mixta, retornar inmediatamente
  if (hasDataKeywords && hasClinicalKeywords) {
    return { type: 'both', entities: {}, confidence: 0.7 };
  }
  
  // Si no es mixta, entonces procesar con localRoute
  const r = localRoute(input);
  
  // Map local routed kinds to adapter shape
  switch (r) {
    case 'data:age':
      return { type: 'data', dataIntent: 'age', entities: {}, confidence: 0.95 };
    case 'data:mri':
      return { type: 'data', dataIntent: 'mri', entities: {}, confidence: 0.95 };
    case 'data:appointments':
      return { type: 'data', dataIntent: 'todayAppointments', entities: {}, confidence: 0.95 };
    case 'data:notes':
      return { type: 'data', dataIntent: 'pendingNotes', entities: {}, confidence: 0.95 };
    default:
      // Determinar tipo basado en keywords
      if (hasClinicalKeywords) {
        // Las consultas de medicamentos van a 'free', las de ejercicios/terapia van a 'llm'
        if (/(medicamento|dosis|medicina|pastilla|tableta)/i.test(query)) {
          return { type: 'free', entities: {}, confidence: 0.8 };
        } else {
          return { type: 'llm', entities: {}, confidence: 0.8 };
        }
      } else if (hasDataKeywords) {
        return { type: 'data', entities: {}, confidence: 0.6 };
      } else {
        return { type: 'data', entities: {}, confidence: 0.3 };
      }
  }
}

export async function runAssistantQuery(params: { input: string; ctx?: Record<string, unknown> }): Promise<AssistantResult> {
  const started = performance.now();
  const uid = getAuth().currentUser?.uid;
  
  if (!uid) {
    return {
      ok: false,
      routeType: 'llm',
      error: 'Usuario no autenticado',
      tookMs: 0,
      confidence: 0
    };
  }

  try {
    const router = routeQuery(params.input);
    const functions = getFirebaseFunctions();

    // Si no hay Functions disponibles, usar mocks
    if (!functions) {
      console.warn('[Assistant] Functions no disponibles, usando mocks');
      
      if (router.type === 'data') {
        const mockResult = await mockDataLookup(router.dataIntent || 'age', params.ctx || {});
        return {
          ok: true,
          routeType: 'data',
          answerMarkdown: mockResult.answerMarkdown,
          data: mockResult.data,
          tookMs: performance.now() - started,
          confidence: router.confidence
        };
      }
      
      const mockResult = await mockLLMQuery(params.input);
      return {
        ok: true,
        routeType: 'llm',
        answerMarkdown: mockResult.answerMarkdown,
        entities: mockResult.entities,
        tookMs: performance.now() - started,
        confidence: router.confidence
      };
    }

    // Usar Functions reales si están disponibles
    if (router.type === 'data') {
      // Consulta solo de datos internos
      const fn = httpsCallable(functions, 'assistantDataLookup');
      const res = await fn({ intent: router.dataIntent, params: params.ctx || {}, userId: uid });
      const tookMs = performance.now() - started;
      const payload = res.data as { answerMarkdown?: string; data?: unknown };
      await logAction('assistant_data_query', '/assistant');
      return { 
        ok: true, 
        routeType: 'data', 
        answerMarkdown: payload?.answerMarkdown, 
        data: payload?.data, 
        tookMs,
        confidence: router.confidence
      };
    }

    if (router.type === 'both') {
      // Consulta mixta: datos + LLM
      try {
        // Primero obtener datos
        const dataFn = httpsCallable(functions, 'assistantDataLookup');
        const dataRes = await dataFn({ intent: router.dataIntent, params: params.ctx || {}, userId: uid });
        
        // Luego procesar con LLM
        const llmFn = httpsCallable(functions, 'assistantQuery');
        const llmRes = await llmFn({ input: params.input, ctx: params.ctx || {}, userId: uid });
        
        const tookMs = performance.now() - started;
        const dataPayload = dataRes.data as { answerMarkdown?: string; data?: unknown };
        const llmPayload = llmRes.data as { answerMarkdown?: string; entities?: unknown[] };
        
        // Combinar respuestas
        const combinedAnswer = `${dataPayload?.answerMarkdown || ''}\n\n${llmPayload?.answerMarkdown || ''}`;
        
        await logAction('assistant_mixed_query', '/assistant');
        return { 
          ok: true, 
          routeType: 'both', 
          answerMarkdown: combinedAnswer, 
          data: dataPayload?.data,
          entities: llmPayload?.entities, 
          tookMs,
          confidence: router.confidence
        };
      } catch (error) {
        // Fallback a solo LLM si falla la consulta de datos
        const llmFn = httpsCallable(functions, 'assistantQuery');
        const llmRes = await llmFn({ input: params.input, ctx: params.ctx || {}, userId: uid });
        const tookMs = performance.now() - started;
        const llmPayload = llmRes.data as { answerMarkdown?: string; entities?: unknown[] };
        
        await logAction('assistant_llm_query', '/assistant');
        return { 
          ok: true, 
          routeType: 'llm', 
          answerMarkdown: llmPayload?.answerMarkdown, 
          entities: llmPayload?.entities, 
          tookMs,
          confidence: router.confidence * 0.8 // Reducir confianza por fallback
        };
      }
    }

    // Consulta solo de LLM
    const fn = httpsCallable(functions, 'assistantQuery');
    const res = await fn({ input: params.input, ctx: params.ctx || {}, userId: uid });
    const tookMs = performance.now() - started;
    const payload = res.data as { answerMarkdown?: string; entities?: unknown[] };
    await logAction('assistant_llm_query', '/assistant');
    return { 
      ok: true, 
      routeType: 'llm', 
      answerMarkdown: payload?.answerMarkdown, 
      entities: payload?.entities, 
      tookMs,
      confidence: router.confidence
    };
  } catch (error: unknown) {
    const tookMs = performance.now() - started;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error('[Assistant] Error en consulta:', errorMessage);
    await logAction('assistant_query_error', '/assistant');
    
    return {
      ok: false,
      routeType: 'llm', // Default route type
      error: errorMessage,
      tookMs,
      confidence: 0
    };
  }
}


