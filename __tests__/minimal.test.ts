import { describe, it, expect } from 'vitest';

/**
 * Test funcional mínimo para verificar que el sistema de test funciona
 */
describe('Test funcional mínimo', () => {
  it('verifica que el sistema de test está configurado correctamente', () => {
    expect(1 + 1).toBe(2);
  });

  it('puede utilizar funciones de array', () => {
    const array = [1, 2, 3, 4, 5];
    expect(array.filter(x => x % 2 === 0)).toEqual([2, 4]);
  });

  it('puede trabajar con strings', () => {
    expect('AiDuxCare V.2').toContain('AiDux');
  });
}); 