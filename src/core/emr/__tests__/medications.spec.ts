import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de Firestore - debe estar antes de importar el módulo
vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  collection: vi.fn(() => ({ id: 'mock-collection' })),
  getFirestore: vi.fn(() => ({})),
  serverTimestamp: vi.fn(() => new Date())
}));

// Mock de Firebase
vi.mock('../../lib/firebase', () => ({
  db: {}
}));

// Importar después de los mocks
import { addMedicationToVisit, formatSoapFromMedication } from '../MedicationService';
import { MedicationEntity } from '../../assistant/entities';

describe('MedicationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addMedicationToVisit', () => {
    it('debe agregar medicamento a la visita correctamente', async () => {
      const mockMedication: MedicationEntity = {
        kind: 'medication',
        confidence: 0.9,
        name: 'ibuprofeno',
        strength: '400 mg',
        frequency: 'cada 8 horas',
        durationDays: 7
      };

      const mockDocRef = { id: 'med-123' };
      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue(mockDocRef);

      const result = await addMedicationToVisit('visit-123', mockMedication);

      expect(vi.mocked(addDoc)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'ibuprofeno',
          strength: '400 mg',
          frequency: 'cada 8 horas',
          durationDays: 7,
          createdAt: expect.any(Date)
        })
      );

      expect(result).toBe('med-123');
    });

    it('debe manejar medicamentos sin campos opcionales', async () => {
      const mockMedication: MedicationEntity = {
        kind: 'medication',
        confidence: 0.8,
        name: 'paracetamol'
      };

      const mockDocRef = { id: 'med-456' };
      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockResolvedValue(mockDocRef);

      const result = await addMedicationToVisit('visit-789', mockMedication);

      expect(result).toBe('med-456');
    });

    it('debe manejar errores de Firestore', async () => {
      const mockMedication: MedicationEntity = {
        kind: 'medication',
        confidence: 0.7,
        name: 'morfina',
        strength: '5 mg',
        frequency: 'cada 4 horas'
      };

      const { addDoc } = await import('firebase/firestore');
      vi.mocked(addDoc).mockRejectedValue(new Error('Error de Firestore'));

      await expect(addMedicationToVisit('visit-error', mockMedication))
        .rejects.toThrow('Error de Firestore');

      const soapSnippet = formatSoapFromMedication(mockMedication);
      expect(soapSnippet).toContain('**Medicación:** morfina');
      expect(soapSnippet).toContain('**Dosis:** 5 mg');
      expect(soapSnippet).toContain('**Frecuencia:** cada 4 horas');
    });
  });
});
