/**
 * @fileoverview Tests de integración para servicios principales
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TranscriptProcessor } from '../../services/TranscriptProcessor';
import PatientService from '../../services/patientService';
import { appointmentService } from '../../services/appointmentService';

// Mock de Firebase
vi.mock('../../lib/firebase', () => ({
  db: {},
  auth: {}
}));

describe('Servicios de Integración', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TranscriptProcessor', () => {
    it('debe extraer entidades clínicas de transcripción', () => {
      const transcript = 'El paciente presenta dolor cervical y rigidez muscular';
      const entities = TranscriptProcessor.extractClinicalEntities(transcript);
      
      expect(entities).toBeDefined();
      expect(Array.isArray(entities)).toBe(true);
      expect(entities.length).toBeGreaterThan(0);
    });

    it('debe generar insights clínicos', () => {
      const transcript = 'Dolor en la rodilla derecha con inflamación';
      const entities = TranscriptProcessor.extractClinicalEntities(transcript);
      const insights = TranscriptProcessor.generateClinicalInsights(entities);
      
      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
    });

    it('debe procesar transcripción completa', () => {
      const transcript = 'Paciente con dolor lumbar irradiado a la pierna';
      const result = TranscriptProcessor.processTranscript(transcript);
      
      expect(result).toBeDefined();
      expect(result.entities).toBeDefined();
      expect(result.insights).toBeDefined();
    });
  });

  describe('PatientService', () => {
    it('debe tener métodos estáticos definidos', () => {
      expect(typeof PatientService.searchPatients).toBe('function');
      expect(typeof PatientService.getAllPatients).toBe('function');
      expect(typeof PatientService.createPatient).toBe('function');
      expect(typeof PatientService.getPatientById).toBe('function');
      expect(typeof PatientService.updatePatient).toBe('function');
    });
  });

  describe('AppointmentService', () => {
    it('debe tener métodos estáticos definidos', () => {
      expect(typeof appointmentService.getAppointments).toBe('function');
      expect(typeof appointmentService.createAppointment).toBe('function');
      expect(typeof appointmentService.getAppointmentById).toBe('function');
      expect(typeof appointmentService.updateAppointment).toBe('function');
      expect(typeof appointmentService.updateAppointmentStatus).toBe('function');
      expect(typeof appointmentService.getAppointmentsByPatient).toBe('function');
    });
  });
});
