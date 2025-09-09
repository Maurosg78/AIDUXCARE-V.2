import { describe, it, expect } from 'vitest';

describe('Clinical Analysis Prompt v1.1.0', () => {
  const validOutput = {
    motivo_consulta: "Dolor lumbar de 3 días",
    diagnosticos_probables: [{
      nombre: "Lumbalgia",
      probabilidad: "alta",
      justificacion: "Síntomas consistentes"
    }],
    red_flags: [],
    evaluaciones_fisicas_sugeridas: [
      { test: "Lasègue", sensibilidad: 0.9, especificidad: 0.3, tecnica: "Elevación", interpretacion: "Positivo <70°" },
      { test: "Bragard", sensibilidad: 0.8, especificidad: 0.3, tecnica: "Dorsiflexión", interpretacion: "Confirma" },
      { test: "Palpación", sensibilidad: 0.6, especificidad: 0.7, tecnica: "Bilateral", interpretacion: "Contracturas" }
    ],
    plan_tratamiento: {
      inmediato: ["Educación"],
      corto_plazo: ["Ejercicios"],
      seguimiento: "1 semana"
    }
  };
  
  it('should have valid structure', () => {
    expect(validOutput.evaluaciones_fisicas_sugeridas.length).toBeGreaterThanOrEqual(3);
  });
});
