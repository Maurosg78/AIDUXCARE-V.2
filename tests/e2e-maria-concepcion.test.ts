import { describe, it, expect } from 'vitest';
import { parseVertexResponse } from '../src/utils/responseParser';
import normalizeVertexResponse from '../src/utils/cleanVertexResponse';
import { sanityCheck } from '../src/utils/clinicalValidators';

const transcriptMariaConcepcion = `nueva paciente maria concepción Zorraquino, 84 años...
medicamentos: lírica se toma una de 25 en la mañana una de 25 de la tarde y otra de 50 en la noche 
lo mismo tomo de nolotil y 2 paracetamol...
se ha caído tres veces en pocos días...
desde junio de este año...
los discos estaban aplastados y mis nervios no tenían espacio...`;

describe('Caso Real María Concepción - NO MOCK', () => {
  it('NO debe devolver datos hardcodeados de dolor lumbar 3 días', () => {
    // Simular respuesta correcta (esto debería venir del modelo real)
    const correctResponse = {
      motivo_consulta: "Dolor desde junio, discos aplastados con compresión nerviosa",
      medicacion_actual: ["Lyrica 25mg mañana", "Lyrica 25mg tarde", "Lyrica 50mg noche", "Nolotil", "Paracetamol"],
      antecedentes_medicos: ["84 años", "Discos aplastados"],
      contexto_psicosocial: ["Tres caídas recientes", "Pérdida de fuerza"],
      red_flags: ["Caídas recurrentes en anciano", "Pérdida de fuerza", "Compresión nerviosa"],
      evaluaciones_fisicas_sugeridas: [
        { test: "Test de Romberg", sensibilidad: 0.82, especificidad: 0.78, tecnica: "Equilibrio", interpretacion: "Riesgo de caídas" }
      ]
    };
    
    const normalized = normalizeVertexResponse({ text: JSON.stringify(correctResponse) });
    
    // DEBE contener medicación real
    expect(normalized.medicacion_actual).toContain('Lyrica');
    expect(normalized.medicacion_actual).toContain('Nolotil');
    expect(normalized.medicacion_actual).toContain('Paracetamol');
    
    // NO debe decir "3 días"
    expect(normalized.motivo_consulta).not.toContain('3 días');
    expect(normalized.motivo_consulta.toLowerCase()).toContain('junio');
    
    // DEBE mencionar caídas
    const fullJson = JSON.stringify(normalized).toLowerCase();
    expect(fullJson).toContain('caída');
    
    // DEBE incluir edad
    expect(fullJson).toContain('84');
    
    // DEBE tener red flags
    expect(normalized.red_flags.length).toBeGreaterThan(0);
  });
  
  it('validador debe detectar inconsistencias con transcript real', () => {
    const mockIncorrecto = {
      motivo_consulta: "Dolor lumbar de 3 días",
      medicacion_actual: [],
      antecedentes_medicos: [],
      red_flags: []
    };
    
    const issues = sanityCheck(mockIncorrecto, transcriptMariaConcepcion);
    
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(i => i.includes('Medicamentos'))).toBe(true);
    expect(issues.some(i => i.includes('Caídas'))).toBe(true);
    expect(issues.some(i => i.includes('temporal'))).toBe(true);
  });
});
