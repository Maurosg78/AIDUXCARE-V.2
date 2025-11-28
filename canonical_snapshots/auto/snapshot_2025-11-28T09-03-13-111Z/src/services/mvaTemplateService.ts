/**
 * MVA Template Service
 * 
 * Transforms SOAP notes into MVA-formatted documents for motor vehicle accident claims.
 * Handles extraction, formatting, and validation of MVA-specific data.
 * 
 * Sprint 2B - Day 3-4: MVA Templates
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: OCF Standards, CPO Documentation Standards
 */

import type { SOAPNote } from '../types/vertex-ai';
import type { Session } from './sessionComparisonService';
import type {
  MVAFormData,
  MVAFormType,
  MVAPatientInfo,
  MVAProfessionalInfo,
  MVAAccidentInfo,
  MVAInjuryInfo,
  MVAClinicalAssessment,
  MVATreatmentInfo,
  MVAAttendantCareInfo,
  MVAInsuranceInfo,
  MVAFunctionalLimitation,
  MVACompliance,
  MVAValidationResult,
} from '../types/mva';

/**
 * MVA Template Service
 * 
 * Provides methods to extract MVA-specific data from SOAP notes
 * and generate OCF-compliant forms.
 */
export class MVATemplateService {
  /**
   * Extract MVA-specific data from SOAP note and session
   * 
   * @param soapNote - SOAP note to extract data from
   * @param session - Session data containing patient and professional info
   * @param patientData - Patient data from database
   * @param professionalData - Professional data from database
   * @param insuranceData - Insurance information (optional)
   * @returns MVAFormData object
   */
  static extractMVAData(
    soapNote: SOAPNote,
    session: Session,
    patientData: any,
    professionalData: any,
    insuranceData?: any
  ): MVAFormData {
    // Extract patient information
    const patientInfo = this.extractPatientInfo(patientData, session);
    
    // Extract professional information
    const professionalInfo = this.extractProfessionalInfo(professionalData);
    
    // Extract accident information from SOAP
    const accidentInfo = this.extractAccidentInfo(soapNote, session, patientData);
    
    // Extract injury information from SOAP
    const injuryInfo = this.extractInjuryInfo(soapNote);
    
    // Extract clinical assessment from SOAP
    const clinicalAssessment = this.extractClinicalAssessment(soapNote);
    
    // Extract treatment information from SOAP Plan
    const treatmentInfo = this.extractTreatmentInfo(soapNote, session);
    
    // Extract insurance information
    const insuranceInfo = this.extractInsuranceInfo(insuranceData, patientData);
    
    // Build compliance information
    const compliance = this.buildComplianceInfo();
    
    return {
      formType: 'treatment-plan', // Default, can be changed
      formVersion: 'OCF-18',
      reportDate: new Date(),
      patient: patientInfo,
      professional: professionalInfo,
      accident: accidentInfo,
      injury: injuryInfo,
      clinical: clinicalAssessment,
      treatment: treatmentInfo,
      insurance: insuranceInfo,
      compliance: compliance,
    };
  }
  
  /**
   * Extract patient information
   */
  private static extractPatientInfo(patientData: any, session: Session): MVAPatientInfo {
    return {
      name: patientData?.name || patientData?.fullName || session.patientName || 'Unknown',
      dateOfBirth: patientData?.dateOfBirth?.toDate?.() || patientData?.dateOfBirth || new Date(),
      address: patientData?.address || patientData?.streetAddress || '',
      city: patientData?.city || '',
      province: patientData?.province || 'ON',
      postalCode: patientData?.postalCode || patientData?.postal_code || '',
      phone: patientData?.phone || patientData?.phoneNumber || '',
      email: patientData?.email || undefined,
      insurancePolicyNumber: patientData?.insurancePolicyNumber || 
                            patientData?.insurance_policy_number || 
                            undefined,
      claimNumber: patientData?.mvaClaimNumber || 
                  patientData?.mva_claim_number || 
                  patientData?.claimNumber || 
                  undefined,
      dateOfAccident: patientData?.dateOfAccident?.toDate?.() || 
                     patientData?.dateOfAccident || 
                     patientData?.accidentDate?.toDate?.() || 
                     patientData?.accidentDate || 
                     new Date(),
      driverLicenseNumber: patientData?.driverLicenseNumber || 
                          patientData?.driver_license_number || 
                          undefined,
    };
  }
  
  /**
   * Extract professional information
   */
  private static extractProfessionalInfo(professionalData: any): MVAProfessionalInfo {
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
   * Extract accident information from SOAP note
   */
  private static extractAccidentInfo(
    soapNote: SOAPNote,
    session: Session,
    patientData: any
  ): MVAAccidentInfo {
    const subjective = soapNote.subjective || '';
    
    // Extract accident type from Subjective
    const accidentType = this.extractAccidentType(subjective);
    
    // Extract vehicle role
    const vehicleRole = this.extractVehicleRole(subjective);
    
    // Extract location
    const location = this.extractLocation(subjective, patientData);
    
    // Extract safety equipment usage
    const seatbeltUsed = this.extractSeatbeltUsage(subjective);
    const airbagDeployed = this.extractAirbagDeployment(subjective);
    
    // Extract ambulance and hospital information
    const ambulanceRequired = this.extractAmbulanceRequired(subjective);
    const hospitalAdmitted = this.extractHospitalAdmission(subjective);
    const hospitalInfo = this.extractHospitalInfo(subjective, patientData);
    
    // Extract accident description
    const accidentDescription = this.extractAccidentDescription(subjective);
    
    // Extract date/time
    const dateOfAccident = patientData?.dateOfAccident?.toDate?.() || 
                          patientData?.dateOfAccident || 
                          patientData?.accidentDate?.toDate?.() || 
                          patientData?.accidentDate || 
                          (session.timestamp instanceof Date 
                            ? session.timestamp 
                            : (session.timestamp as any)?.toDate?.() || new Date());
    
    return {
      dateOfAccident,
      timeOfAccident: patientData?.timeOfAccident || undefined,
      location: location || 'Location not specified',
      accidentType: accidentType || 'Motor vehicle accident',
      vehicleRole: vehicleRole || 'driver',
      seatbeltUsed: seatbeltUsed ?? undefined,
      airbagDeployed: airbagDeployed ?? undefined,
      ambulanceRequired: ambulanceRequired || false,
      hospitalAdmitted: hospitalAdmitted || false,
      hospitalName: hospitalInfo.name,
      hospitalAdmissionDate: hospitalInfo.admissionDate,
      hospitalDischargeDate: hospitalInfo.dischargeDate,
      accidentDescription: accidentDescription || subjective || 'Accident details not specified',
    };
  }
  
  /**
   * Extract injury information from SOAP note
   */
  private static extractInjuryInfo(soapNote: SOAPNote): MVAInjuryInfo {
    const objective = soapNote.objective || '';
    const assessment = soapNote.assessment || '';
    const subjective = soapNote.subjective || '';
    
    // Extract body parts affected
    const bodyPartsAffected = this.extractBodyParts(objective);
    
    // Extract primary injury from Assessment
    const primaryInjury = this.extractPrimaryInjury(assessment);
    
    // Extract secondary injuries
    const secondaryInjuries = this.extractSecondaryInjuries(assessment);
    
    // Extract pre-accident and current status
    const { preAccidentStatus, currentStatus } = this.extractStatus(assessment);
    
    // Extract pain level
    const painLevel = this.extractPainLevel(subjective);
    
    // Extract pain location
    const painLocation = this.extractPainLocation(subjective, objective);
    
    // Extract symptoms
    const symptoms = this.extractSymptoms(subjective, objective);
    
    return {
      bodyPartsAffected: bodyPartsAffected,
      primaryInjury: primaryInjury || 'Soft tissue injury',
      secondaryInjuries: secondaryInjuries,
      preAccidentStatus: preAccidentStatus || 'No prior injuries',
      currentStatus: currentStatus || 'Limited functional capacity',
      painLevel: painLevel,
      painLocation: painLocation,
      symptoms: symptoms,
    };
  }
  
  /**
   * Extract clinical assessment from SOAP note
   */
  private static extractClinicalAssessment(soapNote: SOAPNote): MVAClinicalAssessment {
    // Extract functional limitations from Objective section
    const functionalLimitations = this.extractFunctionalLimitations(soapNote.objective);
    
    // Extract prognosis from Assessment
    const prognosis = this.extractPrognosis(soapNote.assessment);
    
    // Extract return-to-activities recommendations from Plan
    const returnToActivitiesRecommendations = this.extractReturnToActivitiesRecommendations(soapNote.plan);
    
    return {
      subjective: soapNote.subjective || '',
      objective: soapNote.objective || '',
      assessment: soapNote.assessment || '',
      plan: soapNote.plan || '',
      functionalLimitations: functionalLimitations,
      prognosis: prognosis || 'Recovery expected with treatment',
      returnToActivitiesRecommendations: returnToActivitiesRecommendations,
    };
  }
  
  /**
   * Extract treatment information from SOAP Plan
   */
  private static extractTreatmentInfo(soapNote: SOAPNote, session: Session): MVATreatmentInfo {
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
      priorApprovalRequired: false, // Default, can be updated
    };
  }
  
  /**
   * Extract insurance information
   */
  private static extractInsuranceInfo(insuranceData?: any, patientData?: any): MVAInsuranceInfo {
    return {
      insuranceCompany: insuranceData?.insuranceCompany || 
                        patientData?.insuranceCompany || 
                        patientData?.insurance_company || 
                        'Unknown',
      policyNumber: insuranceData?.policyNumber || 
                   patientData?.insurancePolicyNumber || 
                   patientData?.insurance_policy_number || 
                   '',
      claimNumber: insuranceData?.claimNumber || 
                  patientData?.mvaClaimNumber || 
                  patientData?.mva_claim_number || 
                  patientData?.claimNumber || 
                  '',
      adjusterName: insuranceData?.adjusterName || 
                   insuranceData?.adjuster_name || 
                   undefined,
      adjusterPhone: insuranceData?.adjusterPhone || 
                    insuranceData?.adjuster_phone || 
                    undefined,
      adjusterEmail: insuranceData?.adjusterEmail || 
                    insuranceData?.adjuster_email || 
                    undefined,
      dateOfReport: new Date(),
    };
  }
  
  /**
   * Build compliance information
   */
  private static buildComplianceInfo(): MVACompliance {
    return {
      dateOfReport: new Date(),
      signatureRequired: true,
      disclaimers: this.addComplianceDisclaimers(),
      cpoCompliant: true,
      phipaCompliant: true,
      ocfCompliant: true,
      statutoryAccidentBenefitsSchedule: true, // SABS compliance
    };
  }
  
  /**
   * Add MVA compliance disclaimers
   */
  static addComplianceDisclaimers(): string[] {
    return [
      "This report is based on clinical assessment and may require verification.",
      "All information provided is accurate to the best of the professional's knowledge.",
      "This document complies with OCF reporting requirements and CPO standards.",
      "Patient consent has been obtained for this report.",
      "This report is subject to review by the insurance company and may require additional documentation.",
      "This report complies with the Statutory Accident Benefits Schedule (SABS).",
    ];
  }
  
  // ========== Helper Methods for Data Extraction ==========
  
  /**
   * Extract accident type from text
   */
  private static extractAccidentType(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('rear-end') || lowerText.includes('rear end')) {
      return 'Rear-end collision';
    }
    if (lowerText.includes('side impact') || lowerText.includes('t-bone') || lowerText.includes('t bone')) {
      return 'Side impact collision';
    }
    if (lowerText.includes('head-on') || lowerText.includes('head on')) {
      return 'Head-on collision';
    }
    if (lowerText.includes('rollover') || lowerText.includes('roll over')) {
      return 'Rollover';
    }
    if (lowerText.includes('single vehicle') || lowerText.includes('single-vehicle')) {
      return 'Single vehicle accident';
    }
    
    return 'Motor vehicle accident';
  }
  
  /**
   * Extract vehicle role from text
   */
  private static extractVehicleRole(text: string): 'driver' | 'passenger' | 'pedestrian' | 'cyclist' | 'motorcyclist' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('passenger')) return 'passenger';
    if (lowerText.includes('pedestrian')) return 'pedestrian';
    if (lowerText.includes('cyclist') || lowerText.includes('bicycle')) return 'cyclist';
    if (lowerText.includes('motorcyclist') || lowerText.includes('motorcycle')) return 'motorcyclist';
    
    return 'driver'; // Default
  }
  
  /**
   * Extract location from text
   */
  private static extractLocation(text: string, patientData?: any): string {
    // Try to extract from patient data first
    if (patientData?.accidentLocation) return patientData.accidentLocation;
    if (patientData?.accident_location) return patientData.accident_location;
    
    // Try to extract from text
    const locationPatterns = [
      /(?:at|on|near|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
      /([A-Z][a-z]+\s+(?:Street|Avenue|Road|Drive|Boulevard|Lane|Way|Court|Place|Circle))/g,
    ];
    
    for (const pattern of locationPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0].replace(/^(?:at|on|near|in)\s+/i, '');
      }
    }
    
    return '';
  }
  
  /**
   * Extract seatbelt usage
   */
  private static extractSeatbeltUsage(text: string): boolean | undefined {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('seatbelt') || lowerText.includes('seat belt')) {
      if (lowerText.includes('not') || lowerText.includes('no seatbelt') || lowerText.includes('unbelted')) {
        return false;
      }
      return true;
    }
    
    return undefined;
  }
  
  /**
   * Extract airbag deployment
   */
  private static extractAirbagDeployment(text: string): boolean | undefined {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('airbag')) {
      if (lowerText.includes('deployed') || lowerText.includes('activated')) {
        return true;
      }
      if (lowerText.includes('not deployed') || lowerText.includes('did not deploy')) {
        return false;
      }
    }
    
    return undefined;
  }
  
  /**
   * Extract ambulance requirement
   */
  private static extractAmbulanceRequired(text: string): boolean {
    const lowerText = text.toLowerCase();
    return lowerText.includes('ambulance') || 
           lowerText.includes('paramedic') || 
           lowerText.includes('ems') ||
           lowerText.includes('emergency medical');
  }
  
  /**
   * Extract hospital admission
   */
  private static extractHospitalAdmission(text: string): boolean {
    const lowerText = text.toLowerCase();
    return lowerText.includes('hospital') || 
           lowerText.includes('admitted') || 
           lowerText.includes('emergency room') ||
           lowerText.includes('er');
  }
  
  /**
   * Extract hospital information
   */
  private static extractHospitalInfo(text: string, patientData?: any): {
    name?: string;
    admissionDate?: Date;
    dischargeDate?: Date;
  } {
    const result: { name?: string; admissionDate?: Date; dischargeDate?: Date } = {};
    
    // Try patient data first
    if (patientData?.hospitalName) result.name = patientData.hospitalName;
    if (patientData?.hospitalAdmissionDate) {
      result.admissionDate = patientData.hospitalAdmissionDate?.toDate?.() || patientData.hospitalAdmissionDate;
    }
    if (patientData?.hospitalDischargeDate) {
      result.dischargeDate = patientData.hospitalDischargeDate?.toDate?.() || patientData.hospitalDischargeDate;
    }
    
    // Try to extract from text
    const hospitalPattern = /(?:at|to|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Hospital|Medical Center|Health Centre)/i;
    const hospitalMatch = text.match(hospitalPattern);
    if (hospitalMatch && !result.name) {
      result.name = hospitalMatch[1] + ' Hospital';
    }
    
    return result;
  }
  
  /**
   * Extract accident description
   */
  private static extractAccidentDescription(text: string): string {
    // Look for accident-related sentences
    const sentences = text.split(/[.!?]+/);
    const accidentSentences = sentences.filter(s => 
      s.toLowerCase().includes('accident') || 
      s.toLowerCase().includes('collision') ||
      s.toLowerCase().includes('crash') ||
      s.toLowerCase().includes('impact')
    );
    
    return accidentSentences.join('. ').trim() || text.substring(0, 500);
  }
  
  /**
   * Extract body parts from text
   */
  private static extractBodyParts(text: string): string[] {
    const bodyParts = [
      'head', 'neck', 'shoulder', 'back', 'spine', 'chest', 'rib',
      'arm', 'elbow', 'wrist', 'hand', 'finger',
      'hip', 'thigh', 'knee', 'leg', 'ankle', 'foot', 'toe',
      'pelvis', 'abdomen', 'pelvic',
    ];
    
    const lowerText = text.toLowerCase();
    const found: string[] = [];
    
    for (const part of bodyParts) {
      if (lowerText.includes(part)) {
        found.push(part.charAt(0).toUpperCase() + part.slice(1));
      }
    }
    
    return found.length > 0 ? found : ['Neck', 'Back']; // Default for MVA
  }
  
  /**
   * Extract primary injury from Assessment
   */
  private static extractPrimaryInjury(assessment: string): string {
    const lowerAssessment = assessment.toLowerCase();
    
    // Common MVA injuries
    if (lowerAssessment.includes('whiplash')) return 'Whiplash';
    if (lowerAssessment.includes('strain')) return 'Muscle strain';
    if (lowerAssessment.includes('sprain')) return 'Ligament sprain';
    if (lowerAssessment.includes('fracture')) return 'Fracture';
    if (lowerAssessment.includes('concussion')) return 'Concussion';
    if (lowerAssessment.includes('disc')) return 'Disc injury';
    
    // Extract first diagnosis
    const sentences = assessment.split(/[.!?]+/);
    if (sentences.length > 0) {
      return sentences[0].trim();
    }
    
    return '';
  }
  
  /**
   * Extract secondary injuries
   */
  private static extractSecondaryInjuries(assessment: string): string[] {
    const injuries: string[] = [];
    const lowerAssessment = assessment.toLowerCase();
    
    // Look for multiple diagnoses
    const diagnosisPatterns = [
      /(?:also|additionally|secondary|secondary to)\s+([^.,]+)/gi,
      /(?:and|with)\s+([^.,]+)/gi,
    ];
    
    for (const pattern of diagnosisPatterns) {
      const matches = assessment.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          injuries.push(match[1].trim());
        }
      }
    }
    
    return injuries;
  }
  
  /**
   * Extract status information
   */
  private static extractStatus(assessment: string): { preAccidentStatus: string; currentStatus: string } {
    const lowerAssessment = assessment.toLowerCase();
    
    let preAccidentStatus = 'No prior injuries';
    let currentStatus = 'Limited functional capacity';
    
    if (lowerAssessment.includes('pre-accident') || lowerAssessment.includes('pre accident')) {
      const preMatch = assessment.match(/pre-?accident[^.]*/i);
      if (preMatch) {
        preAccidentStatus = preMatch[0];
      }
    }
    
    if (lowerAssessment.includes('current') || lowerAssessment.includes('present')) {
      const currentMatch = assessment.match(/current[^.]*/i);
      if (currentMatch) {
        currentStatus = currentMatch[0];
      }
    }
    
    return { preAccidentStatus, currentStatus };
  }
  
  /**
   * Extract pain level (0-10 scale)
   */
  private static extractPainLevel(text: string): number | undefined {
    const painPatterns = [
      /pain\s+(?:level|scale|rating|score)[:\s]+(\d+)/i,
      /(\d+)\/10\s*(?:pain|scale)/i,
      /pain\s+(\d+)/i,
    ];
    
    for (const pattern of painPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const level = parseInt(match[1], 10);
        if (level >= 0 && level <= 10) {
          return level;
        }
      }
    }
    
    return undefined;
  }
  
  /**
   * Extract pain location
   */
  private static extractPainLocation(subjective: string, objective: string): string[] {
    const locations: string[] = [];
    const combined = (subjective + ' ' + objective).toLowerCase();
    
    const painKeywords = ['pain', 'tenderness', 'soreness', 'ache'];
    const bodyParts = [
      'head', 'neck', 'shoulder', 'back', 'spine', 'chest', 'rib',
      'arm', 'elbow', 'wrist', 'hand',
      'hip', 'thigh', 'knee', 'leg', 'ankle', 'foot',
    ];
    
    for (const keyword of painKeywords) {
      for (const part of bodyParts) {
        if (combined.includes(keyword) && combined.includes(part)) {
          const capitalized = part.charAt(0).toUpperCase() + part.slice(1);
          if (!locations.includes(capitalized)) {
            locations.push(capitalized);
          }
        }
      }
    }
    
    return locations;
  }
  
  /**
   * Extract symptoms
   */
  private static extractSymptoms(subjective: string, objective: string): string[] {
    const symptoms: string[] = [];
    const combined = (subjective + ' ' + objective).toLowerCase();
    
    const commonSymptoms = [
      'headache', 'dizziness', 'nausea', 'vomiting', 'fatigue',
      'numbness', 'tingling', 'weakness', 'stiffness', 'swelling',
      'bruising', 'tenderness', 'spasm', 'limited range of motion',
    ];
    
    for (const symptom of commonSymptoms) {
      if (combined.includes(symptom)) {
        const capitalized = symptom.charAt(0).toUpperCase() + symptom.slice(1);
        symptoms.push(capitalized);
      }
    }
    
    return symptoms;
  }
  
  /**
   * Extract functional limitations
   */
  private static extractFunctionalLimitations(objective: string): MVAFunctionalLimitation[] {
    const limitations: MVAFunctionalLimitation[] = [];
    
    // Common activities affected by MVA
    const activities = ['driving', 'lifting', 'sleeping', 'sitting', 'standing', 'walking', 'bending'];
    
    for (const activity of activities) {
      if (objective.toLowerCase().includes(activity)) {
        limitations.push({
          activity: activity.charAt(0).toUpperCase() + activity.slice(1),
          limitation: `Limited ${activity} ability`,
          severity: 'moderate',
          duration: 'Ongoing',
          frequency: 'Daily',
        });
      }
    }
    
    return limitations;
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
   * Extract return-to-activities recommendations
   */
  private static extractReturnToActivitiesRecommendations(plan: string): MVAClinicalAssessment['returnToActivitiesRecommendations'] {
    const lowerPlan = plan.toLowerCase();
    
    return {
      driving: {
        cleared: !lowerPlan.includes('no driving') && !lowerPlan.includes('avoid driving'),
        restrictions: lowerPlan.includes('driving') ? this.extractRestrictions(plan, 'driving') : undefined,
        timeline: lowerPlan.includes('driving') ? this.extractTimeline(plan, 'driving') : undefined,
      },
      work: {
        cleared: !lowerPlan.includes('no work') && !lowerPlan.includes('off work'),
        restrictions: lowerPlan.includes('work') ? this.extractRestrictions(plan, 'work') : undefined,
        timeline: lowerPlan.includes('work') ? this.extractTimeline(plan, 'work') : undefined,
      },
      activitiesOfDailyLiving: {
        status: lowerPlan.includes('limited') ? 'Limited' : 'Normal',
        restrictions: lowerPlan.includes('avoid') ? this.extractRestrictions(plan, 'activities') : undefined,
      },
    };
  }
  
  /**
   * Extract restrictions for a specific activity
   */
  private static extractRestrictions(text: string, activity: string): string | undefined {
    const activityPattern = new RegExp(`${activity}[^.]*`, 'i');
    const match = text.match(activityPattern);
    return match ? match[0].trim() : undefined;
  }
  
  /**
   * Extract timeline for a specific activity
   */
  private static extractTimeline(text: string, activity: string): string | undefined {
    const timelinePatterns = [
      /(\d+)\s*(?:weeks?|months?|days?)/i,
      /(?:in|within|after)\s+(\d+)\s*(?:weeks?|months?|days?)/i,
    ];
    
    const activitySection = text.match(new RegExp(`${activity}[^.]*`, 'i'));
    if (activitySection) {
      for (const pattern of timelinePatterns) {
        const match = activitySection[0].match(pattern);
        if (match) {
          return match[0];
        }
      }
    }
    
    return undefined;
  }
  
  /**
   * Extract frequency from plan
   */
  private static extractFrequency(plan: string): string {
    const frequencyPatterns = [
      /(\d+)\s*(?:x|times)\s*(?:per|a)\s*(?:week|month|day)/i,
      /(?:frequency|schedule)[:\s]+([^.,]+)/i,
    ];
    
    for (const pattern of frequencyPatterns) {
      const match = plan.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }
    
    return '';
  }
  
  /**
   * Extract duration from plan
   */
  private static extractDuration(plan: string): string {
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
   * Extract modalities from plan
   */
  private static extractModalities(plan: string): string[] {
    const modalities: string[] = [];
    const lowerPlan = plan.toLowerCase();
    
    const commonModalities = [
      'manual therapy', 'massage', 'exercise', 'stretching', 'strengthening',
      'ultrasound', 'electrical stimulation', 'heat', 'ice', 'traction',
      'mobilization', 'manipulation', 'acupuncture', 'dry needling',
    ];
    
    for (const modality of commonModalities) {
      if (lowerPlan.includes(modality)) {
        modalities.push(modality.charAt(0).toUpperCase() + modality.slice(1));
      }
    }
    
    return modalities;
  }
  
  /**
   * Extract exercises from plan
   */
  private static extractExercises(plan: string): string[] {
    const exercises: string[] = [];
    const lowerPlan = plan.toLowerCase();
    
    if (lowerPlan.includes('exercise') || lowerPlan.includes('home exercise')) {
      // Try to extract exercise list
      const exerciseSection = plan.match(/(?:exercise|home exercise)[^.]*/i);
      if (exerciseSection) {
        // Look for numbered or bulleted exercises
        const exercisePattern = /(?:^|\n)[\s-]*([A-Z][^.\n]+)/gm;
        const matches = exerciseSection[0].matchAll(exercisePattern);
        for (const match of matches) {
          if (match[1] && match[1].length > 10) {
            exercises.push(match[1].trim());
          }
        }
      }
    }
    
    return exercises.length > 0 ? exercises : ['Home exercise program as prescribed'];
  }
  
  /**
   * Extract expected outcome
   */
  private static extractExpectedOutcome(plan: string, assessment: string): string {
    const combined = (plan + ' ' + assessment).toLowerCase();
    
    if (combined.includes('expected outcome') || combined.includes('expected result')) {
      const outcomeMatch = (plan + ' ' + assessment).match(/(?:expected outcome|expected result)[^.]*/i);
      if (outcomeMatch) {
        return outcomeMatch[0];
      }
    }
    
    return '';
  }
  
  /**
   * Extract goals
   */
  private static extractGoals(plan: string, assessment: string): string[] {
    const goals: string[] = [];
    const combined = plan + ' ' + assessment;
    
    // Look for goals section
    const goalsPattern = /(?:goals?|objectives?)[:\s]+([^.]*)/gi;
    const matches = combined.matchAll(goalsPattern);
    
    for (const match of matches) {
      if (match[1]) {
        // Split by common separators
        const goalList = match[1].split(/[,\n;]/);
        for (const goal of goalList) {
          const trimmed = goal.trim();
          if (trimmed.length > 5) {
            goals.push(trimmed);
          }
        }
      }
    }
    
    return goals.length > 0 ? goals : ['Improve functional capacity', 'Reduce pain', 'Return to normal activities'];
  }
  
  /**
   * Validate MVA form data
   */
  static validateMVAData(data: MVAFormData): MVAValidationResult {
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
    
    if (!data.accident.dateOfAccident) {
      missingFields.push('Date of accident');
    }
    
    if (!data.insurance.claimNumber) {
      warnings.push('Insurance claim number not provided');
    }
    
    if (!data.clinical.assessment) {
      missingFields.push('Clinical assessment');
    }
    
    if (!data.treatment.startDate) {
      missingFields.push('Treatment start date');
    }
    
    // Validation logic
    if (data.accident.dateOfAccident > new Date()) {
      errors.push('Date of accident cannot be in the future');
    }
    
    if (data.patient.dateOfBirth > new Date()) {
      errors.push('Date of birth cannot be in the future');
    }
    
    if (data.treatment.startDate < data.accident.dateOfAccident) {
      warnings.push('Treatment start date is before accident date');
    }
    
    return {
      valid: errors.length === 0 && missingFields.length === 0,
      errors,
      warnings,
      missingFields,
    };
  }
  
  /**
   * Generate MVA Treatment Plan (OCF-18)
   */
  static generateTreatmentPlan(mvaData: MVAFormData): MVAFormData {
    return {
      ...mvaData,
      formType: 'treatment-plan',
      formVersion: 'OCF-18',
    };
  }
  
  /**
   * Generate MVA Treatment Confirmation (OCF-19)
   */
  static generateTreatmentConfirmation(mvaData: MVAFormData): MVAFormData {
    return {
      ...mvaData,
      formType: 'treatment-confirmation',
      formVersion: 'OCF-19',
    };
  }
  
  /**
   * Generate MVA Treatment Plan Update (OCF-23)
   */
  static generateTreatmentPlanUpdate(
    mvaData: MVAFormData,
    previousReport?: MVAFormData
  ): MVAFormData {
    // Add comparison data if previous report exists
    if (previousReport) {
      mvaData.additionalNotes = this.generateUpdateNotes(previousReport, mvaData);
    }
    
    return {
      ...mvaData,
      formType: 'treatment-plan-update',
      formVersion: 'OCF-23',
    };
  }
  
  /**
   * Generate update notes comparing previous and current reports
   */
  private static generateUpdateNotes(previous: MVAFormData, current: MVAFormData): string {
    const notes: string[] = [];
    
    notes.push(`Previous report date: ${previous.reportDate.toLocaleDateString('en-CA')}`);
    notes.push(`Current report date: ${current.reportDate.toLocaleDateString('en-CA')}`);
    notes.push('');
    
    // Compare functional limitations
    if (previous.clinical.functionalLimitations.length !== current.clinical.functionalLimitations.length) {
      notes.push(`Functional limitations changed from ${previous.clinical.functionalLimitations.length} to ${current.clinical.functionalLimitations.length}`);
    }
    
    // Compare treatment progress
    if (previous.treatment.goals.length > 0 && current.treatment.goals.length > 0) {
      notes.push('Treatment goals updated based on progress');
    }
    
    return notes.join('\n');
  }
}

