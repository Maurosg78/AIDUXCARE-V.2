/**
 * Verbal Consent Modal - PHIPA Compliant
 * 
 * Modal for obtaining verbal consent from patients for voice recording
 * and AI processing of clinical notes.
 * 
 * Security audit logging:
 * - A.8.2.3: Handling of assets (consent lifecycle)
 * - A.12.4.1: Event logging (all consent operations)
 * 
 * PHIPA Compliance:
 * - Verbal consent explicitly legal under PHIPA
 * - Physiotherapist acts as authorized facilitator
 * - Patient retains full control
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle, AlertCircle, User, Clock, Shield } from 'lucide-react';
import VerbalConsentService, {
  getVerbalConsentText,
  getConsentTextVersionForCurrentJurisdiction,
  getConsentTextVersionForJurisdiction,
  normalizeConsentJurisdiction,
  VerbalConsentDetails,
} from '../../services/verbalConsentService';
// ✅ WO-CONSENT-VERBAL-01-LANG: Multi-jurisdiction support
import { getCurrentJurisdiction } from '../../core/consent/consentJurisdiction';

export interface VerbalConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName?: string;
  physiotherapistId: string;
  physiotherapistName?: string;
  hospitalId?: string;
  jurisdiction?: string;
  onConsentObtained: (consentId: string) => void | Promise<void>;
  onConsentDenied?: () => void;
}

export const VerbalConsentModal: React.FC<VerbalConsentModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  physiotherapistId,
  physiotherapistName,
  hospitalId,
  jurisdiction,
  onConsentObtained,
  onConsentDenied,
}) => {
  const { t } = useTranslation();
  const currentJurisdiction = getCurrentJurisdiction();
  const effectiveJurisdiction = normalizeConsentJurisdiction(jurisdiction || currentJurisdiction);
  const isGdpr = effectiveJurisdiction === 'ES-ES';
  const [step, setStep] = useState<'read' | 'response' | 'confirm' | 'declineConfirm'>('read');
  const [readStarted, setReadStarted] = useState(false);
  const [patientResponse, setPatientResponse] = useState<'authorized' | 'authorized_by_representative' | 'denied' | 'unable_to_respond' | null>(null);
  const [patientUnderstood, setPatientUnderstood] = useState(false);
  const [voluntarilyGiven, setVoluntarilyGiven] = useState(false);
  // ✅ WO-CONSENT-VERBAL-01: Required checkbox with exact text
  const [physiotherapistConfirmed, setPhysiotherapistConfirmed] = useState(false);
  const [witnessName, setWitnessName] = useState('');
  const [notes, setNotes] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [representativeRelationship, setRepresentativeRelationship] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ WO-CONSENT-VERBAL-01-LANG: Get consent text for current jurisdiction
  const consentTextVersion = jurisdiction
    ? getConsentTextVersionForJurisdiction(effectiveJurisdiction)
    : getConsentTextVersionForCurrentJurisdiction();
  const consentText = getVerbalConsentText(consentTextVersion);

  if (!isOpen) return null;

  const handleStartReading = () => {
    setReadStarted(true);
    setStep('response');
  };

  const handleResponseSelect = (response: 'authorized' | 'authorized_by_representative' | 'denied' | 'unable_to_respond') => {
    setPatientResponse(response);
    
    if (response === 'authorized' || response === 'authorized_by_representative') {
      setStep('confirm');
    } else {
      // Patient denied or unable to respond: require an explicit second confirmation.
      setStep('declineConfirm');
    }
  };

  const handleSubmit = async (response?: 'authorized' | 'authorized_by_representative' | 'denied' | 'unable_to_respond') => {
    const finalResponse = response || patientResponse;
    
    if (!finalResponse) {
      setError(t('consent.verbal.errorSelectResponse'));
      return;
    }

    if (finalResponse === 'authorized' || finalResponse === 'authorized_by_representative') {
      // ✅ WO-CONSENT-VERBAL-01: Require all confirmations including physiotherapist checkbox
      if (!patientUnderstood || !voluntarilyGiven || !physiotherapistConfirmed) {
        setError(t('consent.verbal.errorConfirmAll'));
        return;
      }
      if (finalResponse === 'authorized_by_representative' && (!representativeName.trim() || !representativeRelationship.trim())) {
        setError(t('consent.verbal.errorRepresentativeRequired'));
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (finalResponse === 'authorized' || finalResponse === 'authorized_by_representative') {
        // ✅ WO-CONSENT-VERBAL-01-LANG: Get text version for current jurisdiction
        const textVersion = jurisdiction
          ? getConsentTextVersionForJurisdiction(effectiveJurisdiction)
          : getConsentTextVersionForCurrentJurisdiction();
        const consentText = getVerbalConsentText(textVersion);
        const consentJurisdiction = effectiveJurisdiction;
        
        const consentDetails: Omit<VerbalConsentDetails, 'method'> = {
          obtainedBy: physiotherapistName || physiotherapistId,
          patientResponse: finalResponse,
          fullTextRead: consentText,
          patientUnderstood,
          voluntarilyGiven,
          witnessName: witnessName.trim() || undefined,
          notes: notes.trim() || undefined,
          representativeName: finalResponse === 'authorized_by_representative' ? representativeName.trim() || undefined : undefined,
          representativeRelationship: finalResponse === 'authorized_by_representative' ? representativeRelationship.trim() || undefined : undefined,
        };

        const result = await VerbalConsentService.obtainConsent(
          patientId,
          physiotherapistId,
          consentDetails,
          { 
            hospitalId,
            textVersion, // ✅ WO-CONSENT-VERBAL-01-LANG
            jurisdiction: consentJurisdiction, // ✅ WO-CONSENT-VERBAL-01-LANG
          }
        );

        if (result.success) {
          if (typeof console !== 'undefined') console.log('[VerbalConsent] ✅ Consent granted and recorded');
          onConsentObtained(result.consentId ?? '');
          handleClose();
        } else {
          setError(t('consent.verbal.errorRegistering'));
        }
      } else {
        // Consent denied or unable to respond
        if (onConsentDenied) {
          onConsentDenied();
        }
        handleClose();
      }
    } catch (err) {
      console.error('[VerbalConsentModal] Error:', err);
      setError(err instanceof Error ? err.message : t('consent.verbal.errorProcessing'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setStep('read');
    setReadStarted(false);
    setPatientResponse(null);
    setPatientUnderstood(false);
    setVoluntarilyGiven(false);
    setPhysiotherapistConfirmed(false); // ✅ WO-CONSENT-VERBAL-01
    setWitnessName('');
    setNotes('');
    setRepresentativeName('');
    setRepresentativeRelationship('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-blue via-indigo-600 to-primary-purple text-white p-6 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">{t('consent.verbal.title')}</h2>
              <p className="text-indigo-100 text-sm">
                {patientName ? `${t('consent.verbal.patientLabel')}: ${patientName}` : `${t('consent.verbal.idLabel')}: ${patientId}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/90 hover:bg-white/20 rounded-full p-2 transition"
            aria-label={t('consent.verbal.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'read' && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary-blue mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-indigo-900 mb-2">
                      {t('consent.verbal.importantInstructions')}
                    </h3>
                    <p className="text-indigo-700 text-sm">
                      {t('consent.verbal.instructionsBody')} {isGdpr ? t('consent.verbal.instructionsBodyGdpr') : t('consent.verbal.instructionsBodyPhipa')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">
                    {t('consent.verbal.consentTextToRead')}
                  </h3>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                    {consentText}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  {t('consent.verbal.cancel')}
                </button>
                <button
                  onClick={handleStartReading}
                  className="px-6 py-2 bg-gradient-to-r from-primary-blue to-primary-purple text-white rounded-lg hover:from-primary-blue-hover hover:to-primary-purple-hover transition font-medium shadow-md"
                >
                  {t('consent.verbal.iHaveReadToPatient')}
                </button>
              </div>
            </div>
          )}

          {step === 'response' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">{t('consent.verbal.textReadToPatient')}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  {t('consent.verbal.patientResponseQuestion')}
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleResponseSelect('authorized')}
                    className={`w-full p-4 text-left border-2 rounded-lg transition ${
                      patientResponse === 'authorized'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className={`w-5 h-5 ${
                        patientResponse === 'authorized' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <div>
                        <div className="font-medium text-gray-900">
                          ✅ {t('consent.verbal.yesAuthorized')}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {t('consent.verbal.yesAuthorizedDesc')}
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleResponseSelect('denied')}
                    className={`w-full p-4 text-left border-2 rounded-lg transition ${
                      patientResponse === 'denied'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <X className={`w-5 h-5 ${
                        patientResponse === 'denied' ? 'text-red-600' : 'text-gray-400'
                      }`} />
                      <div>
                        <div className="font-medium text-gray-900">
                          ❌ {t('consent.verbal.noDenied')}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {t('consent.verbal.noDeniedDesc')}
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleResponseSelect('authorized_by_representative')}
                    className={`w-full p-4 text-left border-2 rounded-lg transition ${
                      patientResponse === 'authorized_by_representative'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <User className={`w-5 h-5 ${
                        patientResponse === 'authorized_by_representative' ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <div>
                        <div className="font-medium text-gray-900">
                          👤 {t('consent.verbal.representativeAuthorized')}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {t('consent.verbal.representativeAuthorizedDesc')}
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleResponseSelect('unable_to_respond')}
                    className={`w-full p-4 text-left border-2 rounded-lg transition ${
                      patientResponse === 'unable_to_respond'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className={`w-5 h-5 ${
                        patientResponse === 'unable_to_respond' ? 'text-yellow-600' : 'text-gray-400'
                      }`} />
                      <div>
                        <div className="font-medium text-gray-900">
                          ⚠️ {t('consent.verbal.unableToRespond')}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {t('consent.verbal.unableToRespondDesc')}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setStep('read')}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  {t('consent.verbal.back')}
                </button>
              </div>
            </div>
          )}

          {step === 'declineConfirm' && (patientResponse === 'denied' || patientResponse === 'unable_to_respond') && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">
                      {t('consent.verbal.declineConfirmTitle')}
                    </h3>
                    <p className="text-red-800 text-sm">
                      {t('consent.verbal.declineConfirmBody')}
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStep('response')}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('consent.verbal.back')}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(patientResponse)}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Clock className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? t('consent.verbal.registering') : t('consent.verbal.confirmDeclineFinal')}
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (patientResponse === 'authorized' || patientResponse === 'authorized_by_representative') && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    {patientResponse === 'authorized_by_representative'
                      ? t('consent.verbal.representativeAuthorizedVerbally')
                      : t('consent.verbal.patientAuthorizedVerbally')}
                  </span>
                </div>
              </div>

              {patientResponse === 'authorized_by_representative' && (
                <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('consent.verbal.representativeNameLabel')}
                    </label>
                    <input
                      type="text"
                      value={representativeName}
                      onChange={(e) => setRepresentativeName(e.target.value)}
                      placeholder={t('consent.verbal.representativeNamePlaceholder')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('consent.verbal.representativeRelationshipLabel')}
                    </label>
                    <input
                      type="text"
                      value={representativeRelationship}
                      onChange={(e) => setRepresentativeRelationship(e.target.value)}
                      placeholder={t('consent.verbal.representativeRelationshipPlaceholder')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* ✅ WO-CONSENT-VERBAL-01: Required checkbox with exact text */}
                <div>
                  <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={physiotherapistConfirmed}
                      onChange={(e) => setPhysiotherapistConfirmed(e.target.checked)}
                      className="mt-1 w-5 h-5 text-blue-600"
                      required
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {t('consent.verbal.confirmReadToPatient')}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {t('consent.verbal.confirmReadRequired')}
                      </div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={patientUnderstood}
                      onChange={(e) => setPatientUnderstood(e.target.checked)}
                      className="mt-1 w-5 h-5 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {t('consent.verbal.confirmUnderstood')}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {t('consent.verbal.confirmUnderstoodDesc')}
                      </div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={voluntarilyGiven}
                      onChange={(e) => setVoluntarilyGiven(e.target.checked)}
                      className="mt-1 w-5 h-5 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {t('consent.verbal.confirmVoluntary')}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {t('consent.verbal.confirmVoluntaryDesc')}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('consent.verbal.witnessesOptional')}
                  </label>
                  <input
                    type="text"
                    value={witnessName}
                    onChange={(e) => setWitnessName(e.target.value)}
                    placeholder={t('consent.verbal.witnessesPlaceholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('consent.verbal.notesOptional')}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('consent.verbal.notesPlaceholder')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
<button
                onClick={() => setStep('response')}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                disabled={isSubmitting}
              >
                {t('consent.verbal.back')}
              </button>
              <button
                onClick={() => handleSubmit()}
                disabled={!physiotherapistConfirmed || !patientUnderstood || !voluntarilyGiven || isSubmitting}
                className={`px-6 py-2 rounded-lg transition font-medium ${
                  physiotherapistConfirmed && patientUnderstood && voluntarilyGiven && !isSubmitting
                    ? 'bg-gradient-to-r from-primary-blue to-primary-purple text-white hover:from-primary-blue-hover hover:to-primary-purple-hover shadow-md'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? t('consent.verbal.registering') : t('consent.verbal.confirmContinue')}
              </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-t border-indigo-100 p-4 rounded-b-lg">
          <div className="flex items-center gap-2 text-xs text-indigo-700">
            <Shield className="w-4 h-4" />
            <span>
              {isGdpr ? t('consent.verbal.footerGdpr') : t('consent.verbal.footerPhipa')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerbalConsentModal;
