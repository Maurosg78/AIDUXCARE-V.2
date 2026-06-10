import { describe, it, expect } from 'vitest';
import { cleanDisplayText } from '../normalizers/normalizeClinicalResponse.shared';

describe('cleanDisplayText — FIX 2 verbose guard', () => {
  it('reemplaza texto largo (>30 chars) con canonical_name', () => {
    const verbose = 'dos pastillas, una por la mañana y una por la noche, de 1000 Janumet se llaman';
    expect(cleanDisplayText(verbose, 'Janumet')).toBe('Janumet');
  });

  it('reemplaza texto con ruido de transcripción (ok, perfecto…) con canonical_name', () => {
    expect(cleanDisplayText('un diazepam. Ok. De 2.5', 'Diazepam')).toBe('Diazepam');
    expect(cleanDisplayText('perfecto, tranquilmazin', 'Trankimazin')).toBe('Trankimazin');
    expect(cleanDisplayText('sí, claro', 'Algo')).toBe('Algo');
  });

  it('NO reemplaza texto limpio y corto', () => {
    expect(cleanDisplayText('Janumet 50/1000', 'Janumet')).toBe('Janumet 50/1000');
    expect(cleanDisplayText('tranquilmacín 25', 'Trankimazin')).toBe('tranquilmacín 25');
    expect(cleanDisplayText('diazepam 2.5', 'Diazepam')).toBe('diazepam 2.5');
  });

  it('NO reemplaza cuando canonical_name es null o undefined', () => {
    const verbose = 'texto muy largo con muchas palabras que supera los treinta caracteres';
    expect(cleanDisplayText(verbose, null)).toBe(verbose);
    expect(cleanDisplayText(verbose, undefined)).toBe(verbose);
  });

  it('NO reemplaza cuando canonical_name es cadena vacía', () => {
    const verbose = 'texto largo que supera el umbral de treinta caracteres exactamente ahora';
    expect(cleanDisplayText(verbose, '')).toBe(verbose);
  });
});
