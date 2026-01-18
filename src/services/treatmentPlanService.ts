/**
 * Treatment Plan Service
 * 
 * Manages saving and retrieving treatment plans for patient follow-up reminders.
 * When a treatment plan is accepted/finalized, it's saved for future reference.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import { collection, doc, setDoc, getDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { serverTimestamp } from 'firebase/firestore';

export interface TreatmentPlan {
  id: string;
  patientId: string;
  patientName: string;
  clinicianId: string;
  planText: string; // Full plan text from SOAP note
  acceptedAt: string; // ISO timestamp
  visitType: 'initial' | 'follow-up';
  modalities?: string[]; // Extracted modalities: TENS, US, Tecar, Infrared, Shockwave
  frequency?: string; // e.g., "3 sessions per week"
  duration?: string; // e.g., "6 weeks"
  goals?: string[]; // Treatment goals
  interventions?: string[]; // Specific interventions
  nextAppointment?: string; // Next appointment date
  nextSessionFocus?: string; // Bloque 5E: Focus for next session (usado en treatmentPlanService)
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
}

export interface TreatmentReminder {
  planId: string;
  patientId: string;
  patientName: string;
  reminderText: string; // "According to treatment plan, today corresponds to: [extracted interventions]"
  visitNumber: number; // 2, 3, 4, etc.
  lastVisitDate?: string;
}

class TreatmentPlanService {
  private COLLECTION_NAME = 'treatment_plans';

  /**
   * Create manual initial treatment plan for existing patients (without SOAP)
   * Used when a physiotherapist brings existing patients to AiduxCare
   */
  async createManualInitialPlan(
    patientId: string,
    patientName: string,
    clinicianId: string,
    planData: {
      interventions: string[];
      modalities?: string[];
      homeExercises?: string[];
      patientEducation?: string[];
      goals: string[];
      followUp?: string;
      nextSessionFocus: string;
      planText?: string; // Optional: full text version
    }
  ): Promise<string> {
    try {
      const planId = `plan-manual-${patientId}-${Date.now()}`;
      
      // Construct planText from structured data if not provided
      const planText = planData.planText || this.constructPlanTextFromStructured(planData);
      
      const treatmentPlan: TreatmentPlan = {
        id: planId,
        patientId,
        patientName,
        clinicianId,
        planText,
        acceptedAt: new Date().toISOString(),
        visitType: 'initial', // Mark as initial even though it's manual
        interventions: planData.interventions,
        ...(planData.modalities && planData.modalities.length > 0 && { modalities: planData.modalities }),
        ...(planData.homeExercises && planData.homeExercises.length > 0 && { homeExercises: planData.homeExercises }),
        ...(planData.patientEducation && planData.patientEducation.length > 0 && { patientEducation: planData.patientEducation }),
        goals: planData.goals,
        ...(planData.followUp && { nextAppointment: planData.followUp }),
        nextSessionFocus: planData.nextSessionFocus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const planRef = doc(db, this.COLLECTION_NAME, planId);
      await setDoc(planRef, treatmentPlan);

      console.log(`✅ Manual initial treatment plan created: ${planId}`);
      return planId;
    } catch (error) {
      console.error('Error creating manual initial plan:', error);
      throw new Error('Failed to create manual initial plan');
    }
  }

  /**
   * Construct planText from structured data (for manual plans)
   */
  private constructPlanTextFromStructured(planData: {
    interventions: string[];
    modalities?: string[];
    homeExercises?: string[];
    patientEducation?: string[];
    goals: string[];
    followUp?: string;
    nextSessionFocus: string;
  }): string {
    const parts: string[] = [];
    
    parts.push('- Interventions:');
    planData.interventions.forEach(int => parts.push(`  • ${int}`));
    
    if (planData.modalities && planData.modalities.length > 0) {
      parts.push('- Modalities:');
      planData.modalities.forEach(mod => parts.push(`  • ${mod}`));
    } else {
      parts.push('- Modalities: None');
    }
    
    if (planData.homeExercises && planData.homeExercises.length > 0) {
      parts.push('- Home Exercises:');
      planData.homeExercises.forEach(ex => parts.push(`  • ${ex}`));
    } else {
      parts.push('- Home Exercises: None');
    }
    
    if (planData.patientEducation && planData.patientEducation.length > 0) {
      parts.push('- Patient Education:');
      planData.patientEducation.forEach(edu => parts.push(`  • ${edu}`));
    } else {
      parts.push('- Patient Education: None');
    }
    
    parts.push('- Goals:');
    planData.goals.forEach(goal => parts.push(`  • ${goal}`));
    
    if (planData.followUp) {
      parts.push(`- Follow-up: ${planData.followUp}`);
    }
    
    parts.push(`- Next Session Focus: ${planData.nextSessionFocus}`);
    
    return parts.join('\n');
  }

  /**
   * Save treatment plan when SOAP note is finalized/accepted
   */
  async saveTreatmentPlan(
    patientId: string,
    patientName: string,
    clinicianId: string,
    planText: string,
    visitType: 'initial' | 'follow-up',
    soapNote?: any
  ): Promise<string> {
    try {
      const planId = `plan-${patientId}-${Date.now()}`;
      
      // Extract structured data from plan text
      const modalities = this.extractModalities(planText);
      const frequency = this.extractFrequency(planText);
      const duration = this.extractDuration(planText);
      const goals = this.extractGoals(planText);
      const interventions = this.extractInterventions(planText);
      const homeExercises = this.extractHomeExercises(planText);
      const patientEducation = this.extractPatientEducation(planText);
      const nextAppointment = this.extractNextAppointment(planText);
      const nextSessionFocus = this.extractNextSessionFocus(planText);

      // Clean undefined values for Firestore
      const treatmentPlan: TreatmentPlan = {
        id: planId,
        patientId,
        patientName,
        clinicianId,
        planText,
        acceptedAt: new Date().toISOString(),
        visitType,
        ...(modalities && modalities.length > 0 && { modalities }),
        ...(frequency && { frequency }),
        ...(duration && { duration }),
        ...(goals && goals.length > 0 && { goals }),
        ...(interventions && interventions.length > 0 && { interventions }),
        ...(homeExercises && homeExercises.length > 0 && { homeExercises }),
        ...(patientEducation && patientEducation.length > 0 && { patientEducation }),
        ...(nextAppointment && { nextAppointment }),
        ...(nextSessionFocus && { nextSessionFocus }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const planRef = doc(db, this.COLLECTION_NAME, planId);
      await setDoc(planRef, treatmentPlan);

      console.log(`✅ Treatment plan saved: ${planId}`);
      return planId;
    } catch (error) {
      console.error('Error saving treatment plan:', error);
      throw new Error('Failed to save treatment plan');
    }
  }

  /**
   * Get treatment plan for a patient (most recent)
   */
  async getTreatmentPlan(patientId: string): Promise<TreatmentPlan | null> {
    try {
      const plansRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        plansRef,
        where('patientId', '==', patientId),
        orderBy('acceptedAt', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as TreatmentPlan;
    } catch (error) {
      console.error('Error fetching treatment plan:', error);
      return null;
    }
  }

  /**
   * Get treatment reminder for follow-up visit
   * Returns reminder text based on saved treatment plan
   */
  async getTreatmentReminder(
    patientId: string,
    visitNumber: number
  ): Promise<TreatmentReminder | null> {
    try {
      const plan = await this.getTreatmentPlan(patientId);
      if (!plan || plan.visitType !== 'initial') return null;

      // Build reminder text
      const reminderParts: string[] = [];
      
      if (plan.interventions && plan.interventions.length > 0) {
        reminderParts.push(...plan.interventions);
      } else if (plan.modalities && plan.modalities.length > 0) {
        reminderParts.push(...plan.modalities.map(m => `${m} therapy`));
      } else {
        // Fallback: extract from plan text
        const extracted = this.extractInterventions(plan.planText);
        if (extracted.length > 0) {
          reminderParts.push(...extracted);
        }
      }

      const reminderText = reminderParts.length > 0
        ? `According to treatment plan, today corresponds to: ${reminderParts.join(', ')}`
        : `According to treatment plan, continue with prescribed interventions.`;

      return {
        planId: plan.id,
        patientId: plan.patientId,
        patientName: plan.patientName,
        reminderText,
        visitNumber,
      };
    } catch (error) {
      console.error('Error generating treatment reminder:', error);
      return null;
    }
  }

  /**
   * Extract modalities from plan text (structured format)
   * Supports both structured format (with "Modalities:" header) and legacy format
   */
  private extractModalities(planText: string): string[] {
    const modalities: string[] = [];
    const text = planText.toLowerCase();
    
    // Try structured format first: "Modalities: [list]"
    const structuredMatch = planText.match(/modalities?:\s*([^\n]+(?:\n(?!-?\s*(?:Home|Patient|Goals?|Follow-up|Next))[^\n]+)*)/i);
    if (structuredMatch) {
      const modalitiesText = structuredMatch[1].toLowerCase();
      
      // Check for "None" or "not applicable"
      if (modalitiesText.includes('none') || modalitiesText.includes('not applicable') || modalitiesText.includes('n/a')) {
        return []; // No modalities
      }
      
      // Extract specific modalities
      if (modalitiesText.includes('tens') || modalitiesText.includes('transcutaneous electrical')) {
        modalities.push('TENS');
      }
      if (modalitiesText.includes('ultrasound') || modalitiesText.includes(' us ') || modalitiesText.includes('us therapy')) {
        modalities.push('US');
      }
      if (modalitiesText.includes('tecar') || modalitiesText.includes('diathermy')) {
        modalities.push('Tecar therapy');
      }
      if (modalitiesText.includes('infrared') || modalitiesText.includes('ir light')) {
        modalities.push('Infrared light');
      }
      if (modalitiesText.includes('shockwave') || modalitiesText.includes('eswt')) {
        modalities.push('Shockwave therapy');
      }
    } else {
      // Fallback to legacy format: search entire text
      if (text.includes('tens') || text.includes('transcutaneous electrical')) {
        modalities.push('TENS');
      }
      if (text.includes('ultrasound') || text.includes(' us ') || text.includes('us therapy')) {
        modalities.push('US');
      }
      if (text.includes('tecar') || text.includes('diathermy')) {
        modalities.push('Tecar therapy');
      }
      if (text.includes('infrared') || text.includes('ir light')) {
        modalities.push('Infrared light');
      }
      if (text.includes('shockwave') || text.includes('eswt')) {
        modalities.push('Shockwave therapy');
      }
    }

    return modalities;
  }

  /**
   * Extract frequency from plan text
   */
  private extractFrequency(planText: string): string | undefined {
    const frequencyMatch = planText.match(/(\d+)\s*(sessions?|times?|visits?)\s*(per|a|each)\s*(week|month)/i);
    if (frequencyMatch) {
      return `${frequencyMatch[1]} ${frequencyMatch[2]} per ${frequencyMatch[4]}`;
    }
    return undefined;
  }

  /**
   * Extract duration from plan text
   */
  private extractDuration(planText: string): string | undefined {
    const durationMatch = planText.match(/(\d+)\s*(weeks?|months?|sessions?)/i);
    if (durationMatch) {
      return `${durationMatch[1]} ${durationMatch[2]}`;
    }
    return undefined;
  }

  /**
   * Extract goals from plan text (structured format)
   * Supports both structured format (with "Goals:" header) and legacy format
   */
  private extractGoals(planText: string): string[] {
    const goals: string[] = [];
    
    // Try structured format first: "Goals: [list]"
    const structuredMatch = planText.match(/goals?:\s*([^\n]+(?:\n(?!-?\s*(?:Follow-up|Next|Patient|Home|Modalities?|Interventions?))[^\n]+)*)/i);
    if (structuredMatch) {
      const goalText = structuredMatch[1];
      // Split by bullets, dashes, numbers, or commas
      const goalList = goalText
        .split(/\n\s*[-•*]\s*|\n\s*\d+\.\s*|,\s*(?=[A-Z])/)
        .map(g => g.trim())
        .filter(g => g.length > 0 && !g.toLowerCase().includes('follow-up') && !g.toLowerCase().includes('next session'));
      goals.push(...goalList);
    } else {
      // Fallback to legacy format
      const legacyMatch = planText.match(/goals?:?\s*([^\n]+)/i);
      if (legacyMatch) {
        const goalText = legacyMatch[1];
        const goalList = goalText.split(/\d+\.|\n-|\n\*/).filter(g => g.trim());
        goals.push(...goalList.map(g => g.trim()).filter(g => g.length > 0));
      }
    }
    
    return goals.slice(0, 5); // Limit to 5 goals
  }

  /**
   * Extract interventions from plan text (structured format)
   * Supports both structured format (with "Interventions:" header) and legacy format
   */
  private extractInterventions(planText: string): string[] {
    const interventions: string[] = [];
    const text = planText.toLowerCase();
    
    // Try structured format first: "Interventions: [list]"
    const structuredMatch = planText.match(/interventions?:\s*([^\n]+(?:\n(?!-?\s*(?:Modalities?|Home|Patient|Goals?|Follow-up|Next))[^\n]+)*)/i);
    if (structuredMatch) {
      const interventionText = structuredMatch[1];
      // Split by bullets, dashes, or commas
      const interventionList = interventionText
        .split(/\n\s*[-•*]\s*|\n\s*\d+\.\s*|,\s*(?=[A-Z])/)
        .map(i => i.trim())
        .filter(i => i.length > 0 && !i.toLowerCase().includes('modalities') && !i.toLowerCase().includes('home exercises'));
      interventions.push(...interventionList);
    } else {
      // Fallback to legacy format: look for "interventions:" anywhere
      const legacyMatch = planText.match(/interventions?:?\s*([^\n]+)/i);
      if (legacyMatch) {
        const interventionText = legacyMatch[1];
        const interventionList = interventionText.split(/\n-|\n\*|,\s*/).filter(i => i.trim());
        interventions.push(...interventionList.map(i => i.trim()).filter(i => i.length > 0));
      }
    }
    
    return interventions.slice(0, 10); // Limit to 10 interventions
  }

  /**
   * Extract next appointment from plan text (structured format)
   * Supports both structured format (with "Follow-up:" header) and legacy format
   */
  private extractNextAppointment(planText: string): string | undefined {
    // Try structured format first: "Follow-up: [details]"
    const followUpMatch = planText.match(/follow-up:\s*([^\n]+(?:\n(?!-?\s*(?:Next|Patient|Home|Modalities?|Interventions?|Goals?))[^\n]+)*)/i);
    if (followUpMatch) {
      return followUpMatch[1].trim();
    }
    
    // Fallback to legacy format: "next appointment" or "reassess"
    const appointmentMatch = planText.match(/next\s*(appointment|cita|visit):?\s*([^\n]+)/i);
    if (appointmentMatch) {
      return appointmentMatch[2].trim();
    }
    
    // Also check for "reassess in X weeks"
    const reassessMatch = planText.match(/reassess\s+(?:in|after)\s+([^\n]+)/i);
    if (reassessMatch) {
      return `Reassess ${reassessMatch[1].trim()}`;
    }
    
    return undefined;
  }

  /**
   * Extract "Next Session Focus" from plan text (structured format)
   * This is critical for populating "Today's Plan" in follow-up visits
   */
  private extractNextSessionFocus(planText: string): string | undefined {
    // Try structured format: "Next Session Focus: [focus]"
    const focusMatch = planText.match(/next\s+session\s+focus:\s*([^\n]+(?:\n(?!-?\s*(?:Interventions?|Modalities?|Home|Patient|Goals?|Follow-up))[^\n]+)*)/i);
    if (focusMatch) {
      return focusMatch[1].trim();
    }
    
    return undefined;
  }

  /**
   * Extract home exercises from plan text (structured format)
   */
  private extractHomeExercises(planText: string): string[] {
    const exercises: string[] = [];
    
    // Try structured format: "Home Exercises: [list]"
    const structuredMatch = planText.match(/home\s+exercises?:\s*([^\n]+(?:\n(?!-?\s*(?:Patient|Goals?|Follow-up|Next|Modalities?|Interventions?))[^\n]+)*)/i);
    if (structuredMatch) {
      const exerciseText = structuredMatch[1];
      // Check for "None"
      if (exerciseText.toLowerCase().includes('none') || exerciseText.toLowerCase().includes('not prescribed')) {
        return [];
      }
      // Split by bullets, dashes, numbers, or commas
      const exerciseList = exerciseText
        .split(/\n\s*[-•*]\s*|\n\s*\d+\.\s*|,\s*(?=[A-Z])/)
        .map(e => e.trim())
        .filter(e => e.length > 0);
      exercises.push(...exerciseList);
    }
    
    return exercises.slice(0, 10); // Limit to 10 exercises
  }

  /**
   * Extract patient education topics from plan text (structured format)
   */
  private extractPatientEducation(planText: string): string[] {
    const topics: string[] = [];
    
    // Try structured format: "Patient Education: [list]"
    const structuredMatch = planText.match(/patient\s+education:\s*([^\n]+(?:\n(?!-?\s*(?:Goals?|Follow-up|Next|Home|Modalities?|Interventions?))[^\n]+)*)/i);
    if (structuredMatch) {
      const educationText = structuredMatch[1];
      // Check for "None"
      if (educationText.toLowerCase().includes('none') || educationText.toLowerCase().includes('not applicable')) {
        return [];
      }
      // Split by bullets, dashes, numbers, or commas
      const topicList = educationText
        .split(/\n\s*[-•*]\s*|\n\s*\d+\.\s*|,\s*(?=[A-Z])/)
        .map(t => t.trim())
        .filter(t => t.length > 0);
      topics.push(...topicList);
    }
    
    return topics.slice(0, 5); // Limit to 5 topics
  }
}

export default new TreatmentPlanService();

