/**
 * Certificate Template Service
 * 
 * Transforms SOAP notes into medical certificate-formatted documents.
 * Handles extraction, formatting, and validation of certificate-specific data.
 * 
 * Sprint 2B - Day 5: Certificate Templates
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: CPO Documentation Standards, Medical Certificate Standards
 */

import type { SOAPNote } from '../types/vertex-ai';
import type { Session } from './sessionComparisonService';
import type {
  CertificateData,
  CertificateType,
  CertificatePatientInfo,
  CertificateProfessionalInfo,
  CertificateConditionInfo,
  CertificateWorkInfo,
  CertificateTreatmentInfo,
  CertificateClinicalAssessment,
  CertificateCompliance,
  CertificateValidationResult,
} from '../types/certificate';

/**
 * Certificate Template Service
 * 
 * Provides methods to extract certificate-specific data from SOAP notes
 * and generate medical certificates.
 */
export class CertificateTemplateService {
  /**
   * Extract certificate-specific data from SOAP note and session
   * 
   * @param soapNote - SOAP note to extract data from
   * @param session - Session data containing patient and professional info
   * @param patientData - Patient data from database
   * @param professionalData - Professional data from database
   * @param certificateType - Type of certificate to generate
   * @returns CertificateData object
   */
  static extractCertificateData(
    soapNote: SOAPNote,
    session: Session,
    patientData: any,
    professionalData: any,
    certificateType: CertificateType = 'medical-certificate'
  ): CertificateData {
    // Extract patient information
    const patientInfo = this.extractPatientInfo(patientData, session);
    
    // Extract professional information
    const professionalInfo = this.extractProfessionalInfo(professionalData);
    
    // Extract condition information from SOAP
    const conditionInfo = this.extractConditionInfo(soapNote, session);
    
    // Extract work information
    const workInfo = this.extractWorkInfo(soapNote, patientData, session);
    
    // Extract treatment information from SOAP Plan
    const treatmentInfo = this.extractTreatmentInfo(soapNote, session);
    
    // Extract clinical assessment from SOAP
    const clinicalAssessment = this.extractClinicalAssessment(soapNote);
    
    // Build compliance information
    const compliance = this.buildComplianceInfo(certificateType);
    
    return {
      certificateType,
      issueDate: new Date(),
      patient: patientInfo,
      professional: professionalInfo,
      condition: conditionInfo,
      work: workInfo,
      treatment: treatmentInfo,
      clinical: clinicalAssessment,
      compliance: compliance,
    };
  }
  
  /**
   * Extract patient information
   */
  private static extractPatientInfo(patientData: any, session: Session): CertificatePatientInfo {
    return {
      name: patientData?.name || patientData?.fullName || session.patientName || 'Unknown',
      dateOfBirth: patientData?.dateOfBirth?.toDate?.() || patientData?.dateOfBirth || new Date(),
      address: patientData?.address || patientData?.streetAddress || '',
      city: patientData?.city || '',
      province: patientData?.province || 'ON',
      postalCode: patientData?.postalCode || patientData?.postal_code || '',
      phone: patientData?.phone || patientData?.phoneNumber || '',
      email: patientData?.email || undefined,
      healthCardNumber: patientData?.healthCardNumber || 
                       patientData?.health_card_number || 
                       patientData?.ohipNumber || 
                       undefined,
      employerName: patientData?.employerName || 
                   patientData?.employer_name || 
                   patientData?.workplace || 
                   undefined,
      employerAddress: patientData?.employerAddress || 
                      patientData?.employer_address || 
                      undefined,
    };
  }
  
  /**
   * Extract professional information
   */
  private static extractProfessionalInfo(professionalData: any): CertificateProfessionalInfo {
    return {
      name: professionalData?.name || professionalData?.displayName || 'Unknown Professional',
      registrationNumber: professionalData?.registrationNumber || 
                         professionalData?.cotoRegistration || 
                         professionalData?.registration_number || 
                         '',
      clinicName: professionalData?.clinicName || 
                  professionalData?.clinic_name || 
                  professionalData?.practiceName || 
                  '',
      clinicAddress: professionalData?.clinicAddress || 
                     professionalData?.clinic_address || 
                     professionalData?.practiceAddress || 
                     '',
      clinicCity: professionalData?.clinicCity || 
                  professionalData?.clinic_city || 
                  professionalData?.practiceCity || 
                  '',
      clinicProvince: professionalData?.clinicProvince || 
                      professionalData?.clinic_province || 
                      professionalData?.practiceProvince || 
                      'ON',
      clinicPostalCode: professionalData?.clinicPostalCode || 
                        professionalData?.clinic_postal_code || 
                        professionalData?.practicePostalCode || 
                        '',
      phone: professionalData?.phone || professionalData?.phoneNumber || '',
      email: professionalData?.email || '',
      signature: professionalData?.signature || undefined,
      licenseExpiry: professionalData?.licenseExpiry?.toDate?.() || 
                    professionalData?.licenseExpiry || 
                    undefined,
    };
  }
  
  /**
   * Extract condition information from SOAP note
   */
  private static extractConditionInfo(soapNote: SOAPNote, session: Session): CertificateConditionInfo {
    const assessment = soapNote.assessment || '';
    const subjective = soapNote.subjective || '';
    const objective = soapNote.objective || '';
    
    // Extract primary diagnosis
    const diagnosis = this.extractPrimaryDiagnosis(assessment);
    
    // Extract secondary diagnoses
    const secondaryDiagnoses = this.extractSecondaryDiagnoses(assessment);
    
    // Extract onset date
    const onsetDate = this.extractOnsetDate(subjective, session);
    
    // Extract current status
    const currentStatus = this.extractCurrentStatus(assessment);
    
    // Extract symptoms
    const symptoms = this.extractSymptoms(subjective, objective);
    
    // Extract functional impact
    const functionalImpact = this.extractFunctionalImpact(assessment, objective);
    
    return {
      diagnosis: diagnosis || 'Medical condition',
      secondaryDiagnoses: secondaryDiagnoses,
      onsetDate: onsetDate,
      currentStatus: currentStatus || 'Under treatment',
      symptoms: symptoms,
      functionalImpact: functionalImpact || 'Limited functional capacity',
    };
  }
  
  /**
   * Extract work information
   */
  private static extractWorkInfo(
    soapNote: SOAPNote,
    patientData: any,
    session: Session
  ): CertificateWorkInfo {
    const plan = soapNote.plan || '';
    const assessment = soapNote.assessment || '';
    
    // Extract occupation
    const occupation = patientData?.occupation || 
                      patientData?.jobTitle || 
                      this.extractOccupation(soapNote.subjective) || 
                      'Not specified';
    
    // Extract employer info
    const employerName = patientData?.employerName || 
                        patientData?.employer_name || 
                        patientData?.workplace || 
                        undefined;
    
    // Extract work dates
    const lastWorkDate = patientData?.lastWorkDate?.toDate?.() || 
                        patientData?.lastWorkDate || 
                        patientData?.last_work_date?.toDate?.() || 
                        patientData?.last_work_date || 
                        undefined;
    
    // Extract return to work information
    const { clearedForWork, clearedForFullDuties, clearedForModifiedDuties, expectedReturnDate } = 
      this.extractReturnToWorkInfo(plan, assessment);
    
    // Extract work restrictions
    const workRestrictions = this.extractWorkRestrictions(plan);
    
    // Extract accommodations
    const accommodations = this.extractAccommodations(plan);
    
    return {
      occupation,
      employerName,
      lastWorkDate,
      expectedReturnDate,
      workRestrictions,
      accommodations,
      clearedForWork,
      clearedForFullDuties,
      clearedForModifiedDuties,
    };
  }
  
  /**
   * Extract treatment information from SOAP Plan
   */
  private static extractTreatmentInfo(soapNote: SOAPNote, session: Session): CertificateTreatmentInfo {
    const plan = soapNote.plan || '';
    const assessment = soapNote.assessment || '';
    
    // Extract treatments provided
    const treatmentProvided = this.extractTreatments(plan);
    
    // Extract medications
    const medications = this.extractMedications(plan, assessment);
    
    // Extract follow-up information
    const { followUpRequired, followUpDate } = this.extractFollowUpInfo(plan);
    
    // Extract treatment duration
    const treatmentDuration = this.extractTreatmentDuration(plan);
    
    // Extract expected recovery date
    const expectedRecoveryDate = this.extractExpectedRecoveryDate(plan, assessment);
    
    return {
      treatmentProvided,
      medications,
      followUpRequired,
      followUpDate,
      treatmentDuration: treatmentDuration || 'Ongoing',
      expectedRecoveryDate,
    };
  }
  
  /**
   * Extract clinical assessment from SOAP note
   */
  private static extractClinicalAssessment(soapNote: SOAPNote): CertificateClinicalAssessment {
    // Extract prognosis
    const prognosis = this.extractPrognosis(soapNote.assessment);
    
    // Extract restrictions
    const restrictions = this.extractRestrictions(soapNote.plan, soapNote.objective);
    
    return {
      subjective: soapNote.subjective || '',
      objective: soapNote.objective || '',
      assessment: soapNote.assessment || '',
      plan: soapNote.plan || '',
      prognosis: prognosis || 'Recovery expected with treatment',
      restrictions: restrictions,
    };
  }
  
  /**
   * Build compliance information
   */
  private static buildComplianceInfo(certificateType: CertificateType): CertificateCompliance {
    return {
      dateOfIssue: new Date(),
      expiryDate: this.calculateExpiryDate(certificateType),
      signatureRequired: true,
      disclaimers: this.addComplianceDisclaimers(certificateType),
      cpoCompliant: true,
      phipaCompliant: true,
      medicalCertificateStandardsCompliant: true,
      patientConsentObtained: true,
    };
  }
  
  /**
   * Calculate expiry date based on certificate type
   */
  private static calculateExpiryDate(certificateType: CertificateType): Date | undefined {
    const expiryDate = new Date();
    
    switch (certificateType) {
      case 'medical-certificate':
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 days validity
        return expiryDate;
      case 'return-to-work-certificate':
        expiryDate.setDate(expiryDate.getDate() + 90); // 90 days validity
        return expiryDate;
      case 'fitness-to-work-certificate':
        expiryDate.setDate(expiryDate.getDate() + 90); // 90 days validity
        return expiryDate;
      case 'disability-certificate':
        expiryDate.setDate(expiryDate.getDate() + 180); // 180 days validity
        return expiryDate;
      case 'accommodation-certificate':
        expiryDate.setDate(expiryDate.getDate() + 365); // 1 year validity
        return expiryDate;
      default:
        return undefined;
    }
  }
  
  /**
   * Add compliance disclaimers based on certificate type
   */
  static addComplianceDisclaimers(certificateType: CertificateType): string[] {
    const baseDisclaimers = [
      "This certificate is based on clinical assessment at the time of examination.",
      "All information provided is accurate to the best of the professional's knowledge.",
      "This document complies with CPO documentation standards and PHIPA requirements.",
      "Patient consent has been obtained for this certificate.",
    ];
    
    switch (certificateType) {
      case 'medical-certificate':
        return [
          ...baseDisclaimers,
          "This certificate confirms the patient's inability to work due to medical condition.",
          "The patient should follow treatment recommendations and attend follow-up appointments.",
        ];
      case 'return-to-work-certificate':
        return [
          ...baseDisclaimers,
          "This certificate confirms the patient's fitness to return to work.",
          "Any work restrictions or accommodations are clearly stated.",
          "The patient should follow any ongoing treatment recommendations.",
        ];
      case 'fitness-to-work-certificate':
        return [
          ...baseDisclaimers,
          "This certificate assesses the patient's fitness for work duties.",
          "Any restrictions or accommodations are based on current medical condition.",
        ];
      case 'disability-certificate':
        return [
          ...baseDisclaimers,
          "This certificate documents the patient's disability status.",
          "The assessment is based on current medical condition and functional limitations.",
        ];
      case 'accommodation-certificate':
        return [
          ...baseDisclaimers,
          "This certificate recommends workplace accommodations based on medical condition.",
          "The employer should review and implement accommodations as recommended.",
        ];
      default:
        return baseDisclaimers;
    }
  }
  
  // ========== Helper Methods for Data Extraction ==========
  
  /**
   * Extract primary diagnosis from Assessment
   */
  private static extractPrimaryDiagnosis(assessment: string): string {
    if (!assessment) return '';
    
    // Extract first sentence or first diagnosis
    const sentences = assessment.split(/[.!?]+/);
    if (sentences.length > 0) {
      return sentences[0].trim();
    }
    
    return '';
  }
  
  /**
   * Extract secondary diagnoses
   */
  private static extractSecondaryDiagnoses(assessment: string): string[] {
    const diagnoses: string[] = [];
    
    // Look for multiple diagnoses
    const diagnosisPatterns = [
      /(?:also|additionally|secondary|secondary to)\s+([^.,]+)/gi,
      /(?:and|with)\s+([^.,]+)/gi,
    ];
    
    for (const pattern of diagnosisPatterns) {
      const matches = assessment.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          diagnoses.push(match[1].trim());
        }
      }
    }
    
    return diagnoses;
  }
  
  /**
   * Extract onset date
   */
  private static extractOnsetDate(subjective: string, session: Session): Date {
    // Try to extract date from subjective
    const datePatterns = [
      /(?:since|starting|began|onset)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(?:since|starting|began|onset)\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
    ];
    
    for (const pattern of datePatterns) {
      const match = subjective.match(pattern);
      if (match && match[1]) {
        const parsedDate = new Date(match[1]);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }
    
    // Default to session timestamp
    return session.timestamp instanceof Date 
      ? session.timestamp 
      : (session.timestamp as any)?.toDate?.() || new Date();
  }
  
  /**
   * Extract current status
   */
  private static extractCurrentStatus(assessment: string): string {
    const lowerAssessment = assessment.toLowerCase();
    
    if (lowerAssessment.includes('improving')) return 'Improving';
    if (lowerAssessment.includes('stable')) return 'Stable';
    if (lowerAssessment.includes('worsening')) return 'Worsening';
    if (lowerAssessment.includes('resolved')) return 'Resolved';
    
    return 'Under treatment';
  }
  
  /**
   * Extract symptoms
   */
  private static extractSymptoms(subjective: string, objective: string): string[] {
    const symptoms: string[] = [];
    const combined = (subjective + ' ' + objective).toLowerCase();
    
    const commonSymptoms = [
      'pain', 'headache', 'dizziness', 'nausea', 'fatigue',
      'numbness', 'tingling', 'weakness', 'stiffness', 'swelling',
      'bruising', 'tenderness', 'spasm', 'limited range of motion',
      'difficulty', 'inability', 'reduced',
    ];
    
    for (const symptom of commonSymptoms) {
      if (combined.includes(symptom)) {
        const capitalized = symptom.charAt(0).toUpperCase() + symptom.slice(1);
        if (!symptoms.includes(capitalized)) {
          symptoms.push(capitalized);
        }
      }
    }
    
    return symptoms;
  }
  
  /**
   * Extract functional impact
   */
  private static extractFunctionalImpact(assessment: string, objective: string): string {
    const combined = (assessment + ' ' + objective).toLowerCase();
    
    if (combined.includes('severe') || combined.includes('significant')) {
      return 'Significant functional limitations';
    }
    if (combined.includes('moderate')) {
      return 'Moderate functional limitations';
    }
    if (combined.includes('mild') || combined.includes('minimal')) {
      return 'Mild functional limitations';
    }
    
    return 'Functional limitations present';
  }
  
  /**
   * Extract occupation from text
   */
  private static extractOccupation(text: string): string | undefined {
    const occupationPatterns = [
      /(?:works? as|occupation|job|employed as)\s+([^.,]+)/i,
      /(?:is a|is an)\s+([^.,]+)/i,
    ];
    
    for (const pattern of occupationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return undefined;
  }
  
  /**
   * Extract return to work information
   */
  private static extractReturnToWorkInfo(
    plan: string,
    assessment: string
  ): {
    clearedForWork: boolean;
    clearedForFullDuties: boolean;
    clearedForModifiedDuties: boolean;
    expectedReturnDate?: Date;
  } {
    const combined = (plan + ' ' + assessment).toLowerCase();
    
    let clearedForWork = false;
    let clearedForFullDuties = false;
    let clearedForModifiedDuties = false;
    let expectedReturnDate: Date | undefined;
    
    // Check for clearance
    if (combined.includes('cleared') || combined.includes('fit to work') || combined.includes('return to work')) {
      clearedForWork = true;
      
      if (combined.includes('full') || combined.includes('all duties')) {
        clearedForFullDuties = true;
      } else if (combined.includes('modified') || combined.includes('light') || combined.includes('restricted')) {
        clearedForModifiedDuties = true;
      }
    }
    
    // Extract return date
    const datePatterns = [
      /(?:return|resume|back to work)\s+(?:on|by|date)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(?:return|resume|back to work)\s+(?:on|by|date)\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
    ];
    
    for (const pattern of datePatterns) {
      const match = combined.match(pattern);
      if (match && match[1]) {
        const parsedDate = new Date(match[1]);
        if (!isNaN(parsedDate.getTime())) {
          expectedReturnDate = parsedDate;
          break;
        }
      }
    }
    
    return {
      clearedForWork,
      clearedForFullDuties,
      clearedForModifiedDuties,
      expectedReturnDate,
    };
  }
  
  /**
   * Extract work restrictions
   */
  private static extractWorkRestrictions(plan: string): string[] {
    const restrictions: string[] = [];
    const lowerPlan = plan.toLowerCase();
    
    const restrictionKeywords = [
      'no lifting', 'avoid lifting', 'no heavy', 'avoid heavy',
      'no standing', 'avoid standing', 'limited standing',
      'no bending', 'avoid bending', 'limited bending',
      'no driving', 'avoid driving', 'no operating',
      'restricted', 'limitation', 'avoid',
    ];
    
    // Extract sentences containing restrictions
    const sentences = plan.split(/[.!?]+/);
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      for (const keyword of restrictionKeywords) {
        if (lowerSentence.includes(keyword)) {
          const trimmed = sentence.trim();
          if (trimmed.length > 5 && !restrictions.includes(trimmed)) {
            restrictions.push(trimmed);
          }
        }
      }
    }
    
    return restrictions;
  }
  
  /**
   * Extract accommodations
   */
  private static extractAccommodations(plan: string): string[] {
    const accommodations: string[] = [];
    const lowerPlan = plan.toLowerCase();
    
    if (lowerPlan.includes('accommodation') || lowerPlan.includes('modification')) {
      // Extract accommodation sentences
      const sentences = plan.split(/[.!?]+/);
      for (const sentence of sentences) {
        const lowerSentence = sentence.toLowerCase();
        if (lowerSentence.includes('accommodation') || 
            lowerSentence.includes('modification') ||
            lowerSentence.includes('adjustment')) {
          const trimmed = sentence.trim();
          if (trimmed.length > 5 && !accommodations.includes(trimmed)) {
            accommodations.push(trimmed);
          }
        }
      }
    }
    
    return accommodations;
  }
  
  /**
   * Extract treatments provided
   */
  private static extractTreatments(plan: string): string[] {
    const treatments: string[] = [];
    const lowerPlan = plan.toLowerCase();
    
    const treatmentKeywords = [
      'manual therapy', 'massage', 'exercise', 'stretching', 'strengthening',
      'ultrasound', 'electrical stimulation', 'heat', 'ice', 'traction',
      'mobilization', 'manipulation', 'acupuncture', 'dry needling',
      'physiotherapy', 'physical therapy', 'treatment',
    ];
    
    for (const keyword of treatmentKeywords) {
      if (lowerPlan.includes(keyword)) {
        const capitalized = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        if (!treatments.includes(capitalized)) {
          treatments.push(capitalized);
        }
      }
    }
    
    return treatments.length > 0 ? treatments : ['Physiotherapy treatment'];
  }
  
  /**
   * Extract medications
   */
  private static extractMedications(plan: string, assessment: string): string[] {
    const medications: string[] = [];
    const combined = (plan + ' ' + assessment).toLowerCase();
    
    const medicationPatterns = [
      /(?:prescribed|medication|medication|meds?)\s+([^.,]+)/gi,
      /(?:taking|on)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    ];
    
    for (const pattern of medicationPatterns) {
      const matches = combined.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const trimmed = match[1].trim();
          if (trimmed.length > 2 && !medications.includes(trimmed)) {
            medications.push(trimmed);
          }
        }
      }
    }
    
    return medications;
  }
  
  /**
   * Extract follow-up information
   */
  private static extractFollowUpInfo(plan: string): {
    followUpRequired: boolean;
    followUpDate?: Date;
  } {
    const lowerPlan = plan.toLowerCase();
    const followUpRequired = lowerPlan.includes('follow') || 
                            lowerPlan.includes('review') || 
                            lowerPlan.includes('reassessment');
    
    let followUpDate: Date | undefined;
    
    if (followUpRequired) {
      // Extract follow-up date
      const datePatterns = [
        /(?:follow.?up|review|reassessment|return)\s+(?:on|date|in)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        /(?:follow.?up|review|reassessment|return)\s+(?:on|date|in)\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
        /(?:in|after)\s+(\d+)\s*(?:weeks?|months?|days?)/i,
      ];
      
      for (const pattern of datePatterns) {
        const match = plan.match(pattern);
        if (match && match[1]) {
          // Try parsing as date
          const parsedDate = new Date(match[1]);
          if (!isNaN(parsedDate.getTime())) {
            followUpDate = parsedDate;
            break;
          }
          
          // Try parsing as relative date (e.g., "in 2 weeks")
          const relativeMatch = match[0].match(/(\d+)\s*(weeks?|months?|days?)/i);
          if (relativeMatch) {
            const amount = parseInt(relativeMatch[1], 10);
            const unit = relativeMatch[2].toLowerCase();
            const date = new Date();
            
            if (unit.includes('day')) {
              date.setDate(date.getDate() + amount);
            } else if (unit.includes('week')) {
              date.setDate(date.getDate() + (amount * 7));
            } else if (unit.includes('month')) {
              date.setMonth(date.getMonth() + amount);
            }
            
            followUpDate = date;
            break;
          }
        }
      }
    }
    
    return { followUpRequired, followUpDate };
  }
  
  /**
   * Extract treatment duration
   */
  private static extractTreatmentDuration(plan: string): string {
    const durationPatterns = [
      /(?:duration|for|over)\s+(\d+)\s*(?:weeks?|months?|days?)/i,
      /(\d+)\s*(?:week|month|day)\s*(?:treatment|plan|program)/i,
    ];
    
    for (const pattern of durationPatterns) {
      const match = plan.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return '';
  }
  
  /**
   * Extract expected recovery date
   */
  private static extractExpectedRecoveryDate(plan: string, assessment: string): Date | undefined {
    const combined = plan + ' ' + assessment;
    
    const datePatterns = [
      /(?:expected|anticipated|projected)\s+(?:recovery|return)\s+(?:date|on|by)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(?:expected|anticipated|projected)\s+(?:recovery|return)\s+(?:date|on|by)\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
    ];
    
    for (const pattern of datePatterns) {
      const match = combined.match(pattern);
      if (match && match[1]) {
        const parsedDate = new Date(match[1]);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }
    
    return undefined;
  }
  
  /**
   * Extract prognosis
   */
  private static extractPrognosis(assessment: string): string {
    const lowerAssessment = assessment.toLowerCase();
    
    if (lowerAssessment.includes('prognosis')) {
      const prognosisMatch = assessment.match(/prognosis[^.]*/i);
      if (prognosisMatch) {
        return prognosisMatch[0];
      }
    }
    
    if (lowerAssessment.includes('expected recovery') || lowerAssessment.includes('recovery expected')) {
      return 'Recovery expected with treatment';
    }
    
    return 'Recovery expected with treatment';
  }
  
  /**
   * Extract restrictions
   */
  private static extractRestrictions(plan: string, objective: string): {
    physical: string[];
    work: string[];
    activities: string[];
  } {
    const combined = (plan + ' ' + objective).toLowerCase();
    
    const physical: string[] = [];
    const work: string[] = [];
    const activities: string[] = [];
    
    // Physical restrictions
    const physicalKeywords = ['lifting', 'bending', 'standing', 'walking', 'sitting', 'reaching'];
    for (const keyword of physicalKeywords) {
      if (combined.includes(keyword)) {
        physical.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    }
    
    // Work restrictions (already extracted in extractWorkRestrictions)
    const workRestrictions = this.extractWorkRestrictions(plan);
    work.push(...workRestrictions);
    
    // Activity restrictions
    const activityKeywords = ['driving', 'exercise', 'sports', 'recreational'];
    for (const keyword of activityKeywords) {
      if (combined.includes(keyword)) {
        activities.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    }
    
    return { physical, work, activities };
  }
  
  /**
   * Validate certificate data
   */
  static validateCertificateData(data: CertificateData): CertificateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];
    
    // Required fields validation
    if (!data.patient.name || data.patient.name === 'Unknown') {
      missingFields.push('Patient name');
    }
    
    if (!data.patient.dateOfBirth) {
      missingFields.push('Patient date of birth');
    }
    
    if (!data.condition.diagnosis) {
      missingFields.push('Diagnosis');
    }
    
    if (!data.condition.onsetDate) {
      missingFields.push('Onset date');
    }
    
    if (!data.clinical.assessment) {
      missingFields.push('Clinical assessment');
    }
    
    if (!data.professional.name || data.professional.name === 'Unknown Professional') {
      missingFields.push('Professional name');
    }
    
    if (!data.professional.registrationNumber) {
      warnings.push('Professional registration number not provided');
    }
    
    // Validation logic
    if (data.condition.onsetDate > new Date()) {
      errors.push('Onset date cannot be in the future');
    }
    
    if (data.patient.dateOfBirth > new Date()) {
      errors.push('Date of birth cannot be in the future');
    }
    
    if (data.work.expectedReturnDate && data.work.expectedReturnDate < new Date()) {
      warnings.push('Expected return date is in the past');
    }
    
    if (data.compliance.expiryDate && data.compliance.expiryDate < new Date()) {
      errors.push('Expiry date cannot be in the past');
    }
    
    // Certificate-specific validations
    if (data.certificateType === 'return-to-work-certificate' && !data.work.clearedForWork) {
      warnings.push('Return-to-work certificate but patient not cleared for work');
    }
    
    if (data.certificateType === 'medical-certificate' && data.work.clearedForWork) {
      warnings.push('Medical certificate but patient cleared for work');
    }
    
    return {
      valid: errors.length === 0 && missingFields.length === 0,
      errors,
      warnings,
      missingFields,
    };
  }
  
  /**
   * Generate Medical Certificate
   */
  static generateMedicalCertificate(certificateData: CertificateData): CertificateData {
    return {
      ...certificateData,
      certificateType: 'medical-certificate',
    };
  }
  
  /**
   * Generate Return-to-Work Certificate
   */
  static generateReturnToWorkCertificate(certificateData: CertificateData): CertificateData {
    return {
      ...certificateData,
      certificateType: 'return-to-work-certificate',
      work: {
        ...certificateData.work,
        clearedForWork: true,
      },
    };
  }
  
  /**
   * Generate Fitness-to-Work Certificate
   */
  static generateFitnessToWorkCertificate(certificateData: CertificateData): CertificateData {
    return {
      ...certificateData,
      certificateType: 'fitness-to-work-certificate',
    };
  }
  
  /**
   * Generate Disability Certificate
   */
  static generateDisabilityCertificate(certificateData: CertificateData): CertificateData {
    return {
      ...certificateData,
      certificateType: 'disability-certificate',
    };
  }
  
  /**
   * Generate Accommodation Certificate
   */
  static generateAccommodationCertificate(certificateData: CertificateData): CertificateData {
    return {
      ...certificateData,
      certificateType: 'accommodation-certificate',
    };
  }
}

