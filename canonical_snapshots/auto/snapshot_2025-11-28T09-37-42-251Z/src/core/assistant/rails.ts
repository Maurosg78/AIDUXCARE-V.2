// RAILS (Restricted AI Language System) para AiDuxCare
// Sistema de restricciones estrictas para consultas clínicas

export interface RailsContext {
  patientId?: string;
  encounterId?: string;
  clinicianRole?: string;
  allowedDomains?: string[];
}

// Dominios médicos permitidos
const MEDICAL_DOMAINS = [
  'fisioterapia', 'rehabilitación', 'terapia', 'tratamiento',
  'diagnóstico', 'síntomas', 'dolor', 'movilidad', 'funcionalidad',
  'medicamentos', 'medicación', 'dosis', 'posología',
  'ejercicios', 'protocolos', 'evaluación', 'seguimiento',
  'anatomía', 'biomecánica', 'neurología', 'ortopedia',
  'deportiva', 'geriátrica', 'pediátrica', 'respiratoria'
];

// Patrones de PII a detectar y sanitizar (ordenados de más específico a más genérico)
const PII_PATTERNS = [
  { pattern: /[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/g, replacement: '[EMAIL]' },
  { pattern: /\b[A-Z]{2}\d{8}[A-Z]\b/g, replacement: '[PASAPORTE]' }, // Formato español
  { pattern: /\b\d{8}[A-Z]\b/g, replacement: '[DNI]' }, // DNI español
  { pattern: /\b[A-Z]{1}\d{7}[A-Z]\b/g, replacement: '[NIE]' }, // NIE español
  { pattern: /\b\d{9}\b/g, replacement: '[TELÉFONO]' }, // Teléfonos españoles
  { pattern: /\b\d{1,2}[/. -]\d{1,2}[/. -]\d{2,4}\b/g, replacement: '[FECHA]' },
  { pattern: /\b\d{7,}\b/g, replacement: '[ID]' }, // DNIs, teléfonos largos (genérico, último)
];

// Dominios prohibidos (no médicos)
const PROHIBITED_DOMAINS = [
  'finanzas', 'precio', 'factura', 'política', 'marketing', 'impuestos',
  'ventas', 'comercial', 'publicidad', 'entretenimiento', 'deportes',
  'noticias', 'gossip', 'celebridades', 'moda', 'cocina', 'viajes'
];

/**
 * Sanitiza texto removiendo PII y validando dominio médico
 */
export function sanitizeForLLM(query: string, context?: RailsContext): string {
  const queryLower = query.toLowerCase();
  
  // 1. PRIMERO: Validación de dominio médico (antes de sanitizar)
  
  // Verificar si contiene dominios prohibidos
  const hasProhibitedDomain = PROHIBITED_DOMAINS.some(domain => 
    queryLower.includes(domain)
  );
  
  if (hasProhibitedDomain) {
    return 'NO_ANSWER: Consulta fuera del dominio médico';
  }

  // Verificar si contiene dominios médicos permitidos
  const hasMedicalDomain = MEDICAL_DOMAINS.some(domain => 
    queryLower.includes(domain)
  );

  // Si no tiene dominio médico claro, verificar por palabras clave médicas
  const medicalKeywords = [
    'dolor', 'lesión', 'tratamiento', 'ejercicio', 'movimiento',
    'articulación', 'músculo', 'hueso', 'nervio', 'inflamación',
    'recuperación', 'mejora', 'limitación', 'funcionalidad', 'paciente',
    'consulta', 'historial', 'informe', 'resultado', 'análisis'
  ];
  
  const hasMedicalKeywords = medicalKeywords.some(keyword => 
    queryLower.includes(keyword)
  );

  // Si no es médica, rechazar
  if (!hasMedicalDomain && !hasMedicalKeywords) {
    // Si la consulta es muy corta o genérica, dar mensaje específico
    if (query.length < 10 || /^(qué|que|como|cuál|cuando|dónde|donde|quién|quien|hola|buenos|buenas)\s*(es|está|hay|pasa|ocurre|días|tardes|noches)?/i.test(query)) {
      return 'NO_ANSWER: Consulta demasiado genérica. Por favor, sé más específico.';
    }
    return 'NO_ANSWER: Consulta no relacionada con fisioterapia o rehabilitación';
  }

  // 2. SEGUNDO: Sanitización PII (solo si es médica)
  let sanitized = query;
  PII_PATTERNS.forEach(({ pattern, replacement }) => {
    sanitized = sanitized.replace(pattern, replacement);
  });

  // 3. Validaciones específicas por contexto
  if (context?.patientId) {
    // En contexto de paciente, permitir referencias específicas
    sanitized = sanitized.replace(/\b(este|este paciente|él|ella)\b/gi, '[PACIENTE]');
    // Reemplazar "[PACIENTE] paciente" por "[PACIENTE]" (sin escapar corchetes)
    sanitized = sanitized.replace(/\[PACIENTE\]\s+(paciente)/gi, '[PACIENTE]');
    // Evitar duplicación de "paciente" - corregir el orden
    sanitized = sanitized.replace(/\b(paciente)\s+\[PACIENTE\]/gi, '[PACIENTE]');
  }

  // 4. Limpieza final
  sanitized = sanitized.trim();
  
  // Si la consulta es muy corta o genérica
  if (sanitized.length < 10) {
    return 'NO_ANSWER: Consulta demasiado genérica. Por favor, sé más específico.';
  }

  return sanitized;
}

/**
 * Valida si una consulta es apropiada para el contexto clínico
 */
export function validateClinicalQuery(query: string, context?: RailsContext): {
  isValid: boolean;
  reason?: string;
  sanitizedQuery?: string;
} {
  const sanitized = sanitizeForLLM(query, context);
  
  if (sanitized.startsWith('NO_ANSWER:')) {
    return {
      isValid: false,
      reason: sanitized.replace('NO_ANSWER: ', ''),
      sanitizedQuery: undefined
    };
  }

  return {
    isValid: true,
    sanitizedQuery: sanitized
  };
}

/**
 * Obtiene el nivel de confianza de una consulta basado en su contenido médico
 */
export function getClinicalConfidence(query: string): number {
  const queryLower = query.toLowerCase();
  let confidence = 0.5; // Base neutral

  // Verificar dominios prohibidos primero (alta prioridad)
  const PROHIBITED_DOMAINS = [
    'finanzas', 'precio', 'factura', 'política', 'marketing', 'impuestos',
    'ventas', 'comercial', 'publicidad', 'entretenimiento', 'deportes',
    'noticias', 'gossip', 'celebridades', 'moda', 'cocina', 'viajes'
  ];
  
  const hasProhibitedDomain = PROHIBITED_DOMAINS.some(domain => 
    queryLower.includes(domain)
  );
  
  if (hasProhibitedDomain) {
    return 0.2; // Confianza muy baja para dominios prohibidos
  }

  // Incrementar confianza por dominios médicos específicos
  MEDICAL_DOMAINS.forEach(domain => {
    if (queryLower.includes(domain)) {
      confidence += 0.15; // Reducido de 0.2 a 0.15
    }
  });

  // Incrementar por palabras clave técnicas (alta prioridad)
  const technicalKeywords = [
    'biomecánica', 'neurología', 'ortopedia', 'deportiva', 'geriátrica',
    'manipulación', 'técnica', 'protocolo', 'estabilización', 'rehabilitación'
  ];
  technicalKeywords.forEach(keyword => {
    if (queryLower.includes(keyword)) {
      confidence += 0.15; // Mantener peso alto para técnicas
    }
  });

  // Incrementar por palabras específicas de fisioterapia
  const physioKeywords = [
    'ejercicios', 'movimiento', 'articulación', 'músculo', 'hueso',
    'dolor', 'lesión', 'tratamiento', 'evaluación', 'seguimiento'
  ];
  physioKeywords.forEach(keyword => {
    if (queryLower.includes(keyword)) {
      confidence += 0.08; // Reducido de 0.1 a 0.08
    }
  });

  // Reducir confianza por consultas genéricas (pero menos agresivo)
  const genericPatterns = [
    /\b(ayuda|información|explicación)\b/gi
  ];
  
  genericPatterns.forEach(pattern => {
    if (pattern.test(query)) {
      confidence -= 0.05; // Reducción menor
    }
  });

  // Reducir confianza por consultas muy generales
  if (/^(qué|que|como|cuál|cuando|dónde|donde|quién|quien)\s+(es|está|hay|pasa|ocurre)/i.test(query)) {
    confidence -= 0.1; // Reducción por preguntas genéricas
  }

  // Si es muy técnica, asegurar confianza alta pero no máxima
  if (confidence > 0.8) {
    confidence = Math.min(0.95, confidence); // Cap en 0.95, no 1.0
  } else if (confidence >= 0.75) {
    // Si está cerca de 0.8, asegurar que pase el umbral
    confidence = Math.max(0.81, confidence);
  }

  // Si es consulta mixta (edad + ejercicios), moderar la confianza
  if (queryLower.includes('edad') && queryLower.includes('ejercicios')) {
    confidence = Math.min(0.85, confidence);
  }

  return Math.max(0.1, Math.min(1.0, confidence));
}


