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
      vi.fn(addDoc).mockResolvedValue(mockDocRef);

      const result = await addMedicationToVisit('visit-123', mockMedication);

      expect(vi.fn(addDoc)).toHaveBeenCalledWith(
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
      vi.fn(addDoc).mockResolvedValue(mockDocRef);

      const result = await addMedicationToVisit('visit-789', mockMedication);

      expect(vi.fn(addDoc)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'paracetamol',
          createdAt: expect.any(Date)
        })
      );

      expect(result).toBe('med-456');
    });

    it('debe manejar errores de Firestore', async () => {
      const mockMedication: MedicationEntity = {
        kind: 'medication',
        confidence: 0.7,
        name: 'aspirina'
      };

      const { addDoc } = await import('firebase/firestore');
      vi.fn(addDoc).mockRejectedValue(new Error('Error de Firestore'));

      await expect(addMedicationToVisit('visit-error', mockMedication))
        .rejects.toThrow('Error de Firestore');
    });
  });

  describe('formatSoapFromMedication', () => {
    it('debe formatear medicamento completo correctamente', () => {
      const mockMedication: MedicationEntity = {
        kind: 'medication',
        confidence: 0.9,
        name: 'ibuprofeno',
        strength: '400 mg',
        frequency: 'cada 8 horas',
        durationDays: 7
      };

      const result = formatSoapFromMedication(mockMedication);

      expect(result).toContain('**Medicación:** ibuprofeno');
      expect(result).toContain('**Dosis:** 400 mg');
      expect(result).toContain('**Frecuencia:** cada 8 horas');
      expect(result).toContain('**Duración:** 7 días');
    });

    it('debe formatear medicamento básico correctamente', () => {
      const mockMedication: MedicationEntity = {
        kind: 'medication',
        confidence: 0.8,
        name: 'paracetamol'
      };

      const result = formatSoapFromMedication(mockMedication);

      expect(result).toContain('**Medicación:** paracetamol');
      expect(result).not.toContain('**Dosis:**');
      expect(result).not.toContain('**Frecuencia:**');
      expect(result).not.toContain('**Duración:**');
    });

    it('debe incluir instrucciones de administración', () => {
      const mockMedication: MedicationEntity = {
        kind: 'medication',
        confidence: 0.9,
        name: 'ketorolaco',
        strength: '10 mg',
        frequency: 'cada 6 horas',
        durationDays: 3,
        notes: 'Administrar con alimentos'
      };

      const result = formatSoapFromMedication(mockMedication);

      expect(result).toContain('**Instrucciones:** Administrar con alimentos');
    });

    it('debe manejar medicamentos con instrucciones personalizadas', () => {
      const mockMedication: MedicationEntity = {
        kind: 'medication',
        confidence: 0.8,
        name: 'morfina',
        strength: '5 mg',
        frequency: 'cada 4 horas',
        notes: 'Solo en caso de dolor intenso'
      };

      const result = formatSoapFromMedication(mockMedication);

      expect(result).toContain('**Instrucciones:** Solo en caso de dolor intenso');
    });
  });

  describe('Integración completa', () => {
    it('debe agregar medicamento y generar SOAP correctamente', async () => {
      const mockMedication: MedicationEntity = {
        kind: 'medication',
        confidence: 0.9,
        name: 'ketorolaco',
        strength: '10 mg',
        frequency: 'cada 6 horas',
        durationDays: 3
      };

      const mockDocRef = { id: 'med-789' };
      const { addDoc } = await import('firebase/firestore');
      vi.fn(addDoc).mockResolvedValue(mockDocRef);

      const medicationId = await addMedicationToVisit('visit-integration', mockMedication);
      expect(medicationId).toBe('med-789');

      const soapSnippet = formatSoapFromMedication(mockMedication);
      expect(soapSnippet).toContain('**Medicación:** ketorolaco');
      expect(soapSnippet).toContain('**Dosis:** 10 mg');
      expect(soapSnippet).toContain('**Frecuencia:** cada 6 horas');
      expect(soapSnippet).toContain('**Duración:** 3 días');

      expect(vi.fn(addDoc)).toHaveBeenCalledTimes(1);
      expect(vi.fn(addDoc)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'ketorolaco',
          strength: '10 mg',
          frequency: 'cada 6 horas',
          durationDays: 3,
          createdAt: expect.any(Date)
        })
      );
    });

    it('debe manejar flujo completo con errores', async () => {
      const mockMedication: MedicationEntity = {
        kind: 'medication',
        confidence: 0.7,
        name: 'morfina',
        strength: '5 mg',
        frequency: 'cada 4 horas'
      };

      const { addDoc } = await import('firebase/firestore');
      vi.fn(addDoc).mockRejectedValue(new Error('Error de Firestore'));

      await expect(addMedicationToVisit('visit-error', mockMedication))
        .rejects.toThrow('Error de Firestore');

      const soapSnippet = formatSoapFromMedication(mockMedication);
      expect(soapSnippet).toContain('**Medicación:** morfina');
      expect(soapSnippet).toContain('**Dosis:** 5 mg');
      expect(soapSnippet).toContain('**Frecuencia:** cada 4 horas');
    });
  });
});
