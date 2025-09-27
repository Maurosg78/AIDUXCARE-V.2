import { describe, it, expect } from 'vitest';

import { cleanVertexResponse } from './cleanVertexResponse';

describe('cleanVertexResponse', () => {
  it('respeta evaluaciones si vienen desde el modelo', () => {
    const json = JSON.stringify({
      evaluaciones_fisicas_sugeridas: ["Test de Spurling", "ULNT nervio mediano"]
    });
    const out = cleanVertexResponse(json);
    expect(out.evaluaciones_fisicas_sugeridas).toEqual(["Test de Spurling", "ULNT nervio mediano"]);
  });

  it('usa fallback si faltan evaluaciones', () => {
    const json = JSON.stringify({ evaluaciones_fisicas_sugeridas: [] });
    const out = cleanVertexResponse(json);
    expect(out.evaluaciones_fisicas_sugeridas.length).toBeGreaterThan(0);
  });
});
