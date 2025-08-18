import { setGlobalOptions } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';

// Configuración global para todas las funciones
setGlobalOptions({
  region: 'europe-west1',
  maxInstances: 10,
  memoryMiB: 512,
  timeoutSeconds: 60,
});

// Exportar funciones HTTP
export { assistantQuery } from './assistantQuery';
export { assistantDataLookup } from './assistantDataLookup';
export { processLocalTranscription } from './localTranscriptionProcessor';
export { getProTranscriptions } from './localTranscriptionProcessor';


