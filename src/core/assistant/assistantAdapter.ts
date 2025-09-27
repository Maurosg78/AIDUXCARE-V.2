import { getFunctions } from "firebase/functions";

import logger from '@/shared/utils/logger';
// import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
// import { getAuth } from 'firebase/auth';

// import { logAction } from '../../analytics/events';

// import { routeQuery as localRoute } from './dataLookup';

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
  } catch (err) {
    console.error("assistantAdapter error:", err);
  }
}

