import { describe, it, expect } from 'vitest';
import { extractEntities, validateExtractedEntities } from '../extractEntities';
import { MedicationEntity, DiagnosisEntity, ProcedureEntity, InstructionEntity } from '../entities';

describe('ExtractEntities System', () => {
  describe('extractEntities', () => {
    it('debe extraer medicamentos correctamente', () => {
      const input = 'Paciente toma ibuprofeno 400 mg cada 8 horas por 7 días';
      const entities = extractEntities(input);
      
      expect(entities).toHaveLength(1);
      expect(entities[0].kind).toBe('medication');
      
      const med = entities[0] as MedicationEntity;
      expect(med.name).toBe('ibuprofeno');
      expect(med.strength).toBe('400 mg');
      expect(med.frequency).toBe('cada 8 horas');
      expect(med.durationDays).toBe(7);
      expect(med.confidence).toBe(0.9);
    });

    it('debe extraer múltiples medicamentos', () => {
      const input = 'Tratamiento: paracetamol 500 mg y naproxeno 250 mg cada 12 horas';
      const entities = extractEntities(input);
      
      expect(entities).toHaveLength(2);
      expect(entities.every(e => e.kind === 'medication')).toBe(true);
      
      const med1 = entities[0] as MedicationEntity;
      const med2 = entities[1] as MedicationEntity;
      
      expect(med1.name).toBe('paracetamol');
      expect(med1.strength).toBe('500 mg');
      expect(med2.name).toBe('naproxeno');
      expect(med2.strength).toBe('250 mg');
    });

    it('debe extraer diagnósticos de dolor musculoesquelético', () => {
      const input = 'Paciente presenta lumbalgia crónica y cervicalgia aguda';
      const entities = extractEntities(input);
      
      expect(entities).toHaveLength(2);
      expect(entities.every(e => e.kind === 'diagnosis')).toBe(true);
      
      const diag1 = entities[0] as DiagnosisEntity;
      const diag2 = entities[1] as DiagnosisEntity;
      
      expect(diag1.label).toBe('lumbalgia crónica');
      expect(diag2.label).toBe('cervicalgia aguda');
      expect(diag1.confidence).toBe(0.9);
    });

    it('debe extraer diagnósticos neurológicos', () => {
      const input = 'Paciente con hernia discal L4-L5 y ciática derecha';
      const entities = extractEntities(input);
      
      expect(entities).toHaveLength(2);
      expect(entities.every(e => e.kind === 'diagnosis')).toBe(true);
      
      const diag1 = entities[0] as DiagnosisEntity;
      const diag2 = entities[1] as DiagnosisEntity;
      
      expect(diag1.label).toBe('hernia discal L4-L5');
      expect(diag2.label).toBe('ciática derecha');
    });

    it('debe extraer procedimientos de evaluación', () => {
      const input = 'Se realizó test de Lasègue positivo y escala de Tinetti 18/28';
      const entities = extractEntities(input);
      
      expect(entities).toHaveLength(2);
      expect(entities.every(e => e.kind === 'procedure')).toBe(true);
      
      const proc1 = entities[0] as ProcedureEntity;
      const proc2 = entities[1] as ProcedureEntity;
      
      expect(proc1.label).toBe('test de Lasègue');
      expect(proc2.label).toBe('escala de Tinetti');
      expect(proc1.confidence).toBe(0.9);
    });

    it('debe extraer técnicas de fisioterapia', () => {
      const input = 'Se aplicó terapia manual y ejercicios de fortalecimiento';
      const entities = extractEntities(input);
      
      expect(entities).toHaveLength(2);
      expect(entities.every(e => e.kind === 'procedure')).toBe(true);
      
      const proc1 = entities[0] as ProcedureEntity;
      const proc2 = entities[1] as ProcedureEntity;
      
      expect(proc1.label).toBe('terapia manual');
      expect(proc2.label).toBe('ejercicios de fortalecimiento');
    });

    it('debe extraer instrucciones de ejercicios', () => {
      const input = 'Hacer ejercicios de estiramiento 3 series de 10 repeticiones';
      const entities = extractEntities(input);
      
      expect(entities).toHaveLength(1);
      expect(entities[0].kind).toBe('instruction');
      
      const inst = entities[0] as InstructionEntity;
      expect(inst.text).toBe('Hacer ejercicios de estiramiento 3 series de 10 repeticiones');
      expect(inst.confidence).toBe(0.8);
    });

    it('debe extraer precauciones', () => {
      const input = 'Evitar movimientos bruscos y precaución con el dolor';
      const entities = extractEntities(input);
      
      expect(entities).toHaveLength(2);
      expect(entities.every(e => e.kind === 'instruction')).toBe(true);
      
      const inst1 = entities[0] as InstructionEntity;
      const inst2 = entities[1] as InstructionEntity;
      
      expect(inst1.text).toBe('Evitar movimientos bruscos');
      expect(inst2.text).toBe('precaución con el dolor');
    });

    it('debe manejar texto sin entidades médicas', () => {
      const input = 'El paciente llegó a la consulta a las 10:00 AM';
      const entities = extractEntities(input);
      
      expect(entities).toHaveLength(0);
    });

    it('debe extraer entidades mixtas correctamente', () => {
      const input = 'Paciente con lumbalgia toma ibuprofeno 400 mg, realizar ejercicios de estabilización lumbar';
      const entities = extractEntities(input);
      
      expect(entities.length).toBeGreaterThan(1);
      
      const hasDiagnosis = entities.some(e => e.kind === 'diagnosis');
      const hasMedication = entities.some(e => e.kind === 'medication');
      const hasProcedure = entities.some(e => e.kind === 'procedure');
      
      expect(hasDiagnosis).toBe(true);
      expect(hasMedication).toBe(true);
      expect(hasProcedure).toBe(true);
    });
  });

  describe('validateExtractedEntities', () => {
    it('debe validar entidades correctas', () => {
      const entities: MedicationEntity[] = [
        {
          kind: 'medication',
          name: 'ibuprofeno',
          strength: '400 mg',
          confidence: 0.9,
          route: 'oral'
        }
      ];
      
      const result = validateExtractedEntities(entities);
      
      expect(result.validEntities).toHaveLength(1);
      expect(result.qualityScore).toBe(0.9);
      expect(result.warnings).toHaveLength(0);
    });

    it('debe filtrar entidades de baja confianza', () => {
      const entities: MedicationEntity[] = [
        {
          kind: 'medication',
          name: 'ibuprofeno',
          confidence: 0.2, // Baja confianza
          route: 'oral'
        },
        {
          kind: 'medication',
          name: 'paracetamol',
          confidence: 0.8, // Alta confianza
          route: 'oral'
        }
      ];
      
      const result = validateExtractedEntities(entities);
      
      expect(result.validEntities).toHaveLength(1);
      // Verificar que sea un medicamento antes de acceder a .name
      const medication = result.validEntities[0];
      if (medication.kind === 'medication') {
        expect(medication.name).toBe('paracetamol');
      }
      expect(result.qualityScore).toBe(0.8);
    });

    it('debe detectar medicamentos sin nombre', () => {
      const entities: MedicationEntity[] = [
        {
          kind: 'medication',
          name: '', // Nombre vacío
          confidence: 0.9,
          route: 'oral'
        }
      ];
      
      const result = validateExtractedEntities(entities);
      
      expect(result.validEntities).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Medicamento sin nombre');
    });

    it('debe detectar diagnósticos sin etiqueta', () => {
      const entities: DiagnosisEntity[] = [
        {
          kind: 'diagnosis',
          label: '', // Etiqueta vacía
          confidence: 0.9,
          coding: []
        }
      ];
      
      const result = validateExtractedEntities(entities);
      
      expect(result.validEntities).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Diagnóstico sin etiqueta');
    });

    it('debe calcular calidad promedio correctamente', () => {
      const entities: MedicationEntity[] = [
        {
          kind: 'medication',
          name: 'med1',
          confidence: 0.8,
          route: 'oral'
        },
        {
          kind: 'medication',
          name: 'med2',
          confidence: 0.9,
          route: 'oral'
        },
        {
          kind: 'medication',
          name: 'med3',
          confidence: 0.7,
          route: 'oral'
        }
      ];
      
      const result = validateExtractedEntities(entities);
      
      expect(result.validEntities).toHaveLength(3);
      expect(result.qualityScore).toBe(0.8); // (0.8 + 0.9 + 0.7) / 3
    });

    it('debe manejar lista vacía', () => {
      const result = validateExtractedEntities([]);
      
      expect(result.validEntities).toHaveLength(0);
      expect(result.qualityScore).toBe(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Integración completa', () => {
    it('debe procesar consulta clínica completa', () => {
      const input = `Paciente con lumbalgia crónica toma ibuprofeno 400 mg cada 8 horas.
      Se realizó test de Lasègue positivo. Recomiendo ejercicios de estabilización lumbar
      y evitar movimientos bruscos.`;
      
      const entities = extractEntities(input);
      const validation = validateExtractedEntities(entities);
      
      expect(entities.length).toBeGreaterThan(3);
      expect(validation.validEntities.length).toBeGreaterThan(0);
      expect(validation.qualityScore).toBeGreaterThan(0.7);
      
      // Verificar tipos de entidades
      const hasDiagnosis = validation.validEntities.some(e => e.kind === 'diagnosis');
      const hasMedication = validation.validEntities.some(e => e.kind === 'medication');
      const hasProcedure = validation.validEntities.some(e => e.kind === 'procedure');
      const hasInstruction = validation.validEntities.some(e => e.kind === 'instruction');
      
      expect(hasDiagnosis || hasMedication || hasProcedure || hasInstruction).toBe(true);
    });
  });
});
