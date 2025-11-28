/**
 * Patient Consent Portal Page
 * 
 * Legal document-style portal for patients to provide informed consent
 * for cross-border AI processing of their health data.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 * Compliance: Legal Delivery Framework v1.0
 * 
 * Route: /consent/:token
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PatientConsentService } from '../services/patientConsentService';
import type { PatientConsentToken } from '../services/patientConsentService';
import { LegalConsentDocument } from '../components/consent/LegalConsentDocument';
import { ConsentActionButtons, type ConsentScope } from '../components/consent/ConsentActionButtons';
import logger from '@/shared/utils/logger';

export const PatientConsentPortalPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [consentData, setConsentData] = useState<PatientConsentToken | null>(null);
  const [selectedScope, setSelectedScope] = useState<ConsentScope>('ongoing');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchConsentData = async () => {
      if (!token) {
        setError('Invalid consent link. Please contact your clinic.');
        setLoading(false);
        return;
      }

      try {
        const data = await PatientConsentService.getConsentByToken(token);
        if (!data) {
          setError('This consent link is invalid or has expired. Please contact your clinic for a new link.');
          setLoading(false);
          return;
        }

        setConsentData(data);
      } catch (err) {
        console.error('[CONSENT PORTAL] Error fetching consent data:', err);
        setError('Error loading consent information. Please try again or contact your clinic.');
      } finally {
        setLoading(false);
      }
    };

    fetchConsentData();
  }, [token]);

  const handleConsent = async (scope: ConsentScope, signature?: string) => {
    if (!token) {
      setError('Invalid consent link.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await PatientConsentService.recordConsent(
        token,
        scope,
        signature
      );

      setSuccess(true);
      logger.info('[CONSENT PORTAL] Consent recorded:', {
        token,
        scope,
        patientId: consentData?.patientId,
      });

      // Auto-close after 3 seconds
      setTimeout(() => {
        window.close(); // Close if opened in new window, or navigate
        navigate('/');
      }, 3000);
    } catch (err: any) {
      console.error('[CONSENT PORTAL] Error recording consent:', err);
      setError(err.message || 'Error saving consent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-900">Loading consent information...</p>
        </div>
      </div>
    );
  }

  if (error && !consentData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full border border-gray-900 p-6">
          <h1 className="text-xl text-gray-900 mb-4">Error</h1>
          <p className="text-gray-900 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 border border-gray-900 bg-white text-gray-900 hover:bg-gray-100"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full border border-gray-900 p-6 text-center">
          <h1 className="text-2xl text-gray-900 mb-2">Consent Recorded</h1>
          <p className="text-gray-900 mb-4">
            Thank you for providing your consent. Your response has been recorded.
          </p>
          <p className="text-sm text-gray-900">
            This window will close automatically...
          </p>
        </div>
      </div>
    );
  }

  if (!consentData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-4 border border-gray-300 bg-white p-4 rounded">
            <p className="text-sm text-gray-900">{error}</p>
          </div>
        )}

        {/* Legal Document - Plain Text Format */}
        <LegalConsentDocument
          patientName={consentData.patientName}
          physiotherapistName={consentData.physiotherapistName}
          clinicName={consentData.clinicName}
        />
      </div>

      {/* Fixed Action Buttons - Always Visible */}
      <ConsentActionButtons
        onConsent={handleConsent}
        submitting={submitting}
        selectedScope={selectedScope}
        onScopeChange={setSelectedScope}
      />
    </div>
  );
};

export default PatientConsentPortalPage;
