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
      const nextAppointment = this.extractNextAppointment(planText);

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
        ...(nextAppointment && { nextAppointment }),
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
   * Extract modalities from plan text
   */
  private extractModalities(planText: string): string[] {
    const modalities: string[] = [];
    const text = planText.toLowerCase();
    
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
   * Extract goals from plan text
   */
  private extractGoals(planText: string): string[] {
    const goals: string[] = [];
    const goalMatches = planText.match(/goals?:?\s*([^\n]+)/i);
    if (goalMatches) {
      const goalText = goalMatches[1];
      // Split by numbers or bullets
      const goalList = goalText.split(/\d+\.|\n-|\n\*/).filter(g => g.trim());
      goals.push(...goalList.map(g => g.trim()).filter(g => g.length > 0));
    }
    return goals.slice(0, 5); // Limit to 5 goals
  }

  /**
   * Extract interventions from plan text
   */
  private extractInterventions(planText: string): string[] {
    const interventions: string[] = [];
    const interventionMatches = planText.match(/interventions?:?\s*([^\n]+)/i);
    if (interventionMatches) {
      const interventionText = interventionMatches[1];
      // Split by bullets or dashes
      const interventionList = interventionText.split(/\n-|\n\*|,\s*/).filter(i => i.trim());
      interventions.push(...interventionList.map(i => i.trim()).filter(i => i.length > 0));
    }
    return interventions.slice(0, 10); // Limit to 10 interventions
  }

  /**
   * Extract next appointment from plan text
   */
  private extractNextAppointment(planText: string): string | undefined {
    const appointmentMatch = planText.match(/next\s*(appointment|cita|visit):?\s*([^\n]+)/i);
    if (appointmentMatch) {
      return appointmentMatch[2].trim();
    }
    return undefined;
  }
}

export default new TreatmentPlanService();

