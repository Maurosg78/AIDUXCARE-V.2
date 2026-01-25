/**
 * Consent Server Service
 * 
 * Single source of truth for consent verification.
 * ALL consent checks MUST go through Cloud Functions (server-side).
 * 
 * This service replaces all client-side Firestore queries for consent.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: Legal Delivery Framework v1.0
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import { auth } from '../lib/firebase';

const FUNCTION_REGION = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'northamerica-northeast1';
const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aiduxcare-v2-uat-dev';

interface ConsentStatusResponse {
  success: boolean;
  hasValidConsent: boolean;
  status: 'ongoing' | 'session-only' | null;
  consentMethod: 'digital' | 'verbal' | null;
  grantedAt?: string | null;
  error?: string;
  message?: string;
}

/**
 * Check consent status via Cloud Function (server-side)
 * 
 * This is the ONLY allowed method to verify consent in the frontend.
 * All other methods (direct Firestore queries, listeners) are PROHIBITED.
 * 
 * @param patientId - Patient ID to check consent for
 * @returns Promise with consent status
 */
export async function checkConsentViaServer(patientId: string): Promise<ConsentStatusResponse> {
  try {
    // ✅ Get current user for authentication
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('[ConsentServer] User not authenticated, cannot check consent');
      return {
        success: false,
        hasValidConsent: false,
        status: null,
        consentMethod: null,
        error: 'UNAUTHORIZED',
        message: 'User not authenticated'
      };
    }

    // ✅ Get ID token for Cloud Function authentication
    const idToken = await currentUser.getIdToken();

    // ✅ Call Cloud Function
    const functionUrl = `https://${FUNCTION_REGION}-${PROJECT_ID}.cloudfunctions.net/getConsentStatus`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ patientId })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[ConsentServer] Cloud Function error:', {
        status: response.status,
        error: errorData
      });
      
      return {
        success: false,
        hasValidConsent: false,
        status: null,
        consentMethod: null,
        error: errorData.error || 'CLOUD_FUNCTION_ERROR',
        message: errorData.message || 'Failed to check consent status'
      };
    }

    const data: ConsentStatusResponse = await response.json();
    
    if (!data.success) {
      console.warn('[ConsentServer] Cloud Function returned error:', data);
      return {
        success: false,
        hasValidConsent: false,
        status: null,
        consentMethod: null,
        error: data.error || 'UNKNOWN_ERROR'
      };
    }

    console.info('[ConsentServer] Consent status retrieved:', {
      patientId,
      hasValidConsent: data.hasValidConsent,
      status: data.status,
      consentMethod: data.consentMethod
    });

    return data;

  } catch (error: any) {
    const errorMessage = error?.message || '';
    const isCorsError = errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch');
    const isLocalhost = typeof window !== 'undefined' && window.location.origin.includes('localhost');
    
    if (isCorsError && isLocalhost) {
      console.warn('[ConsentServer] CORS error in localhost - this is expected if Cloud Function is not deployed with localhost support');
      // En desarrollo local, no bloquear completamente si hay error de CORS
      // El Optimistic UI Update ya manejó el consentimiento
      return {
        success: false,
        hasValidConsent: false, // Mantener false para que el polling continúe (si no hay consentimiento optimista)
        status: null,
        consentMethod: null,
        error: 'CORS_ERROR_LOCALHOST',
        message: 'CORS error in localhost (expected in development - deploy Cloud Function with localhost support)'
      };
    }
    
    console.error('[ConsentServer] Error checking consent:', error);
    return {
      success: false,
      hasValidConsent: false,
      status: null,
      consentMethod: null,
      error: 'NETWORK_ERROR',
      message: error?.message || 'Failed to check consent status'
    };
  }
}

/**
 * Check if patient has valid consent (convenience wrapper)
 * 
 * @param patientId - Patient ID to check
 * @returns Promise<boolean> - true if patient has valid consent
 */
export async function hasValidConsent(patientId: string): Promise<boolean> {
  const result = await checkConsentViaServer(patientId);
  return result.success && result.hasValidConsent === true;
}
