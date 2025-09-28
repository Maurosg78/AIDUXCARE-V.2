// @ts-nocheck
/**
 * @fileoverview Clinical Decisions Service - Decision Persistence
 * @version 1.0.0 Enterprise
 * @author AiDuxCare Development Team
 */

import { doc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

import { db } from '../lib/firebase';

import logger from '@/shared/utils/logger';

export interface ClinicalDecision {
  sessionId: string;
  itemId: string;
  action: 'confirm' | 'discard' | 'save';
  note?: string;
  userId: string;
  timestamp?: unknown;
  itemType: 'alert' | 'highlight' | 'insight';
  itemTitle: string;
  itemDescription: string;
}

export interface ClinicalDecisionResult {
  success: boolean;
  message: string;
  decisionId?: string;
}

/**
 * Service for managing clinical decisions persistence
 */
export class ClinicalDecisionsService {
  
  /**
   * Records a clinical decision in Firestore
   */
  public static async recordClinicalDecision(decision: ClinicalDecision): Promise<ClinicalDecisionResult> {
    try {
      const decisionId = `${decision.sessionId}_${decision.itemId}_${Date.now()}`;
      const decisionRef = doc(db, 'clinical_decisions', decisionId);
      
      const decisionData = {
        ...decision,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(decisionRef, decisionData);

      return {
        success: true,
        message: 'Decisión clínica registrada exitosamente',
        decisionId
      };
    } catch (error) {
      console.error('Error recording clinical decision:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al registrar decisión clínica'
      };
    }
  }

  /**
   * Gets all clinical decisions for a session
   */
  public static async getSessionDecisions(sessionId: string): Promise<ClinicalDecision[]> {
    try {
      const decisionsRef = collection(db, 'clinical_decisions');
      const q = query(decisionsRef, where('sessionId', '==', sessionId));
      const querySnapshot = await getDocs(q);
      
      const decisions: ClinicalDecision[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        decisions.push({
          sessionId: data.sessionId,
          itemId: data.itemId,
          action: data.action,
          note: data.note,
          userId: data.userId,
          timestamp: data.timestamp,
          itemType: data.itemType,
          itemTitle: data.itemTitle,
          itemDescription: data.itemDescription
        });
      });

      return decisions;
    } catch (error) {
      console.error('Error getting session decisions:', error);
      return [];
    }
  }

  /**
   * Updates an existing clinical decision
   */
  public static async updateClinicalDecision(
    decisionId: string, 
    updates: Partial<ClinicalDecision>
  ): Promise<ClinicalDecisionResult> {
    try {
      const decisionRef = doc(db, 'clinical_decisions', decisionId);
      
      await updateDoc(decisionRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        message: 'Decisión clínica actualizada exitosamente'
      };
    } catch (error) {
      console.error('Error updating clinical decision:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar decisión clínica'
      };
    }
  }

  /**
   * Gets decisions by user
   */
  public static async getUserDecisions(userId: string): Promise<ClinicalDecision[]> {
    try {
      const decisionsRef = collection(db, 'clinical_decisions');
      const q = query(decisionsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const decisions: ClinicalDecision[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        decisions.push({
          sessionId: data.sessionId,
          itemId: data.itemId,
          action: data.action,
          note: data.note,
          userId: data.userId,
          timestamp: data.timestamp,
          itemType: data.itemType,
          itemTitle: data.itemTitle,
          itemDescription: data.itemDescription
        });
      });

      return decisions;
    } catch (error) {
      console.error('Error getting user decisions:', error);
      return [];
    }
  }
}

export default ClinicalDecisionsService;