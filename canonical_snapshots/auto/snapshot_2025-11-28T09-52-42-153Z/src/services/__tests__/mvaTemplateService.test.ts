/**
 * MVA Template Service Tests
 * 
 * Unit tests for MVATemplateService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MVATemplateService } from '../mvaTemplateService';
import type { SOAPNote } from '../../types/vertex-ai';
import type { Session } from '../sessionComparisonService';
import type { MVAFormData } from '../../types/mva';

describe('MVATemplateService', () => {
  let mockSOAPNote: SOAPNote;
  let mockSession: Session;
  let mockPatientData: any;
  let mockProfessionalData: any;
  let mockInsuranceData: any;

  beforeEach(() => {
    mockSOAPNote = {
      subjective: 'Patient reports neck pain and headache following motor vehicle accident. Rear-end collision occurred on Main Street. Patient was driver, wearing seatbelt. Airbag deployed. Ambulance transported to hospital.',
      objective: 'Limited range of motion in cervical spine. Tenderness over C5-C6. Positive Spurling test. Muscle spasm in upper trapezius.',
      assessment: 'Whiplash-associated disorder (WAD) Grade II. Cervical strain. Prognosis: Recovery expected with treatment over 6-8 weeks.',
      plan: 'Manual therapy 2x per week for 6 weeks. Home exercise program including neck stretches and strengthening. Avoid heavy lifting. Return to work assessment in 4 weeks.',
    };

    mockSession = {
      id: 'session-123',
      patientId: 'patient-123',
      patientName: 'John Doe',
      timestamp: new Date('2024-01-15'),
      soapNote: mockSOAPNote,
      status: 'completed',
    };

    mockPatientData = {
      name: 'John Doe',
      dateOfBirth: new Date('1980-05-15'),
      address: '123 Main Street',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5H 2N2',
      phone: '416-555-1234',
      email: 'john.doe@example.com',
      dateOfAccident: new Date('2024-01-10'),
      insurancePolicyNumber: 'POL-123456',
      mvaClaimNumber: 'MVA-789012',
      driverLicenseNumber: 'D1234-56789-12345',
    };

    mockProfessionalData = {
      name: 'Dr. Jane Smith',
      displayName: 'Dr. Jane Smith',
      registrationNumber: 'ON-12345',
      clinicName: 'Toronto Physiotherapy Clinic',
      clinicAddress: '456 Clinic Avenue',
      clinicCity: 'Toronto',
      clinicProvince: 'ON',
      clinicPostalCode: 'M5H 3K4',
      phone: '416-555-5678',
      email: 'jane.smith@clinic.com',
    };

    mockInsuranceData = {
      insuranceCompany: 'ABC Insurance',
      policyNumber: 'POL-123456',
      claimNumber: 'MVA-789012',
      adjusterName: 'Mary Johnson',
      adjusterPhone: '416-555-9999',
      adjusterEmail: 'mary.johnson@abcinsurance.com',
    };
  });

  describe('extractMVAData', () => {
    it('should extract MVA data from SOAP note and session', () => {
      const result = MVATemplateService.extractMVAData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        mockInsuranceData
      );

      expect(result).toBeDefined();
      expect(result.formType).toBe('treatment-plan');
      expect(result.formVersion).toBe('OCF-18');
      expect(result.patient.name).toBe('John Doe');
      expect(result.professional.name).toBe('Dr. Jane Smith');
    });

    it('should extract accident information correctly', () => {
      const result = MVATemplateService.extractMVAData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        mockInsuranceData
      );

      expect(result.accident.accidentType).toContain('Rear-end');
      expect(result.accident.vehicleRole).toBe('driver');
      expect(result.accident.seatbeltUsed).toBe(true);
      expect(result.accident.airbagDeployed).toBe(true);
      expect(result.accident.ambulanceRequired).toBe(true);
      expect(result.accident.hospitalAdmitted).toBe(true);
    });

    it('should extract injury information correctly', () => {
      const result = MVATemplateService.extractMVAData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        mockInsuranceData
      );

      expect(result.injury.primaryInjury).toContain('Whiplash');
      expect(result.injury.bodyPartsAffected).toContain('Neck');
      expect(result.injury.symptoms.length).toBeGreaterThan(0);
    });

    it('should extract treatment information correctly', () => {
      const result = MVATemplateService.extractMVAData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        mockInsuranceData
      );

      expect(result.treatment.frequency).toBeDefined();
      expect(result.treatment.duration).toBeDefined();
      expect(result.treatment.modalities.length).toBeGreaterThan(0);
      expect(result.treatment.exercises.length).toBeGreaterThan(0);
    });

    it('should extract insurance information correctly', () => {
      const result = MVATemplateService.extractMVAData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        mockInsuranceData
      );

      expect(result.insurance.insuranceCompany).toBe('ABC Insurance');
      expect(result.insurance.policyNumber).toBe('POL-123456');
      expect(result.insurance.claimNumber).toBe('MVA-789012');
      expect(result.insurance.adjusterName).toBe('Mary Johnson');
    });

    it('should handle missing optional data gracefully', () => {
      const result = MVATemplateService.extractMVAData(
        mockSOAPNote,
        mockSession,
        { name: 'John Doe' }, // Minimal patient data
        mockProfessionalData
        // No insurance data
      );

      expect(result).toBeDefined();
      expect(result.patient.name).toBe('John Doe');
      expect(result.insurance.insuranceCompany).toBe('Unknown');
    });
  });

  describe('validateMVAData', () => {
    it('should validate complete MVA data successfully', () => {
      const mvaData = MVATemplateService.extractMVAData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        mockInsuranceData
      );

      const validation = MVATemplateService.validateMVAData(mvaData);

      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
      expect(validation.missingFields.length).toBe(0);
    });

    it('should detect missing required fields', () => {
      const incompleteData: MVAFormData = {
        formType: 'treatment-plan',
        formVersion: 'OCF-18',
        reportDate: new Date(),
        patient: {
          name: '',
          dateOfBirth: new Date(),
          address: '',
          city: '',
          province: 'ON',
          postalCode: '',
          phone: '',
          dateOfAccident: new Date(),
        },
        professional: {
          name: 'Dr. Smith',
          registrationNumber: 'ON-12345',
          clinicName: 'Clinic',
          clinicAddress: '123 St',
          clinicCity: 'Toronto',
          clinicProvince: 'ON',
          clinicPostalCode: 'M5H 2N2',
          phone: '416-555-1234',
          email: 'test@test.com',
        },
        accident: {
          dateOfAccident: new Date(),
          location: '',
          accidentType: 'MVA',
          vehicleRole: 'driver',
          ambulanceRequired: false,
          hospitalAdmitted: false,
          accidentDescription: '',
        },
        injury: {
          bodyPartsAffected: [],
          primaryInjury: '',
          secondaryInjuries: [],
          preAccidentStatus: '',
          currentStatus: '',
          symptoms: [],
        },
        clinical: {
          subjective: '',
          objective: '',
          assessment: '',
          plan: '',
          functionalLimitations: [],
          prognosis: '',
          returnToActivitiesRecommendations: {
            driving: { cleared: false },
            work: { cleared: false },
            activitiesOfDailyLiving: { status: 'Normal' },
          },
        },
        treatment: {
          startDate: new Date(),
          frequency: '',
          duration: '',
          modalities: [],
          exercises: [],
          expectedOutcome: '',
          goals: [],
          priorApprovalRequired: false,
        },
        insurance: {
          insuranceCompany: '',
          policyNumber: '',
          claimNumber: '',
          dateOfReport: new Date(),
        },
        compliance: {
          dateOfReport: new Date(),
          signatureRequired: true,
          disclaimers: [],
          cpoCompliant: true,
          phipaCompliant: true,
          ocfCompliant: true,
          statutoryAccidentBenefitsSchedule: true,
        },
      };

      const validation = MVATemplateService.validateMVAData(incompleteData);

      expect(validation.valid).toBe(false);
      expect(validation.missingFields.length).toBeGreaterThan(0);
    });

    it('should detect invalid dates', () => {
      const mvaData = MVATemplateService.extractMVAData(
        mockSOAPNote,
        mockSession,
        {
          ...mockPatientData,
          dateOfAccident: new Date('2025-12-31'), // Future date
        },
        mockProfessionalData,
        mockInsuranceData
      );

      const validation = MVATemplateService.validateMVAData(mvaData);

      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(e => e.includes('future'))).toBe(true);
    });
  });

  describe('generateTreatmentPlan', () => {
    it('should generate treatment plan form', () => {
      const mvaData = MVATemplateService.extractMVAData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        mockInsuranceData
      );

      const treatmentPlan = MVATemplateService.generateTreatmentPlan(mvaData);

      expect(treatmentPlan.formType).toBe('treatment-plan');
      expect(treatmentPlan.formVersion).toBe('OCF-18');
    });
  });

  describe('generateTreatmentConfirmation', () => {
    it('should generate treatment confirmation form', () => {
      const mvaData = MVATemplateService.extractMVAData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        mockInsuranceData
      );

      const confirmation = MVATemplateService.generateTreatmentConfirmation(mvaData);

      expect(confirmation.formType).toBe('treatment-confirmation');
      expect(confirmation.formVersion).toBe('OCF-19');
    });
  });

  describe('generateTreatmentPlanUpdate', () => {
    it('should generate treatment plan update with comparison notes', () => {
      const previousData = MVATemplateService.extractMVAData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        mockInsuranceData
      );

      const currentData = MVATemplateService.extractMVAData(
        mockSOAPNote,
        mockSession,
        mockPatientData,
        mockProfessionalData,
        mockInsuranceData
      );

      const update = MVATemplateService.generateTreatmentPlanUpdate(currentData, previousData);

      expect(update.formType).toBe('treatment-plan-update');
      expect(update.formVersion).toBe('OCF-23');
      expect(update.additionalNotes).toBeDefined();
    });
  });

  describe('addComplianceDisclaimers', () => {
    it('should return MVA compliance disclaimers', () => {
      const disclaimers = MVATemplateService.addComplianceDisclaimers();

      expect(disclaimers.length).toBeGreaterThan(0);
      expect(disclaimers.some(d => d.includes('OCF'))).toBe(true);
      expect(disclaimers.some(d => d.includes('SABS'))).toBe(true);
    });
  });
});

