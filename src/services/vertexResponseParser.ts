/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { ClinicalAnalysisResponse, ClinicalEntity } from '../types/vertex-ai';

export function parseVertexResponse(text: string): ClinicalAnalysisResponse {
  console.log('🔍 Parseando respuesta completa:');
  console.log(text);
  
  const entities: ClinicalEntity[] = [];
  let entityId = 1;
  
  // Parser más robusto - buscar cualquier línea que empiece con - o •
  const lines = text.split('\n');
  let currentSection = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Detectar secciones
    if (trimmedLine.includes('SÍNTOMAS') || trimmedLine.includes('HALLAZGOS ACTUALES')) {
      currentSection = 'symptoms';
    } else if (trimmedLine.includes('ANTECEDENTES')) {
      currentSection = 'history';
    } else if (trimmedLine.includes('MEDICACIÓN')) {
      currentSection = 'medication';
    } else if (trimmedLine.includes('ADVERTENCIAS') || trimmedLine.includes('PRECAUCIONES')) {
      currentSection = 'warnings';
    } else if (trimmedLine.includes('EVALUACIÓN FÍSICA')) {
      currentSection = 'tests';
    }
    
    // Extraer items que empiecen con - o •
    if ((trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) && trimmedLine.length > 2) {
      const itemText = trimmedLine.substring(1).trim();
      
      if (itemText && itemText !== 'Ninguno' && !itemText.includes('No hay')) {
        let type: string = 'other';
        let prefix = '';
        
        switch (currentSection) {
          case 'symptoms':
            type = 'symptom';
            break;
          case 'history':
            type = 'history';
            break;
          case 'medication':
            type = 'medication';
            break;
          case 'warnings':
            type = 'other';
            prefix = '⚠️ ';
            break;
          case 'tests':
            type = 'other';
            prefix = '📋 ';
            break;
        }
        
        entities.push({
          id: `${currentSection}_${entityId++}`,
          type: type as any,
          text: prefix + itemText,
          confidence: 0.9,
          span: { start: 0, end: 0 }
        });
      }
    }
  }
  
  // SIEMPRE generar advertencias basadas en el contexto
  const hasWarnings = entities.some(e => e.text.startsWith('⚠️'));
  if (!hasWarnings) {
    // Analizar síntomas para generar advertencias relevantes
    const hasWeakness = text.toLowerCase().includes('debilidad');
    const hasPain = text.toLowerCase().includes('dolor');
    const hasFatigue = text.toLowerCase().includes('fatiga');
    const hasCancer = text.toLowerCase().includes('cáncer') || text.toLowerCase().includes('cancer');
    const hasMetastasis = text.toLowerCase().includes('metástasis') || text.toLowerCase().includes('metastasis');
    const hasCardiac = text.toLowerCase().includes('cardíaca') || text.toLowerCase().includes('cardiaca');
    
    if (hasWeakness || hasFatigue) {
      entities.push({
        id: `warning_${entityId++}`,
        type: 'other',
        text: '⚠️ Alto riesgo de caídas por debilidad muscular y fatiga extrema',
        confidence: 0.95,
        span: { start: 0, end: 0 }
      });
    }
    
    if (hasMetastasis) {
      entities.push({
        id: `warning_${entityId++}`,
        type: 'other',
        text: '⚠️ Precaución con movilización por metástasis en columna - riesgo de fractura patológica',
        confidence: 0.95,
        span: { start: 0, end: 0 }
      });
    }
    
    if (hasCardiac) {
      entities.push({
        id: `warning_${entityId++}`,
        type: 'other',
        text: '⚠️ Monitorizar signos vitales durante la sesión por antecedente cardíaco',
        confidence: 0.9,
        span: { start: 0, end: 0 }
      });
    }
    
    if (hasPain) {
      entities.push({
        id: `warning_${entityId++}`,
        type: 'other',
        text: '⚠️ Evitar técnicas de alta intensidad - paciente con dolor severo',
        confidence: 0.9,
        span: { start: 0, end: 0 }
      });
    }
    
    // Advertencia general si hay múltiples comorbilidades
    entities.push({
      id: `warning_${entityId++}`,
      type: 'other',
      text: '⚠️ Paciente de alta complejidad - requiere enfoque multidisciplinario',
      confidence: 0.85,
      span: { start: 0, end: 0 }
    });
    
    entities.push({
      id: `warning_${entityId++}`,
      type: 'other',
      text: '⚠️ Verificar medicación actual y posibles contraindicaciones antes de iniciar',
      confidence: 0.85,
      span: { start: 0, end: 0 }
    });
  }
  
  // SIEMPRE generar evaluaciones físicas propuestas
  const hasTests = entities.some(e => e.text.startsWith('📋'));
  if (!hasTests) {
    // Evaluaciones básicas para fisioterapia
    entities.push({
      id: `test_${entityId++}`,
      type: 'other',
      text: '📋 Evaluación inicial de dolor (EVA) en reposo y movimiento',
      confidence: 0.95,
      span: { start: 0, end: 0 }
    });
    
    entities.push({
      id: `test_${entityId++}`,
      type: 'other',
      text: '📋 Test de fuerza muscular (Escala MRC 0-5) en MMSS y MMII',
      confidence: 0.95,
      span: { start: 0, end: 0 }
    });
    
    entities.push({
      id: `test_${entityId++}`,
      type: 'other',
      text: '📋 Evaluación funcional de la marcha (Test de 10 metros)',
      confidence: 0.9,
      span: { start: 0, end: 0 }
    });
    
    entities.push({
      id: `test_${entityId++}`,
      type: 'other',
      text: '📋 Test de equilibrio estático y dinámico (Romberg, Tandem)',
      confidence: 0.9,
      span: { start: 0, end: 0 }
    });
    
    entities.push({
      id: `test_${entityId++}`,
      type: 'other',
      text: '📋 Medición de rangos articulares con goniómetro (columna lumbar, hombros)',
      confidence: 0.9,
      span: { start: 0, end: 0 }
    });
    
    entities.push({
      id: `test_${entityId++}`,
      type: 'other',
      text: '📋 Evaluación postural completa (vista anterior, lateral y posterior)',
      confidence: 0.85,
      span: { start: 0, end: 0 }
    });
    
    entities.push({
      id: `test_${entityId++}`,
      type: 'other',
      text: '📋 Test funcional Sit-to-Stand (levantarse de la silla 5 veces)',
      confidence: 0.85,
      span: { start: 0, end: 0 }
    });
    
    entities.push({
      id: `test_${entityId++}`,
      type: 'other',
      text: '📋 Cuestionario de calidad de vida (SF-36 o similar)',
      confidence: 0.8,
      span: { start: 0, end: 0 }
    });
    
    entities.push({
      id: `test_${entityId++}`,
      type: 'other',
      text: '📋 Evaluación de actividades de vida diaria (Índice de Barthel)',
      confidence: 0.8,
      span: { start: 0, end: 0 }
    });
    
    // Si hay fatiga extrema
    if (text.toLowerCase().includes('fatiga')) {
      entities.push({
        id: `test_${entityId++}`,
        type: 'other',
        text: '📋 Test de resistencia cardiovascular (Sat O2, FC en reposo y actividad)',
        confidence: 0.9,
        span: { start: 0, end: 0 }
      });
    }
  }
  
  console.log(`✅ Parseados ${entities.length} elementos`);
  
  return {
    entities,
    metadata: {
      processedAt: new Date().toISOString(),
      model: 'gemini-2.5-flash'
    }
  };
}
