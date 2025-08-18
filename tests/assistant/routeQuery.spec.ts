import { describe, it, expect } from 'vitest';
import { routeQuery } from '../../src/core/assistant/assistantAdapter';

describe('assistant routeQuery', () => {
  it('detecta edad (data:age)', () => {
    const r = routeQuery('¿Cuál es la edad del paciente?');
    expect(r.type).toBe('data');
    expect(r.dataIntent).toBe('age');
  });

  it('detecta MRI (data:mri)', () => {
    const r = routeQuery('última resonancia mri');
    expect(r.type).toBe('data');
    expect(r.dataIntent).toBe('mri');
  });

  it('detecta citas de hoy (data:todayAppointments)', () => {
    const r = routeQuery('mis citas de hoy');
    expect(r.type).toBe('data');
    expect(r.dataIntent).toBe('todayAppointments');
  });

  it('detecta notas pendientes (data:pendingNotes)', () => {
    const r = routeQuery('notas pendientes');
    expect(r.type).toBe('data');
    expect(r.dataIntent).toBe('pendingNotes');
  });

  it('fallback a free para consultas clínicas generales', () => {
    const r = routeQuery('dosis típica de ibuprofeno 400 mg');
    expect(r.type).toBe('free');
  });
});


