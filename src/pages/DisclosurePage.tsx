/**
 * Disclosure Page - PHIPA Compliant
 *
 * Public page for patients to view the consent disclosure document
 * sent after verbal consent. No auth required.
 *
 * Route: /disclosure/:patientId
 * Used by: SMS link from sendDisclosureLink (disclosureService)
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Shield, CheckCircle } from 'lucide-react';
import { getVerbalConsentText, getDefaultConsentTextVersion } from '../services/verbalConsentService';

export default function DisclosurePage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [acknowledged, setAcknowledged] = useState(false);

  const textVersion = getDefaultConsentTextVersion();
  const consentText = getVerbalConsentText(textVersion);

  useEffect(() => {
    // Track view for audit (optional - could write to patient_disclosures)
    if (patientId) {
      console.log('[Disclosure] Patient viewed disclosure document:', { patientId });
    }
  }, [patientId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Consent Disclosure Document</h1>
          </div>
          <p className="text-indigo-100 text-sm">
            This document was sent to you following your verbal consent for AI-assisted clinical documentation.
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-b-2xl shadow-xl p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-2">Please read the disclosure statement below:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>This explains how your health information will be used</li>
                  <li>You may withdraw consent at any time by contacting your provider</li>
                  <li>For more details, see our <Link to="/privacy-policy" className="underline font-medium" target="_blank" rel="noopener noreferrer">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Disclosure Text */}
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200 max-h-96 overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Disclosure Statement</h2>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{consentText}</div>
            </div>
          </div>

          {/* Acknowledge */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={() => setAcknowledged(true)}
              className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-medium transition-colors ${
                acknowledged
                  ? 'bg-green-100 text-green-800 cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              disabled={acknowledged}
            >
              {acknowledged ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Acknowledged
                </>
              ) : (
                <>I have read and acknowledge this disclosure</>
              )}
            </button>
          </div>

          <p className="text-center text-sm text-gray-500">
            <Link to="/privacy-policy" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
