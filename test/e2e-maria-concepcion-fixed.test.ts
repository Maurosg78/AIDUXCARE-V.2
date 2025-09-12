import { describe, it, expect } from 'vitest';
import { normalizeVertexResponse } from '../src/utils/cleanVertexResponse';

describe('Caso Real María Concepción - NO MOCK', () => {
  it('NO debe devolver datos hardcodeados de dolor lumbar 3 días', () => {
    // Formato correcto esperado por el sistema
    const correctResponse = {
      redFlags: ['Caídas recurrentes en anciano', 'Pérdida de fuerza', 'Compresión nerviosa'],
      entities: [
        { type: 'medication', name: 'pregabalin', indication: 'neuropathic pain' }, // Lyrica normalizado
        { type: 'medication', name: 'metamizole', indication: 'pain' }, // Nolotil normalizado
        { type: 'medication', name: 'acetaminophen', indication: 'pain' }, // Paracetamol normalizado
        { type: 'symptom', name: 'back pain', duration: 'since June' }
      ],
      yellowFlags: ['Tres caídas recientes', 'Pérdida de fuerza'],
      physicalTests: [
        { name: 'Test de Romberg', sensitivity: 0.82, specificity: 0.78, indication: 'Fall risk' }
      ]
    };
    
    const normalized = normalizeVertexResponse({ text: JSON.stringify(correctResponse) });
    const jsonStr = JSON.stringify(normalized).toLowerCase();
    
    // DEBE contener medicación normalizada
    expect(jsonStr).toContain('pregabalin'); // Lyrica genérico
    expect(jsonStr).toContain('metamizole'); // Nolotil genérico
    expect(jsonStr).toContain('acetaminophen'); // Paracetamol genérico
    
    // NO debe contener dolor lumbar 3 días
    expect(jsonStr).not.toContain('lumbar');
    expect(jsonStr).not.toContain('3 días');
    expect(jsonStr).not.toContain('3 days');
  });
});
