import { describe, expect, it } from 'vitest';

import type { TreatmentDecisionItem } from '../../services/sessionService';
import {
  hydrateTreatmentDecisionItems,
  isActiveTreatmentDecisionItem,
  markTreatmentDecisionItemRemoved,
  normalizeTreatmentDecisionItem,
} from '../treatmentDecisionItems';

describe('hydrateTreatmentDecisionItems', () => {
  it('preserva el tombstone internamente pero lo excluye del HEP activo', () => {
    const removedItem: TreatmentDecisionItem = {
      id: 'hep-removed',
      label: 'Ejercicio retirado por el fisioterapeuta',
      completed: false,
      removedPermanently: true,
      removedPermanentlyAt: '2026-07-29T17:15:00.000Z',
      removedPermanentlyBy: 'physio-uid',
    };

    const hydrated = hydrateTreatmentDecisionItems([removedItem]);

    expect(hydrated).toEqual([
      {
        id: 'hep-removed',
        label: 'Ejercicio retirado por el fisioterapeuta',
        completed: false,
        removedPermanently: true,
        removedPermanentlyAt: '2026-07-29T17:15:00.000Z',
        removedPermanentlyBy: 'physio-uid',
        source: 'plan',
      },
    ]);
    expect(hydrated.filter(isActiveTreatmentDecisionItem)).toEqual([]);
  });

  it('reconstruye el caso real de Luciana sin rehidratar la función móvil retirada', () => {
    const lucianaItems: TreatmentDecisionItem[] = [
      {
        id: 'hep-3',
        label: 'Fortalecimiento progresivo de prensión y pinza: Continuar fortalecimiento',
        completed: true,
      },
      {
        id: 'hep-4',
        label: 'Teclear con pulgar en móvil: Integrar función móvil',
        completed: false,
        removedPermanently: true,
        removedPermanentlyAt: '2026-07-29T17:15:00.000Z',
        removedPermanentlyBy: 'ff0w27nBbmMoVe1MnUOKq7gKEd32',
        removedPermanentlyReason: 'La pinza está recuperada al 100%.',
      },
    ];

    const hydrated = hydrateTreatmentDecisionItems(lucianaItems);
    const activeItems = hydrated.filter(isActiveTreatmentDecisionItem);

    expect(activeItems.map((item) => item.label)).toEqual([
      'Fortalecimiento progresivo de prensión y pinza: Continuar fortalecimiento',
    ]);
    expect(activeItems.some((item) => item.id === 'hep-4')).toBe(false);
    expect(hydrated.find((item) => item.id === 'hep-4')).toMatchObject({
      removedPermanently: true,
      removedPermanentlyAt: '2026-07-29T17:15:00.000Z',
      removedPermanentlyBy: 'ff0w27nBbmMoVe1MnUOKq7gKEd32',
      removedPermanentlyReason: 'La pinza está recuperada al 100%.',
    });
  });

  it('propaga el tombstone más allá de una única generación de hidratación', () => {
    const removedItem: TreatmentDecisionItem = {
      id: 'hep-4',
      label: 'Teclear con pulgar en móvil: Integrar función móvil',
      completed: false,
      removedPermanently: true,
      removedPermanentlyAt: '2026-07-29T17:15:00.000Z',
      removedPermanentlyBy: 'ff0w27nBbmMoVe1MnUOKq7gKEd32',
      removedPermanentlyReason: 'La pinza está recuperada al 100%.',
    };

    const secondSessionState = hydrateTreatmentDecisionItems([removedItem]);
    const secondSessionDecision = secondSessionState.map(normalizeTreatmentDecisionItem);
    const thirdSessionState = hydrateTreatmentDecisionItems(secondSessionDecision);

    expect(thirdSessionState.filter(isActiveTreatmentDecisionItem)).toEqual([]);
    expect(thirdSessionState).toEqual([
      expect.objectContaining({
        id: 'hep-4',
        removedPermanently: true,
        removedPermanentlyAt: '2026-07-29T17:15:00.000Z',
        removedPermanentlyBy: 'ff0w27nBbmMoVe1MnUOKq7gKEd32',
        removedPermanentlyReason: 'La pinza está recuperada al 100%.',
      }),
    ]);
  });

  it('mantiene un ítem simplemente desmarcado exactamente como hoy', () => {
    const uncheckedItem: TreatmentDecisionItem = {
      id: 'hep-4',
      label: 'Teclear con pulgar en móvil: Integrar función móvil',
      completed: false,
    };

    const hydrated = hydrateTreatmentDecisionItems([uncheckedItem]);

    expect(hydrated).toEqual([
      {
        id: 'hep-4',
        label: 'Teclear con pulgar en móvil: Integrar función móvil',
        completed: false,
        source: 'plan',
      },
    ]);
  });

  it('preserva la evidencia de quién, cuándo y por qué al normalizar la decisión', () => {
    const removedItem = markTreatmentDecisionItemRemoved({
      id: 'hep-4',
      label: 'Teclear con pulgar en móvil: Integrar función móvil',
      completed: true,
      source: 'plan',
    }, {
      removedPermanentlyAt: '2026-07-29T17:15:00.000Z',
      removedPermanentlyBy: 'ff0w27nBbmMoVe1MnUOKq7gKEd32',
      removedPermanentlyReason: '  La pinza está recuperada al 100%.  ',
    });
    const normalized = normalizeTreatmentDecisionItem(removedItem);

    expect(normalized).toMatchObject({
      completed: false,
      removedPermanently: true,
      removedPermanentlyAt: '2026-07-29T17:15:00.000Z',
      removedPermanentlyBy: 'ff0w27nBbmMoVe1MnUOKq7gKEd32',
      removedPermanentlyReason: 'La pinza está recuperada al 100%.',
    });
  });
});
