/**
 * Certificate Template Service Tests
 * 
 * Unit tests for CertificateTemplateService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CertificateTemplateService } from '../certificateTemplateService';
import type { SOAPNote } from '../../types/vertex-ai';
import type { Session } from '../sessionComparisonService';
import type { CertificateData } from '../../types/certificate';

describe('CertificateTemplateService', () => {
  let mockSOAPNote: SOAPNote;
  let mockSession: Session;
  let mockPatientData: any;
  let mockProfessionalData: any;

  beforeEach(() => {
    mockSOAPNote = {
      subjective: 'Patient reports lower back pain for the past 2 weeks. Pain started after lifting heavy boxes at work. Unable to work due to pain. Taking ibuprofen as needed.',
      objective: 'Limited range of motion in lumbar spine. Positive straight leg raise test. Muscle spasm in paraspinal muscles. Tenderness over L4-L5.',
      assessment: 'Lumbar strain. Lower back pain. Prognosis: Recovery expected with treatment over 4-6 weeks. Patient should avoid heavy lifting and return to work assessment in 2 weeks.',
      plan: 'Manual therapy 2x per week for 4 weeks. Home exercise program including core strengthening. Avoid heavy lifting >20 lbs. Follow-up in 2 weeks. Patient cleared for modified duties.',
    };

    mockSession = {
      id: 'session-123',
      patientId: 'patient-123',
      patientName: 'Jane Smith',
      timestamp: new Date('2024-01-15'),
      soapNote: mockSOAPNote,
      status: 'completed',
    };

    mockPatientData = {
      name: 'Jane Smith',
      dateOfBirth: new Date('1985-03-20'),
      address: '789 Oak Street',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5H 4K5',
      phone: '416-555-9876',
      email: 'jane.smith@example.com',
      occupation: 'Warehouse Worker',
      employerName: 'ABC Logistics',
      employerAddress: '123 Industrial Blvd, Toronto, ON',
      healthCardNumber: '1234-567-890',
    };

    mockProfessionalData = {
      name: 'Dr. John Doe',
      displayName: 'Dr. John Doe',
      registrationNumber: 'ON-67890',
      clinicName: 'Toronto Physiotherapy Clinic',
      clinicAddress: '456 Clinic Avenue',
      clinicCity: 'Toronto',
      clinicProvince: 'ON',
      clinicPostalCode: 'M5H 3K4',
      phone: '416-555-5678',
      email: 'john.doe@clinic.com',
    };
  });

  describe('extractCertificateData', () => {
    it('should extract certificate data from SOAP note and session', () => {
      const result = CertificateTemplateService.extractCertificateData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        'medical-certificate'
      );

      expect(result).toBeDefined();
      expect(result.certificateType).toBe('medical-certificate');
      expect(result.patient.name).toBe('Jane Smith');
      expect(result.professional.name).toBe('Dr. John Doe');
    });

    it('should extract condition information correctly', () => {
      const result = CertificateTemplateService.extractCertificateData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        'medical-certificate'
      );

      expect(result.condition.diagnosis).toBeDefined();
      expect(result.condition.onsetDate).toBeDefined();
      expect(result.condition.symptoms.length).toBeGreaterThan(0);
      expect(result.condition.functionalImpact).toBeDefined();
    });

    it('should extract work information correctly', () => {
      const result = CertificateTemplateService.extractCertificateData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        'medical-certificate'
      );

      expect(result.work.occupation).toBe('Warehouse Worker');
      expect(result.work.employerName).toBe('ABC Logistics');
      expect(result.work.clearedForWork).toBeDefined();
      expect(result.work.workRestrictions.length).toBeGreaterThan(0);
    });

    it('should extract treatment information correctly', () => {
      const result = CertificateTemplateService.extractCertificateData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        'medical-certificate'
      );

      expect(result.treatment.treatmentProvided.length).toBeGreaterThan(0);
      expect(result.treatment.followUpRequired).toBe(true);
      expect(result.treatment.treatmentDuration).toBeDefined();
    });

    it('should extract clinical assessment correctly', () => {
      const result = CertificateTemplateService.extractCertificateData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        'medical-certificate'
      );

      expect(result.clinical.subjective).toBe(mockSOAPNote.subjective);
      expect(result.clinical.objective).toBe(mockSOAPNote.objective);
      expect(result.clinical.assessment).toBe(mockSOAPNote.assessment);
      expect(result.clinical.plan).toBe(mockSOAPNote.plan);
      expect(result.clinical.prognosis).toBeDefined();
      expect(result.clinical.restrictions).toBeDefined();
    });

    it('should handle missing optional data gracefully', () => {
      const result = CertificateTemplateService.extractCertificateData(
        mockSOAPNote,
        mockSession,
        { name: 'Jane Smith' }, // Minimal patient data
        mockProfessionalData,
        'medical-certificate'
      );

      expect(result).toBeDefined();
      expect(result.patient.name).toBe('Jane Smith');
      expect(result.work.occupation).toBeDefined();
    });
  });

  describe('validateCertificateData', () => {
    it('should validate complete certificate data successfully', () => {
      const certificateData = CertificateTemplateService.extractCertificateData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        'medical-certificate'
      );

      const validation = CertificateTemplateService.validateCertificateData(certificateData);

      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
      expect(validation.missingFields.length).toBe(0);
    });

    it('should detect missing required fields', () => {
      const incompleteData: CertificateData = {
        certificateType: 'medical-certificate',
        issueDate: new Date(),
        patient: {
          name: '',
          dateOfBirth: new Date(),
          address: '',
          city: '',
          province: 'ON',
          postalCode: '',
          phone: '',
        },
        professional: {
          name: '',
          registrationNumber: '',
          clinicName: '',
          clinicAddress: '',
          clinicCity: '',
          clinicProvince: 'ON',
          clinicPostalCode: '',
          phone: '',
          email: '',
        },
        condition: {
          diagnosis: '',
          onsetDate: new Date(),
          currentStatus: '',
          symptoms: [],
          functionalImpact: '',
        },
        work: {
          occupation: '',
          clearedForWork: false,
          clearedForFullDuties: false,
          clearedForModifiedDuties: false,
        },
        treatment: {
          treatmentProvided: [],
          followUpRequired: false,
          treatmentDuration: '',
        },
        clinical: {
          subjective: '',
          objective: '',
          assessment: '',
          plan: '',
          prognosis: '',
          restrictions: {
            physical: [],
            work: [],
            activities: [],
          },
        },
        compliance: {
          dateOfIssue: new Date(),
          signatureRequired: true,
          disclaimers: [],
          cpoCompliant: true,
          phipaCompliant: true,
          medicalCertificateStandardsCompliant: true,
          patientConsentObtained: true,
        },
      };

      const validation = CertificateTemplateService.validateCertificateData(incompleteData);

      expect(validation.valid).toBe(false);
      expect(validation.missingFields.length).toBeGreaterThan(0);
    });

    it('should detect invalid dates', () => {
      const certificateData = CertificateTemplateService.extractCertificateData(
        mockSOAPNote,
        mockSession,
        {
          ...mockPatientData,
          dateOfBirth: new Date('2025-12-31'), // Future date
        },
        mockProfessionalData,
        'medical-certificate'
      );

      const validation = CertificateTemplateService.validateCertificateData(certificateData);

      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(e => e.includes('future'))).toBe(true);
    });

    it('should validate return-to-work certificate correctly', () => {
      const certificateData = CertificateTemplateService.extractCertificateData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        'return-to-work-certificate'
      );

      const returnToWorkData = CertificateTemplateService.generateReturnToWorkCertificate(certificateData);
      const validation = CertificateTemplateService.validateCertificateData(returnToWorkData);

      expect(returnToWorkData.certificateType).toBe('return-to-work-certificate');
      expect(returnToWorkData.work.clearedForWork).toBe(true);
    });
  });

  describe('generateCertificateTypes', () => {
    it('should generate medical certificate', () => {
      const certificateData = CertificateTemplateService.extractCertificateData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        'medical-certificate'
      );

      const medicalCert = CertificateTemplateService.generateMedicalCertificate(certificateData);

      expect(medicalCert.certificateType).toBe('medical-certificate');
    });

    it('should generate return-to-work certificate', () => {
      const certificateData = CertificateTemplateService.extractCertificateData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        'return-to-work-certificate'
      );

      const rtwCert = CertificateTemplateService.generateReturnToWorkCertificate(certificateData);

      expect(rtwCert.certificateType).toBe('return-to-work-certificate');
      expect(rtwCert.work.clearedForWork).toBe(true);
    });

    it('should generate fitness-to-work certificate', () => {
      const certificateData = CertificateTemplateService.extractCertificateData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        'fitness-to-work-certificate'
      );

      const fitnessCert = CertificateTemplateService.generateFitnessToWorkCertificate(certificateData);

      expect(fitnessCert.certificateType).toBe('fitness-to-work-certificate');
    });

    it('should generate disability certificate', () => {
      const certificateData = CertificateTemplateService.extractCertificateData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        'disability-certificate'
      );

      const disabilityCert = CertificateTemplateService.generateDisabilityCertificate(certificateData);

      expect(disabilityCert.certificateType).toBe('disability-certificate');
    });

    it('should generate accommodation certificate', () => {
      const certificateData = CertificateTemplateService.extractCertificateData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        'accommodation-certificate'
      );

      const accommodationCert = CertificateTemplateService.generateAccommodationCertificate(certificateData);

      expect(accommodationCert.certificateType).toBe('accommodation-certificate');
    });
  });

  describe('addComplianceDisclaimers', () => {
    it('should return compliance disclaimers for medical certificate', () => {
      const disclaimers = CertificateTemplateService.addComplianceDisclaimers('medical-certificate');

      expect(disclaimers.length).toBeGreaterThan(0);
      expect(disclaimers.some(d => d.includes('CPO'))).toBe(true);
      expect(disclaimers.some(d => d.includes('PHIPA'))).toBe(true);
    });

    it('should return compliance disclaimers for return-to-work certificate', () => {
      const disclaimers = CertificateTemplateService.addComplianceDisclaimers('return-to-work-certificate');

      expect(disclaimers.length).toBeGreaterThan(0);
      expect(disclaimers.some(d => d.includes('fitness'))).toBe(true);
    });

    it('should return compliance disclaimers for accommodation certificate', () => {
      const disclaimers = CertificateTemplateService.addComplianceDisclaimers('accommodation-certificate');

      expect(disclaimers.length).toBeGreaterThan(0);
      expect(disclaimers.some(d => d.includes('accommodation'))).toBe(true);
    });
  });
});

