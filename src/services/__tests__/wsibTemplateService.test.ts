/**
 * WSIB Template Service Unit Tests
 * 
 * Sprint 2B - Day 1: WSIB Templates
 * Coverage Target: >80%
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { WSIBTemplateService } from '../wsibTemplateService';
import type { SOAPNote } from '../../types/vertex-ai';
import type { Session } from '../sessionComparisonService';
import type { WSIBFormData, WSIBValidationResult } from '../../types/wsib';
import { Timestamp } from 'firebase/firestore';

// Mock data helpers
const createMockSOAPNote = (overrides?: Partial<SOAPNote>): SOAPNote => ({
  subjective: 'Patient reports lower back pain after lifting heavy box at work. Pain started 2 days ago.',
  objective: 'Limited range of motion in lumbar spine. Pain with flexion. Positive straight leg raise test.',
  assessment: 'Lumbar strain. Pre-injury status: Full functional capacity. Current status: Limited functional capacity.',
  plan: 'Manual therapy 2x per week for 6 weeks. Exercise therapy including core strengthening. Expected outcome: Improved functional capacity. Goals: Reduce pain, improve ROM, return to work.',
  ...overrides,
});

const createMockSession = (overrides?: Partial<Session>): Session => ({
  id: 'session-123',
  userId: 'user-123',
  patientId: 'patient-123',
  patientName: 'John Doe',
  transcript: 'Patient reports lower back pain...',
  soapNote: createMockSOAPNote(),
  physicalTests: [],
  timestamp: new Date('2025-01-15'),
  status: 'completed',
  sessionType: 'wsib',
  ...overrides,
});

const createMockPatientData = (overrides?: any) => ({
  id: 'patient-123',
  name: 'John Doe',
  fullName: 'John Doe',
  dateOfBirth: new Date('1980-01-01'),
  address: '123 Main St',
  city: 'Toronto',
  province: 'ON',
  postalCode: 'M5H 2N2',
  phone: '+14161234567',
  email: 'john.doe@example.com',
  wsibClaimNumber: 'WSIB-12345',
  dateOfInjury: new Date('2025-01-13'),
  ...overrides,
});

const createMockProfessionalData = (overrides?: any) => ({
  name: 'Dr. Jane Smith',
  displayName: 'Dr. Jane Smith',
  registrationNumber: 'ON-12345',
  cotoRegistration: 'ON-12345',
  clinicName: 'Toronto Physiotherapy Clinic',
  clinicAddress: '456 Clinic Ave',
  clinicCity: 'Toronto',
  clinicProvince: 'ON',
  clinicPostalCode: 'M5H 3K4',
  phone: '+14169876543',
  email: 'jane.smith@clinic.com',
  ...overrides,
});

describe('WSIBTemplateService', () => {
  describe('extractWSIBData', () => {
    test('extracts complete WSIB data from SOAP note and session', () => {
      const soapNote = createMockSOAPNote();
      const session = createMockSession();
      const patientData = createMockPatientData();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result).toBeDefined();
      expect(result.formType).toBe('functional-abilities-form');
      expect(result.formVersion).toBe('FAF-8');
      expect(result.patient.name).toBe('John Doe');
      expect(result.professional.name).toBe('Dr. Jane Smith');
      expect(result.professional.registrationNumber).toBe('ON-12345');
      expect(result.injury.workRelated).toBe(true);
      expect(result.compliance.cpoCompliant).toBe(true);
      expect(result.compliance.phipaCompliant).toBe(true);
      expect(result.compliance.wsibCompliant).toBe(true);
    });

    test('handles missing patient data fields gracefully', () => {
      const soapNote = createMockSOAPNote();
      const session = createMockSession();
      const patientData = { id: 'patient-123' }; // Minimal data
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.patient.name).toBe('John Doe'); // Falls back to session.patientName
      expect(result.patient.province).toBe('ON'); // Default value
      expect(result.patient.dateOfBirth).toBeInstanceOf(Date);
    });

    test('handles missing professional data fields gracefully', () => {
      const soapNote = createMockSOAPNote();
      const session = createMockSession();
      const patientData = createMockPatientData();
      const professionalData = { name: 'Test Physio' }; // Minimal data

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.professional.name).toBe('Test Physio');
      expect(result.professional.clinicProvince).toBe('ON'); // Default value
      expect(result.professional.registrationNumber).toBe(''); // Empty string fallback
    });

    test('extracts injury information from SOAP subjective section', () => {
      const soapNote = createMockSOAPNote({
        subjective: 'Patient injured lower back while lifting heavy box at work on January 13, 2025.',
      });
      const session = createMockSession();
      const patientData = createMockPatientData();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.injury.mechanismOfInjury).toBeTruthy();
      expect(result.injury.bodyPartAffected.length).toBeGreaterThan(0);
      expect(result.injury.injuryDescription).toBeTruthy();
    });

    test('extracts functional limitations from SOAP objective section', () => {
      const soapNote = createMockSOAPNote({
        objective: 'Limited lifting capacity. Restricted standing. Unable to walk long distances.',
      });
      const session = createMockSession();
      const patientData = createMockPatientData();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.clinical.functionalLimitations.length).toBeGreaterThan(0);
      expect(result.clinical.functionalLimitations.some(l => l.activity === 'Lifting')).toBe(true);
    });

    test('extracts treatment information from SOAP plan section', () => {
      const soapNote = createMockSOAPNote({
        plan: 'Manual therapy 2x per week for 6 weeks. Exercise therapy. Ultrasound. Goals: Reduce pain, improve ROM.',
      });
      const session = createMockSession();
      const patientData = createMockPatientData();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.treatment.modalities.length).toBeGreaterThan(0);
      expect(result.treatment.goals.length).toBeGreaterThan(0);
      expect(result.treatment.frequency).toBeTruthy();
    });

    test('handles Firestore Timestamp in session timestamp', () => {
      const mockTimestamp = Timestamp.fromDate(new Date('2025-01-15'));
      const session = createMockSession({
        timestamp: mockTimestamp as any,
      });
      const soapNote = createMockSOAPNote();
      const patientData = createMockPatientData();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.injury.dateOfInjury).toBeInstanceOf(Date);
      expect(result.treatment.startDate).toBeInstanceOf(Date);
    });

    test('handles Date object in session timestamp', () => {
      const session = createMockSession({
        timestamp: new Date('2025-01-15'),
      });
      const soapNote = createMockSOAPNote();
      const patientData = createMockPatientData();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.injury.dateOfInjury).toBeInstanceOf(Date);
      expect(result.treatment.startDate).toBeInstanceOf(Date);
    });
  });

  describe('generateFunctionalAbilitiesForm', () => {
    test('generates FAF-8 form with correct form type and version', () => {
      const wsibData: WSIBFormData = {
        formType: 'functional-abilities-form',
        formVersion: 'FAF-8',
        reportDate: new Date(),
        patient: {
          name: 'John Doe',
          dateOfBirth: new Date(),
          address: '123 Main St',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M5H 2N2',
          phone: '+14161234567',
          dateOfInjury: new Date(),
        },
        professional: {
          name: 'Dr. Jane Smith',
          registrationNumber: 'ON-12345',
          clinicName: 'Toronto Clinic',
          clinicAddress: '456 Clinic Ave',
          clinicCity: 'Toronto',
          clinicProvince: 'ON',
          clinicPostalCode: 'M5H 3K4',
          phone: '+14169876543',
          email: 'jane@clinic.com',
        },
        injury: {
          dateOfInjury: new Date(),
          mechanismOfInjury: 'Lifting injury',
          bodyPartAffected: ['Lower back'],
          workRelated: true,
          preInjuryStatus: 'Full capacity',
          currentStatus: 'Limited capacity',
          injuryDescription: 'Lower back strain',
        },
        clinical: {
          subjective: 'Pain in lower back',
          objective: 'Limited ROM',
          assessment: 'Lumbar strain',
          plan: 'Treatment plan',
          functionalLimitations: [],
          workRestrictions: [],
          returnToWorkRecommendations: {
            currentCapacity: 'Limited',
            recommendedWorkType: 'Modified duties',
            restrictions: [],
            timeline: '4 weeks',
            accommodations: [],
            reviewDate: new Date(),
          },
        },
        treatment: {
          startDate: new Date(),
          frequency: '2x per week',
          duration: '6 weeks',
          modalities: [],
          exercises: [],
          expectedOutcome: 'Improved capacity',
          goals: [],
        },
        compliance: {
          dateOfReport: new Date(),
          signatureRequired: true,
          disclaimers: [],
          cpoCompliant: true,
          phipaCompliant: true,
          wsibCompliant: true,
        },
      };

      const result = WSIBTemplateService.generateFunctionalAbilitiesForm(wsibData);

      expect(result.formType).toBe('functional-abilities-form');
      expect(result.formVersion).toBe('FAF-8');
      expect(result.patient.name).toBe('John Doe');
      expect(result.professional.name).toBe('Dr. Jane Smith');
    });
  });

  describe('generateTreatmentPlan', () => {
    test('generates treatment plan with correct form type and version', () => {
      const wsibData = createMockWSIBData();

      const result = WSIBTemplateService.generateTreatmentPlan(wsibData);

      expect(result.formType).toBe('treatment-plan');
      expect(result.formVersion).toBe('TP-1');
      expect(result.patient.name).toBe(wsibData.patient.name);
    });
  });

  describe('generateProgressReport', () => {
    test('generates progress report with correct form type and version', () => {
      const wsibData = createMockWSIBData();

      const result = WSIBTemplateService.generateProgressReport(wsibData);

      expect(result.formType).toBe('progress-report');
      expect(result.formVersion).toBe('PR-1');
    });

    test('includes comparison notes when previous report is provided', () => {
      const currentData = createMockWSIBData();
      const previousData = createMockWSIBData();
      previousData.clinical.functionalLimitations = [
        {
          activity: 'Lifting',
          limitation: 'Limited lifting capacity',
          duration: 'Ongoing',
          frequency: 'Constant',
        },
      ];
      currentData.clinical.functionalLimitations = [
        {
          activity: 'Lifting',
          limitation: 'Improved lifting capacity',
          duration: 'Ongoing',
          frequency: 'Occasional',
        },
      ];

      const result = WSIBTemplateService.generateProgressReport(currentData, previousData);

      expect(result.formType).toBe('progress-report');
      expect(result.additionalNotes).toBeDefined();
      expect(result.additionalNotes).toContain('Progress Report');
      expect(result.additionalNotes).toContain('Comparison with previous assessment');
    });

    test('handles case with no previous report', () => {
      const wsibData = createMockWSIBData();

      const result = WSIBTemplateService.generateProgressReport(wsibData);

      expect(result.formType).toBe('progress-report');
      expect(result.formVersion).toBe('PR-1');
    });
  });

  describe('generateReturnToWorkAssessment', () => {
    test('generates RTW assessment with correct form type and version', () => {
      const wsibData = createMockWSIBData();

      const result = WSIBTemplateService.generateReturnToWorkAssessment(wsibData);

      expect(result.formType).toBe('return-to-work-assessment');
      expect(result.formVersion).toBe('RTW-1');
    });
  });

  describe('validateWSIBData', () => {
    test('returns valid result for complete WSIB data', () => {
      const wsibData = createMockWSIBData();

      const result = WSIBTemplateService.validateWSIBData(wsibData);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('detects missing required patient fields', () => {
      const wsibData = createMockWSIBData();
      wsibData.patient.name = '';
      wsibData.patient.dateOfBirth = null as any;

      const result = WSIBTemplateService.validateWSIBData(wsibData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.missingFields).toContain('patient.name');
      expect(result.missingFields).toContain('patient.dateOfBirth');
    });

    test('detects missing professional registration number', () => {
      const wsibData = createMockWSIBData();
      wsibData.professional.registrationNumber = '';

      const result = WSIBTemplateService.validateWSIBData(wsibData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Professional registration number is required');
    });

    test('detects missing injury date', () => {
      const wsibData = createMockWSIBData();
      wsibData.injury.dateOfInjury = null as any;

      const result = WSIBTemplateService.validateWSIBData(wsibData);

      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('injury.dateOfInjury');
    });

    test('generates warnings for missing optional fields', () => {
      const wsibData = createMockWSIBData();
      wsibData.patient.address = '';
      wsibData.patient.phone = '';
      wsibData.professional.clinicName = '';
      wsibData.clinical.subjective = '';

      const result = WSIBTemplateService.validateWSIBData(wsibData);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('patient.address'))).toBe(true);
      expect(result.warnings.some(w => w.includes('patient.phone'))).toBe(true);
      expect(result.warnings.some(w => w.includes('professional.clinicName'))).toBe(true);
      expect(result.warnings.some(w => w.includes('clinical.subjective'))).toBe(true);
    });

    test('validates all clinical sections', () => {
      const wsibData = createMockWSIBData();
      wsibData.clinical.objective = '';
      wsibData.clinical.assessment = '';

      const result = WSIBTemplateService.validateWSIBData(wsibData);

      expect(result.warnings.some(w => w.includes('clinical.objective'))).toBe(true);
      expect(result.warnings.some(w => w.includes('clinical.assessment'))).toBe(true);
    });
  });

  describe('addComplianceDisclaimers', () => {
    test('returns array of compliance disclaimers', () => {
      const disclaimers = WSIBTemplateService.addComplianceDisclaimers();

      expect(Array.isArray(disclaimers)).toBe(true);
      expect(disclaimers.length).toBeGreaterThan(0);
      expect(disclaimers.every(d => typeof d === 'string')).toBe(true);
    });

    test('includes WSIB compliance disclaimer', () => {
      const disclaimers = WSIBTemplateService.addComplianceDisclaimers();

      expect(disclaimers.some(d => d.includes('WSIB'))).toBe(true);
    });

    test('includes CPO compliance disclaimer', () => {
      const disclaimers = WSIBTemplateService.addComplianceDisclaimers();

      expect(disclaimers.some(d => d.includes('CPO'))).toBe(true);
    });

    test('includes patient consent disclaimer', () => {
      const disclaimers = WSIBTemplateService.addComplianceDisclaimers();

      expect(disclaimers.some(d => d.toLowerCase().includes('consent'))).toBe(true);
    });
  });

  describe('Helper Methods (tested through extractWSIBData)', () => {
    test('extracts mechanism of injury from subjective text', () => {
      const soapNote = createMockSOAPNote({
        subjective: 'Patient injured lower back while lifting heavy box at work.',
      });
      const session = createMockSession();
      const patientData = createMockPatientData();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.injury.mechanismOfInjury).toBeTruthy();
      expect(result.injury.mechanismOfInjury).not.toBe('Work-related injury'); // Should extract actual mechanism
    });

    test('extracts body parts from objective section', () => {
      const soapNote = createMockSOAPNote({
        objective: 'Pain in shoulder and neck. Limited range of motion in knee.',
      });
      const session = createMockSession();
      const patientData = createMockPatientData();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.injury.bodyPartAffected.length).toBeGreaterThanOrEqual(2);
      expect(result.injury.bodyPartAffected.some(bp => bp.toLowerCase().includes('shoulder'))).toBe(true);
      expect(result.injury.bodyPartAffected.some(bp => bp.toLowerCase().includes('neck'))).toBe(true);
      expect(result.injury.bodyPartAffected.some(bp => bp.toLowerCase().includes('knee'))).toBe(true);
    });

    test('extracts functional limitations for common activities', () => {
      const soapNote = createMockSOAPNote({
        objective: 'Limited lifting capacity. Restricted standing. Unable to walk long distances. Limited walking. Pain with sitting.',
      });
      const session = createMockSession();
      const patientData = createMockPatientData();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      const activities = result.clinical.functionalLimitations.map(l => l.activity);
      expect(activities).toContain('Lifting');
      expect(activities).toContain('Standing');
      expect(activities).toContain('Walking');
      expect(activities).toContain('Sitting');
    });

    test('extracts work restrictions from plan section', () => {
      const soapNote = createMockSOAPNote({
        plan: 'No lifting over 20 lbs. Limit standing to 4 hours per day.',
      });
      const session = createMockSession();
      const patientData = createMockPatientData();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.clinical.workRestrictions.length).toBeGreaterThan(0);
    });

    test('extracts treatment frequency from plan', () => {
      const soapNote = createMockSOAPNote({
        plan: 'Manual therapy 2 times per week for 6 weeks.',
      });
      const session = createMockSession();
      const patientData = createMockPatientData();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.treatment.frequency).toBeTruthy();
    });

    test('extracts treatment modalities from plan', () => {
      const soapNote = createMockSOAPNote({
        plan: 'Manual therapy, Exercise therapy, Ultrasound, and TENS will be used.',
      });
      const session = createMockSession();
      const patientData = createMockPatientData();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.treatment.modalities.length).toBeGreaterThan(0);
      expect(result.treatment.modalities.some(m => m.includes('Manual therapy'))).toBe(true);
      expect(result.treatment.modalities.some(m => m.includes('Exercise therapy'))).toBe(true);
    });

    test('extracts exercises from plan section', () => {
      const soapNote = createMockSOAPNote({
        plan: 'Exercise: Core strengthening. Stretch: Hamstring stretches. Strengthen: Glute exercises.',
      });
      const session = createMockSession();
      const patientData = createMockPatientData();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.treatment.exercises.length).toBeGreaterThan(0);
    });

    test('extracts goals from plan and assessment', () => {
      const soapNote = createMockSOAPNote({
        plan: 'Goal: Reduce pain. Objective: Improve ROM.',
        assessment: 'Goal: Return to work.',
      });
      const session = createMockSession();
      const patientData = createMockPatientData();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.treatment.goals.length).toBeGreaterThan(0);
    });

    test('extracts pre-injury and current status from assessment', () => {
      const soapNote = createMockSOAPNote({
        assessment: 'Pre-injury: Full functional capacity. Current status: Limited functional capacity.',
      });
      const session = createMockSession();
      const patientData = createMockPatientData();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.injury.preInjuryStatus).toBeTruthy();
      expect(result.injury.currentStatus).toBeTruthy();
    });

    test('handles empty SOAP sections gracefully', () => {
      const soapNote = createMockSOAPNote({
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
      });
      const session = createMockSession();
      const patientData = createMockPatientData();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.clinical.subjective).toBe('');
      expect(result.clinical.objective).toBe('');
      expect(result.clinical.assessment).toBe('');
      expect(result.clinical.plan).toBe('');
      expect(result.injury.mechanismOfInjury).toBe('Work-related injury'); // Default fallback
    });
  });

  describe('Edge Cases', () => {
    test('handles patient data with Firestore Timestamp for dateOfBirth', () => {
      const patientData = createMockPatientData({
        dateOfBirth: Timestamp.fromDate(new Date('1980-01-01')),
      });
      const soapNote = createMockSOAPNote();
      const session = createMockSession();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.patient.dateOfBirth).toBeInstanceOf(Date);
    });

    test('handles patient data with Date object for dateOfBirth', () => {
      const patientData = createMockPatientData({
        dateOfBirth: new Date('1980-01-01'),
      });
      const soapNote = createMockSOAPNote();
      const session = createMockSession();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.patient.dateOfBirth).toBeInstanceOf(Date);
    });

    test('handles professional data with alternative field names', () => {
      const professionalData = {
        practiceName: 'Alternative Clinic Name',
        practiceAddress: 'Alternative Address',
        practiceCity: 'Alternative City',
        practiceProvince: 'BC',
        practicePostalCode: 'V6B 1A1',
        cotoRegistration: 'ON-99999',
      };
      const soapNote = createMockSOAPNote();
      const session = createMockSession();
      const patientData = createMockPatientData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.professional.clinicName).toBe('Alternative Clinic Name');
      expect(result.professional.clinicAddress).toBe('Alternative Address');
      expect(result.professional.clinicCity).toBe('Alternative City');
      expect(result.professional.clinicProvince).toBe('BC');
      expect(result.professional.registrationNumber).toBe('ON-99999');
    });

    test('handles patient data with alternative field names', () => {
      const patientData = {
        id: 'patient-123',
        streetAddress: 'Alternative Street',
        postal_code: 'M1M 1M1',
        phoneNumber: '+14161111111',
        wsib_claim_number: 'WSIB-99999',
      };
      const soapNote = createMockSOAPNote();
      const session = createMockSession();
      const professionalData = createMockProfessionalData();

      const result = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );

      expect(result.patient.address).toBe('Alternative Street');
      expect(result.patient.postalCode).toBe('M1M 1M1');
      expect(result.patient.phone).toBe('+14161111111');
      expect(result.patient.wsibClaimNumber).toBe('WSIB-99999');
    });
  });
});

// Helper function to create mock WSIB data
function createMockWSIBData(): WSIBFormData {
  return {
    formType: 'functional-abilities-form',
    formVersion: 'FAF-8',
    reportDate: new Date(),
    patient: {
      name: 'John Doe',
      dateOfBirth: new Date('1980-01-01'),
      address: '123 Main St',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5H 2N2',
      phone: '+14161234567',
      email: 'john.doe@example.com',
      wsibClaimNumber: 'WSIB-12345',
      dateOfInjury: new Date('2025-01-13'),
    },
    professional: {
      name: 'Dr. Jane Smith',
      registrationNumber: 'ON-12345',
      clinicName: 'Toronto Physiotherapy Clinic',
      clinicAddress: '456 Clinic Ave',
      clinicCity: 'Toronto',
      clinicProvince: 'ON',
      clinicPostalCode: 'M5H 3K4',
      phone: '+14169876543',
      email: 'jane.smith@clinic.com',
    },
    injury: {
      dateOfInjury: new Date('2025-01-13'),
      mechanismOfInjury: 'Lifting heavy box at work',
      bodyPartAffected: ['Lower back'],
      workRelated: true,
      preInjuryStatus: 'Full functional capacity',
      currentStatus: 'Limited functional capacity',
      injuryDescription: 'Lower back strain',
    },
    clinical: {
      subjective: 'Patient reports lower back pain',
      objective: 'Limited range of motion',
      assessment: 'Lumbar strain',
      plan: 'Manual therapy and exercise',
      functionalLimitations: [],
      workRestrictions: [],
      returnToWorkRecommendations: {
        currentCapacity: 'Limited',
        recommendedWorkType: 'Modified duties',
        restrictions: [],
        timeline: '4 weeks',
        accommodations: [],
        reviewDate: new Date(),
      },
    },
    treatment: {
      startDate: new Date(),
      frequency: '2x per week',
      duration: '6 weeks',
      modalities: [],
      exercises: [],
      expectedOutcome: 'Improved functional capacity',
      goals: [],
    },
    compliance: {
      dateOfReport: new Date(),
      signatureRequired: true,
      disclaimers: [],
      cpoCompliant: true,
      phipaCompliant: true,
      wsibCompliant: true,
    },
  };
}

