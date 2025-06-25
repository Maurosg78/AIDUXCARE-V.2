/**
 * TARGET: SERVICIO DE CHUNKING VITAL - Especificación exacta de Mauricio
 * Divide transcripciones largas en fragmentos semánticamente completos con solapamiento
 * OBJETIVO: Evitar procesamiento "sílaba por sílaba" y preservar contexto clínico
 */

// === INTERFACES EXACTAS SEGÚN ESPECIFICACIÓN ===

export interface Utterance {
  speaker: 'PATIENT' | 'THERAPIST' | 'UNKNOWN';
  text: string;
  timestamp?: string;
  confidence?: number;
}

export interface Chunk {
  id: string;
  utterances: Utterance[];
  startIndex: number;
  endIndex: number;
  metadata?: {
    totalWords: number;
    speakerTurns: number;
    hasSymptoms: boolean;
    hasExamination: boolean;
  };
}

export interface ChunkingConfig {
  chunkSize: number;    // Número de utterances por chunk (default: 8)
  overlap: number;      // Solapamiento entre chunks (default: 2)
  minChunkSize: number; // Mínimo de utterances válidas (default: 3)
  preserveDialogue: boolean; // Mantener turnos de conversación completos
}

// === FUNCIÓN PRINCIPAL DE CHUNKING ===

/**
 * FUNCIÓN PRINCIPAL: Chunking de transcripción según especificación de Mauricio
 * Divide utterances en chunks semánticamente completos con solapamiento
 */
export function chunkTranscript(
  transcript: Utterance[],
  chunkSize: number = 8,
  overlap: number = 2
): Chunk[] {
  console.log(`🔧 Iniciando chunking: ${transcript.length} utterances, tamaño=${chunkSize}, overlap=${overlap}`);
  
  const chunks: Chunk[] = [];
  let i = 0;

  while (i < transcript.length) {
    // Calcular índices con solapamiento
    const start = Math.max(0, i - overlap);
    const end = Math.min(transcript.length, i + chunkSize);
    const chunkUtterances = transcript.slice(start, end);

    // Solo crear chunk si tiene suficientes utterances
    if (chunkUtterances.length >= 3) {
      const chunk: Chunk = {
        id: `chunk_${chunks.length}`,
        utterances: chunkUtterances,
        startIndex: start,
        endIndex: end,
        metadata: analyzeChunkMetadata(chunkUtterances)
      };

      chunks.push(chunk);
      console.log(`📦 Chunk ${chunk.id}: ${chunk.utterances.length} utterances (${start}-${end})`);
    }

    // Avanzar considerando solapamiento
    i += chunkSize - overlap;
  }

  console.log(`SUCCESS: Chunking completado: ${chunks.length} chunks creados`);
  return chunks;
}

/**
 * FUNCIÓN AVANZADA: Chunking flexible según configuración
 */
export function chunkTranscriptAdvanced(
  transcript: Utterance[],
  config: ChunkingConfig
): Chunk[] {
  console.log(`AI: Chunking avanzado con config:`, config);

  if (config.preserveDialogue) {
    return chunkByDialogueTurns(transcript, config);
  } else {
    return chunkTranscript(transcript, config.chunkSize, config.overlap);
  }
}

/**
 * Chunking que preserva turnos completos de diálogo
 */
function chunkByDialogueTurns(transcript: Utterance[], config: ChunkingConfig): Chunk[] {
  const chunks: Chunk[] = [];
  let currentChunk: Utterance[] = [];
  let chunkIndex = 0;

  for (let i = 0; i < transcript.length; i++) {
    const utterance = transcript[i];
    currentChunk.push(utterance);

    // Verificar si completar chunk en cambio de hablante
    const isLastUtterance = i === transcript.length - 1;
    const nextUtteranceChangeSpeaker = !isLastUtterance && 
      transcript[i + 1].speaker !== utterance.speaker;

    const shouldCompleteChunk = 
      currentChunk.length >= config.chunkSize ||
      (nextUtteranceChangeSpeaker && currentChunk.length >= config.minChunkSize) ||
      isLastUtterance;

    if (shouldCompleteChunk && currentChunk.length >= config.minChunkSize) {
      const chunk: Chunk = {
        id: `chunk_${chunkIndex}`,
        utterances: [...currentChunk],
        startIndex: i - currentChunk.length + 1,
        endIndex: i + 1,
        metadata: analyzeChunkMetadata(currentChunk)
      };

      chunks.push(chunk);
      console.log(`SPEECH: Chunk diálogo ${chunk.id}: ${chunk.utterances.length} utterances`);
      
      // Mantener solapamiento
      const overlapStart = Math.max(0, currentChunk.length - config.overlap);
      currentChunk = currentChunk.slice(overlapStart);
      chunkIndex++;
    }
  }

  return chunks;
}

/**
 * Analizar metadata del chunk para optimización posterior
 */
function analyzeChunkMetadata(utterances: Utterance[]) {
  const totalWords = utterances.reduce((sum, u) => sum + u.text.split(' ').length, 0);
  const speakerTurns = new Set(utterances.map(u => u.speaker)).size;
  
  const combinedText = utterances.map(u => u.text).join(' ').toLowerCase();
  const hasSymptoms = /dolor|duele|molestia|siente|cuesta|problema|síntoma/.test(combinedText);
  const hasExamination = /evalúe|examine|flexione|presione|observe|palpe|mueva/.test(combinedText);

  return {
    totalWords,
    speakerTurns,
    hasSymptoms,
    hasExamination
  };
}

// === CONVERSIÓN DE TRANSCRIPCIÓN A UTTERANCES ===

/**
 * Convertir transcripción de texto plano a formato Utterance
 * VITAL: Esta función convierte el problema "sílaba por sílaba" a chunks semánticos
 */
export function parseTranscriptToUtterances(transcriptText: string): Utterance[] {
  console.log('📝 Convirtiendo transcripción a utterances...');
  
  // Dividir por líneas y limpiar
  const lines = transcriptText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const utterances: Utterance[] = [];

  for (const line of lines) {
    // Detectar formato explícito "HABLANTE: texto"
    const explicitMatch = line.match(/^(PACIENTE|TERAPEUTA|PATIENT|THERAPIST):\s*(.+)$/i);
    
    if (explicitMatch) {
      const [, speakerRaw, text] = explicitMatch;
      const speaker = normalizeSpeaker(speakerRaw);
      
      utterances.push({
        speaker,
        text: text.trim(),
        timestamp: new Date().toISOString(),
        confidence: 0.95 // Alta confianza para formato explícito
      });
    } else {
      // Para texto sin formato, intentar detectar hablante implícitamente
      const speaker = detectSpeakerFromText(line);
      
      utterances.push({
        speaker,
        text: line.trim(),
        timestamp: new Date().toISOString(),
        confidence: 0.7 // Menor confianza para detección implícita
      });
    }
  }

  console.log(`SUCCESS: ${utterances.length} utterances creadas`);
  return utterances;
}

/**
 * Normalizar nombres de hablantes
 */
function normalizeSpeaker(speakerRaw: string): 'PATIENT' | 'THERAPIST' | 'UNKNOWN' {
  const speaker = speakerRaw.toLowerCase();
  
  if (speaker.includes('paciente') || speaker.includes('patient')) {
    return 'PATIENT';
  } else if (speaker.includes('terapeuta') || speaker.includes('therapist') || speaker.includes('doctor')) {
    return 'THERAPIST';
  } else {
    return 'UNKNOWN';
  }
}

/**
 * Detectar hablante desde el contenido del texto
 */
function detectSpeakerFromText(text: string): 'PATIENT' | 'THERAPIST' | 'UNKNOWN' {
  const lowerText = text.toLowerCase();
  
  // Patrones típicos del PACIENTE
  const patientPatterns = [
    /me duele|siento|tengo|no puedo|me cuesta/,
    /desde hace|me pasa|me molesta|está peor|está mejor/,
    /cuando|si hago|me da|siento que/
  ];
  
  // Patrones típicos del TERAPEUTA
  const therapistPatterns = [
    /vamos a|necesito que|observe|recomiendo|el tratamiento/,
    /flexione|extienda|gire|presione|evalúe|examine/,
    /esto indica|parece|sugiere|el diagnóstico/
  ];
  
  // Verificar patrones del paciente
  if (patientPatterns.some(pattern => pattern.test(lowerText))) {
    return 'PATIENT';
  }
  
  // Verificar patrones del terapeuta
  if (therapistPatterns.some(pattern => pattern.test(lowerText))) {
    return 'THERAPIST';
  }
  
  return 'UNKNOWN';
}

// === FUNCIONES DE PROCESAMIENTO DE CHUNKS ===

/**
 * Procesar chunks con LLM (preparado para Claude/Gemini/GPT)
 */
export async function processChunkWithLLM(chunk: Chunk): Promise<any> {
  console.log(`AI: Procesando ${chunk.id} con ${chunk.utterances.length} utterances`);
  
  // Construir texto contextual del chunk
  const chunkText = chunk.utterances
    .map(u => `${u.speaker}: ${u.text}`)
    .join('\n');
  
  console.log(`📄 Texto del chunk:\n${chunkText}`);
  
  // Aquí se integraría con Claude/Gemini/GPT
  // Por ahora simulamos el procesamiento
  const mockResult = {
    chunkId: chunk.id,
    soapClassification: await simulateSOAPClassification(chunkText),
    processingTime: Date.now(),
    confidence: calculateChunkConfidence(chunk)
  };
  
  return mockResult;
}

/**
 * Simular clasificación SOAP (temporal hasta integrar LLM real)
 */
async function simulateSOAPClassification(chunkText: string) {
  const lowerText = chunkText.toLowerCase();
  
  // Clasificar fragmentos según contenido
  const sections = [];
  
  if (/me duele|siento|tengo|molesta/.test(lowerText)) {
    sections.push({ section: 'S', text: 'Síntomas reportados por el paciente' });
  }
  
  if (/observe|examine|flexione|presione/.test(lowerText)) {
    sections.push({ section: 'O', text: 'Hallazgos del examen físico' });
  }
  
  if (/indica|parece|sugiere|diagnóstico/.test(lowerText)) {
    sections.push({ section: 'A', text: 'Evaluación clínica' });
  }
  
  if (/recomiendo|tratamiento|plan|ejercicio/.test(lowerText)) {
    sections.push({ section: 'P', text: 'Plan de tratamiento' });
  }
  
  return sections;
}

/**
 * Calcular confianza del chunk
 */
function calculateChunkConfidence(chunk: Chunk): number {
  let confidence = 0.5; // Base
  
  // Bonificar por número adecuado de utterances
  if (chunk.utterances.length >= 5 && chunk.utterances.length <= 10) {
    confidence += 0.2;
  }
  
  // Bonificar por múltiples hablantes
  if (chunk.metadata?.speakerTurns && chunk.metadata.speakerTurns > 1) {
    confidence += 0.2;
  }
  
  // Bonificar por contenido clínico
  if (chunk.metadata?.hasSymptoms || chunk.metadata?.hasExamination) {
    confidence += 0.1;
  }
  
  return Math.min(0.95, confidence);
}

// === UTILIDADES DE DEBUGGING ===

/**
 * Mostrar información detallada de chunking para debugging
 */
export function debugChunking(chunks: Chunk[]): void {
  console.log('\n🔍 === DEBUG CHUNKING ===');
  console.log(`Total chunks: ${chunks.length}`);
  
  chunks.forEach((chunk, index) => {
    console.log(`\n📦 ${chunk.id}:`);
    console.log(`   Índices: ${chunk.startIndex} - ${chunk.endIndex}`);
    console.log(`   Utterances: ${chunk.utterances.length}`);
    console.log(`   Hablantes: ${new Set(chunk.utterances.map(u => u.speaker)).size}`);
    console.log(`   Palabras: ${chunk.metadata?.totalWords || 0}`);
    
    chunk.utterances.forEach((utterance, i) => {
      console.log(`   ${i + 1}. ${utterance.speaker}: ${utterance.text.substring(0, 50)}...`);
    });
  });
  
  console.log('\n🔍 === FIN DEBUG ===\n');
}

/**
 * Verificar solapamiento entre chunks
 */
export function verifyOverlap(chunks: Chunk[]): void {
  console.log('\nRELOAD: === VERIFICACIÓN SOLAPAMIENTO ===');
  
  for (let i = 0; i < chunks.length - 1; i++) {
    const currentChunk = chunks[i];
    const nextChunk = chunks[i + 1];
    
    const overlap = Math.max(0, currentChunk.endIndex - nextChunk.startIndex);
    console.log(`${currentChunk.id} ↔ ${nextChunk.id}: ${overlap} utterances de solapamiento`);
  }
  
  console.log('RELOAD: === FIN VERIFICACIÓN ===\n');
}

// === CONFIGURACIONES PREDEFINIDAS ===

export const CHUNKING_CONFIGS = {
  // Configuración estándar según especificación de Mauricio
  STANDARD: {
    chunkSize: 8,
    overlap: 2,
    minChunkSize: 3,
    preserveDialogue: false
  } as ChunkingConfig,
  
  // Para conversaciones cortas
  COMPACT: {
    chunkSize: 5,
    overlap: 1,
    minChunkSize: 2,
    preserveDialogue: true
  } as ChunkingConfig,
  
  // Para análisis detallado
  DETAILED: {
    chunkSize: 12,
    overlap: 3,
    minChunkSize: 4,
    preserveDialogue: false
  } as ChunkingConfig,
  
  // Para procesamiento rápido
  FAST: {
    chunkSize: 6,
    overlap: 1,
    minChunkSize: 3,
    preserveDialogue: false
  } as ChunkingConfig
};

// === EJEMPLOS DE USO ===

/**
 * EJEMPLO COMPLETO según especificación de Mauricio
 */
export async function exampleUsage() {
  console.log('TARGET: === EJEMPLO CHUNKING SEGÚN MAURICIO ===\n');
  
  // 1. Transcripción de ejemplo
  const transcriptText = `
TERAPEUTA: Hola, cuéntame qué te pasa.
PACIENTE: Me duele la zona lumbar desde hace 2 semanas.
TERAPEUTA: ¿El dolor baja por la pierna?
PACIENTE: Sí, llega hasta el tobillo izquierdo.
TERAPEUTA: Vamos a hacer una evaluación de movilidad.
PACIENTE: Me duele más al inclinarme hacia delante.
TERAPEUTA: Esto indica un compromiso L4-L5.
TERAPEUTA: Recomiendo Tecarterapia y ejercicios de core.
PACIENTE: ¿Cuánto tiempo de tratamiento necesito?
TERAPEUTA: Aproximadamente 8-10 sesiones, evaluando progreso.
  `.trim();
  
  // 2. Convertir a utterances
  const utterances = parseTranscriptToUtterances(transcriptText);
  
  // 3. Crear chunks
  const chunks = chunkTranscript(utterances, 8, 2);
  
  // 4. Debug información
  debugChunking(chunks);
  verifyOverlap(chunks);
  
  // 5. Procesar chunks
  console.log('AI: Procesando chunks...\n');
  for (const chunk of chunks) {
    const result = await processChunkWithLLM(chunk);
    console.log(`SUCCESS: ${chunk.id} procesado: ${result.soapClassification.length} clasificaciones SOAP`);
  }
  
  console.log('\nTARGET: === FIN EJEMPLO ===');
}

// Exportar configuración por defecto
export const DEFAULT_CONFIG = CHUNKING_CONFIGS.STANDARD; 