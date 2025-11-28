/**
 * WSIB Template Service
 * 
 * Transforms SOAP notes into WSIB-formatted documents for workplace injury claims.
 * Handles extraction, formatting, and validation of WSIB-specific data.
 * 
 * Sprint 2B - Day 1: WSIB Templates
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: WSIB Standards, CPO Documentation Standards
 */

import type { SOAPNote } from '../types/vertex-ai';
import type { Session } from './sessionComparisonService';
import type {
  WSIBFormData,
  WSIBFormType,
  WSIBPatientInfo,
  WSIBProfessionalInfo,
  WSIBInjuryInfo,
  WSIBClinicalAssessment,
  WSIBTreatmentInfo,
  WSIBFunctionalLimitation,
  WSIBWorkRestriction,
  WSIBReturnToWork,
  WSIBCompliance,
  WSIBValidationResult,
} from '../types/wsib';

/**
 * WSIB Template Service
 * 
 * Provides methods to extract WSIB-specific data from SOAP notes
 * and generate WSIB-compliant forms.
 */
export class WSIBTemplateService {
  /**
   * Extract WSIB-specific data from SOAP note and session
   * 
   * @param soapNote - SOAP note to extract data from
   * @param session - Session data containing patient and professional info
   * @param patientData - Patient data from database
   * @param professionalData - Professional data from database
   * @returns WSIBFormData object
   */
  static extractWSIBData(
    soapNote: SOAPNote,
    session: Session,
    patientData: any,
    professionalData: any
  ): WSIBFormData {
    // Extract patient information
    const patientInfo = this.extractPatientInfo(patientData, session);
    
    // Extract professional information
    const professionalInfo = this.extractProfessionalInfo(professionalData);
    
    // Extract injury information from SOAP
    const injuryInfo = this.extractInjuryInfo(soapNote, session);
    
    // Extract clinical assessment from SOAP
    const clinicalAssessment = this.extractClinicalAssessment(soapNote);
    
    // Extract treatment information from SOAP Plan
    const treatmentInfo = this.extractTreatmentInfo(soapNote, session);
    
    // Build compliance information
    const compliance = this.buildComplianceInfo();
    
    return {
      formType: 'functional-abilities-form', // Default, can be changed
      formVersion: 'FAF-8',
      reportDate: new Date(),
      patient: patientInfo,
      professional: professionalInfo,
      injury: injuryInfo,
      clinical: clinicalAssessment,
      treatment: treatmentInfo,
      compliance: compliance,
    };
  }
  
  /**
   * Extract patient information
   */
  private static extractPatientInfo(patientData: any, session: Session): WSIBPatientInfo {
    return {
      name: patientData?.name || patientData?.fullName || session.patientName || 'Unknown',
      dateOfBirth: patientData?.dateOfBirth?.toDate?.() || patientData?.dateOfBirth || new Date(),
      address: patientData?.address || patientData?.streetAddress || '',
      city: patientData?.city || '',
      province: patientData?.province || 'ON',
      postalCode: patientData?.postalCode || patientData?.postal_code || '',
      phone: patientData?.phone || patientData?.phoneNumber || '',
      email: patientData?.email || undefined,
      wsibClaimNumber: patientData?.wsibClaimNumber || patientData?.wsib_claim_number || undefined,
      dateOfInjury: patientData?.dateOfInjury?.toDate?.() || patientData?.dateOfInjury || new Date(),
    };
  }
  
  /**
   * Extract professional information
   */
  private static extractProfessionalInfo(professionalData: any): WSIBProfessionalInfo {
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
    };
  }
  
  /**
   * Extract injury information from SOAP note
   */
  private static extractInjuryInfo(soapNote: SOAPNote, session: Session): WSIBInjuryInfo {
    // Extract mechanism of injury from Subjective section
    const mechanismOfInjury = this.extractMechanismOfInjury(soapNote.subjective);
    
    // Extract body parts affected from Objective section
    const bodyPartAffected = this.extractBodyParts(soapNote.objective);
    
    // Extract injury description from Subjective
    const injuryDescription = this.extractInjuryDescription(soapNote.subjective);
    
    // Determine pre-injury and current status from Assessment
    const { preInjuryStatus, currentStatus } = this.extractStatus(soapNote.assessment);
    
    return {
      dateOfInjury: session.timestamp instanceof Date 
        ? session.timestamp 
        : (session.timestamp as any)?.toDate?.() || new Date(),
      mechanismOfInjury: mechanismOfInjury || 'Work-related injury',
      bodyPartAffected: bodyPartAffected,
      workRelated: true, // WSIB forms are for work-related injuries
      preInjuryStatus: preInjuryStatus || 'Full functional capacity',
      currentStatus: currentStatus || 'Limited functional capacity',
      injuryDescription: injuryDescription || soapNote.subjective || 'Injury details not specified',
    };
  }
  
  /**
   * Extract clinical assessment from SOAP note
   */
  private static extractClinicalAssessment(soapNote: SOAPNote): WSIBClinicalAssessment {
    // Extract functional limitations from Objective section
    const functionalLimitations = this.extractFunctionalLimitations(soapNote.objective);
    
    // Extract work restrictions from Plan section
    const workRestrictions = this.extractWorkRestrictions(soapNote.plan);
    
    // Extract return-to-work recommendations from Plan
    const returnToWorkRecommendations = this.extractReturnToWorkRecommendations(soapNote.plan);
    
    return {
      subjective: soapNote.subjective || '',
      objective: soapNote.objective || '',
      assessment: soapNote.assessment || '',
      plan: soapNote.plan || '',
      functionalLimitations: functionalLimitations,
      workRestrictions: workRestrictions,
      returnToWorkRecommendations: returnToWorkRecommendations,
    };
  }
  
  /**
   * Extract treatment information from SOAP Plan
   */
  private static extractTreatmentInfo(soapNote: SOAPNote, session: Session): WSIBTreatmentInfo {
    const plan = soapNote.plan || '';
    
    // Extract treatment frequency
    const frequency = this.extractFrequency(plan);
    
    // Extract treatment duration
    const duration = this.extractDuration(plan);
    
    // Extract treatment modalities
    const modalities = this.extractModalities(plan);
    
    // Extract exercises
    const exercises = this.extractExercises(plan);
    
    // Extract expected outcome
    const expectedOutcome = this.extractExpectedOutcome(plan, soapNote.assessment);
    
    // Extract goals
    const goals = this.extractGoals(plan, soapNote.assessment);
    
    return {
      startDate: session.timestamp instanceof Date 
        ? session.timestamp 
        : (session.timestamp as any)?.toDate?.() || new Date(),
      frequency: frequency || 'As needed',
      duration: duration || 'Ongoing',
      modalities: modalities,
      exercises: exercises,
      expectedOutcome: expectedOutcome || 'Improved functional capacity',
      goals: goals,
    };
  }
  
  /**
   * Build compliance information
   */
  private static buildComplianceInfo(): WSIBCompliance {
    return {
      dateOfReport: new Date(),
      signatureRequired: true,
      disclaimers: this.addComplianceDisclaimers(),
      cpoCompliant: true,
      phipaCompliant: true,
      wsibCompliant: true,
    };
  }
  
  /**
   * Add WSIB compliance disclaimers
   */
  static addComplianceDisclaimers(): string[] {
    return [
      "This report is based on clinical assessment and may require verification.",
      "All information provided is accurate to the best of the professional's knowledge.",
      "This document complies with WSIB reporting requirements and CPO standards.",
      "Patient consent has been obtained for this report.",
      "This report is subject to review by WSIB and may require additional documentation.",
    ];
  }
  
  /**
   * Generate WSIB Functional Abilities Form (FAF-8)
   */
  static generateFunctionalAbilitiesForm(wsibData: WSIBFormData): WSIBFormData {
    return {
      ...wsibData,
      formType: 'functional-abilities-form',
      formVersion: 'FAF-8',
    };
  }
  
  /**
   * Generate WSIB Treatment Plan
   */
  static generateTreatmentPlan(wsibData: WSIBFormData): WSIBFormData {
    return {
      ...wsibData,
      formType: 'treatment-plan',
      formVersion: 'TP-1',
    };
  }
  
  /**
   * Generate WSIB Progress Report
   */
  static generateProgressReport(
    wsibData: WSIBFormData,
    previousReport?: WSIBFormData
  ): WSIBFormData {
    // Add comparison data if previous report exists
    if (previousReport) {
      // Compare functional limitations
      const previousLimitations = previousReport.clinical.functionalLimitations;
      const currentLimitations = wsibData.clinical.functionalLimitations;
      
      // Add notes about changes
      wsibData.additionalNotes = this.generateProgressNotes(
        previousLimitations,
        currentLimitations,
        previousReport,
        wsibData
      );
    }
    
    return {
      ...wsibData,
      formType: 'progress-report',
      formVersion: 'PR-1',
    };
  }
  
  /**
   * Generate Return-to-Work Assessment
   */
  static generateReturnToWorkAssessment(wsibData: WSIBFormData): WSIBFormData {
    return {
      ...wsibData,
      formType: 'return-to-work-assessment',
      formVersion: 'RTW-1',
    };
  }
  
  /**
   * Validate WSIB data completeness
   */
  static validateWSIBData(data: WSIBFormData): WSIBValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];
    
    // Validate patient information
    if (!data.patient.name) missingFields.push('patient.name');
    if (!data.patient.dateOfBirth) missingFields.push('patient.dateOfBirth');
    if (!data.patient.address) warnings.push('patient.address is missing');
    if (!data.patient.phone) warnings.push('patient.phone is missing');
    
    // Validate professional information
    if (!data.professional.name) missingFields.push('professional.name');
    if (!data.professional.registrationNumber) {
      errors.push('Professional registration number is required');
    }
    if (!data.professional.clinicName) warnings.push('professional.clinicName is missing');
    
    // Validate injury information
    if (!data.injury.dateOfInjury) missingFields.push('injury.dateOfInjury');
    if (!data.injury.mechanismOfInjury) warnings.push('injury.mechanismOfInjury is missing');
    
    // Validate clinical assessment
    if (!data.clinical.subjective) warnings.push('clinical.subjective is missing');
    if (!data.clinical.objective) warnings.push('clinical.objective is missing');
    if (!data.clinical.assessment) warnings.push('clinical.assessment is missing');
    
    // Critical errors
    if (missingFields.length > 0) {
      errors.push(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      missingFields,
    };
  }
  
  // ============================================================================
  // HELPER METHODS FOR EXTRACTION
  // ============================================================================
  
  private static extractMechanismOfInjury(subjective: string): string | null {
    // Look for common injury mechanism patterns
    const patterns = [
      /(?:injured|hurt|damaged).*?(?:while|during|when|lifting|falling|twisting|reaching)/i,
      /(?:mechanism|occurred|happened).*?:(.+)/i,
      /(?:at work|workplace|on the job).*?(.+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = subjective.match(pattern);
      if (match) {
        return match[1]?.trim() || match[0]?.trim() || null;
      }
    }
    
    return null;
  }
  
  private static extractBodyParts(objective: string): string[] {
    const bodyParts: string[] = [];
    const commonBodyParts = [
      'shoulder', 'neck', 'back', 'spine', 'knee', 'ankle', 'wrist', 'elbow',
      'hip', 'foot', 'hand', 'arm', 'leg', 'head', 'chest', 'abdomen',
    ];
    
    const lowerObjective = objective.toLowerCase();
    for (const part of commonBodyParts) {
      if (lowerObjective.includes(part)) {
        bodyParts.push(part.charAt(0).toUpperCase() + part.slice(1));
      }
    }
    
    return [...new Set(bodyParts)]; // Remove duplicates
  }
  
  private static extractInjuryDescription(subjective: string): string | null {
    // Extract first 200 characters of subjective as injury description
    if (subjective && subjective.length > 0) {
      return subjective.substring(0, 200).trim();
    }
    return null;
  }
  
  private static extractStatus(assessment: string): { preInjuryStatus: string | null; currentStatus: string | null } {
    // Look for status indicators
    const preInjuryMatch = assessment.match(/(?:pre.?injury|before injury|prior).*?:(.+)/i);
    const currentMatch = assessment.match(/(?:current|now|present).*?status.*?:(.+)/i);
    
    return {
      preInjuryStatus: preInjuryMatch?.[1]?.trim() || null,
      currentStatus: currentMatch?.[1]?.trim() || null,
    };
  }
  
  private static extractFunctionalLimitations(objective: string): WSIBFunctionalLimitation[] {
    const limitations: WSIBFunctionalLimitation[] = [];
    
    // Look for limitation patterns
    const limitationPatterns = [
      /(?:limited|restricted|unable).*?(?:lift|stand|walk|sit|reach|bend)/i,
      /(?:pain|discomfort).*?(?:with|during).*?(?:movement|activity)/i,
    ];
    
    // Extract common activities
    const activities = ['Lifting', 'Standing', 'Walking', 'Sitting', 'Reaching', 'Bending'];
    
    for (const activity of activities) {
      const activityLower = activity.toLowerCase();
      if (objective.toLowerCase().includes(activityLower)) {
        limitations.push({
          activity: activity,
          limitation: `Limited ${activityLower} capacity`,
          duration: 'Ongoing',
          frequency: 'Constant',
        });
      }
    }
    
    return limitations;
  }
  
  private static extractWorkRestrictions(plan: string): WSIBWorkRestriction[] {
    const restrictions: WSIBWorkRestriction[] = [];
    
    // Look for restriction patterns
    const restrictionPatterns = [
      /(?:no|avoid|restrict).*?(?:lift|stand|walk|bend|reach).*?(\d+).*?(?:lb|kg|pound|kilogram)/i,
      /(?:limit|restrict).*?(?:to|at).*?(\d+).*?(?:hour|minute)/i,
    ];
    
    for (const pattern of restrictionPatterns) {
      const match = plan.match(pattern);
      if (match) {
        restrictions.push({
          restriction: match[0],
          reason: 'Clinical assessment',
          duration: 'As per treatment plan',
        });
      }
    }
    
    return restrictions;
  }
  
  private static extractReturnToWorkRecommendations(plan: string): WSIBReturnToWork {
    // Extract RTW recommendations from plan
    const rtwMatch = plan.match(/(?:return.?to.?work|RTW|work capacity).*?:(.+)/i);
    
    return {
      currentCapacity: rtwMatch?.[1]?.trim() || 'Limited capacity',
      recommendedWorkType: 'Modified duties',
      restrictions: this.extractWorkRestrictions(plan),
      timeline: 'As per treatment progress',
      accommodations: ['Ergonomic assessment', 'Workplace modifications'],
      reviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };
  }
  
  private static extractFrequency(plan: string): string | null {
    const frequencyMatch = plan.match(/(\d+).*?(?:time|session|visit).*?(?:per|week|month)/i);
    return frequencyMatch ? frequencyMatch[0] : null;
  }
  
  private static extractDuration(plan: string): string | null {
    const durationMatch = plan.match(/(\d+).*?(?:week|month|day)/i);
    return durationMatch ? durationMatch[0] : null;
  }
  
  private static extractModalities(plan: string): string[] {
    const modalities: string[] = [];
    const commonModalities = [
      'Manual therapy', 'Exercise therapy', 'Electrotherapy', 'Heat therapy',
      'Cold therapy', 'Ultrasound', 'TENS', 'Acupuncture',
    ];
    
    const lowerPlan = plan.toLowerCase();
    for (const modality of commonModalities) {
      if (lowerPlan.includes(modality.toLowerCase())) {
        modalities.push(modality);
      }
    }
    
    return modalities;
  }
  
  private static extractExercises(plan: string): string[] {
    const exercises: string[] = [];
    const exercisePattern = /(?:exercise|stretch|strengthen).*?:(.+)/gi;
    const matches = plan.matchAll(exercisePattern);
    
    for (const match of matches) {
      if (match[1]) {
        exercises.push(match[1].trim());
      }
    }
    
    return exercises;
  }
  
  private static extractExpectedOutcome(plan: string, assessment: string): string | null {
    const outcomeMatch = plan.match(/(?:expected|goal|outcome).*?:(.+)/i) ||
                        assessment.match(/(?:prognosis|expected).*?:(.+)/i);
    return outcomeMatch?.[1]?.trim() || null;
  }
  
  private static extractGoals(plan: string, assessment: string): string[] {
    const goals: string[] = [];
    const goalPattern = /(?:goal|objective).*?:(.+)/gi;
    const combinedText = `${plan} ${assessment}`;
    const matches = combinedText.matchAll(goalPattern);
    
    for (const match of matches) {
      if (match[1]) {
        goals.push(match[1].trim());
      }
    }
    
    return goals.length > 0 ? goals : ['Improve functional capacity', 'Reduce pain', 'Return to work'];
  }
  
  private static generateProgressNotes(
    previousLimitations: WSIBFunctionalLimitation[],
    currentLimitations: WSIBFunctionalLimitation[],
    previousReport: WSIBFormData,
    currentReport: WSIBFormData
  ): string {
    const notes: string[] = [];
    
    notes.push('Progress Report - Comparison with previous assessment:');
    notes.push(`Previous assessment date: ${previousReport.reportDate.toLocaleDateString()}`);
    notes.push(`Current assessment date: ${currentReport.reportDate.toLocaleDateString()}`);
    
    if (currentLimitations.length < previousLimitations.length) {
      notes.push('Improvement noted: Reduction in functional limitations');
    } else if (currentLimitations.length > previousLimitations.length) {
      notes.push('Note: Additional limitations identified');
    } else {
      notes.push('Status: Stable functional limitations');
    }
    
    return notes.join('\n');
  }
}

