/**
 * Verbal Consent Modal - PHIPA Compliant
 * 
 * Modal for obtaining verbal consent from patients for voice recording
 * and AI processing of clinical notes.
 * 
 * ISO 27001 Compliance:
 * - A.8.2.3: Handling of assets (consent lifecycle)
 * - A.12.4.1: Event logging (all consent operations)
 * 
 * PHIPA Compliance:
 * - Verbal consent explicitly legal under PHIPA
 * - Physiotherapist acts as authorized facilitator
 * - Patient retains full control
 */

import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, User, Clock, Shield } from 'lucide-react';
import VerbalConsentService, { VERBAL_CONSENT_TEXT, VerbalConsentDetails } from '../../services/verbalConsentService';

export interface VerbalConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName?: string;
  physiotherapistId: string;
  physiotherapistName?: string;
  hospitalId?: string;
  onConsentObtained: (consentId: string) => void;
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
  onConsentObtained,
  onConsentDenied,
}) => {
  const [step, setStep] = useState<'read' | 'response' | 'confirm'>('read');
  const [readStarted, setReadStarted] = useState(false);
  const [patientResponse, setPatientResponse] = useState<'authorized' | 'denied' | 'unable_to_respond' | null>(null);
  const [patientUnderstood, setPatientUnderstood] = useState(false);
  const [voluntarilyGiven, setVoluntarilyGiven] = useState(false);
  const [witnessName, setWitnessName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartReading = () => {
    setReadStarted(true);
    setStep('response');
  };

  const handleResponseSelect = (response: 'authorized' | 'denied' | 'unable_to_respond') => {
    setPatientResponse(response);
    
    if (response === 'authorized') {
      setStep('confirm');
    } else {
      // Patient denied or unable to respond
      handleSubmit(response);
    }
  };

  const handleSubmit = async (response?: 'authorized' | 'denied' | 'unable_to_respond') => {
    const finalResponse = response || patientResponse;
    
    if (!finalResponse) {
      setError('Por favor seleccione la respuesta del paciente');
      return;
    }

    if (finalResponse === 'authorized') {
      if (!patientUnderstood || !voluntarilyGiven) {
        setError('Debe confirmar que el paciente entendió y dio su consentimiento voluntariamente');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (finalResponse === 'authorized') {
        const consentDetails: Omit<VerbalConsentDetails, 'method'> = {
          obtainedBy: physiotherapistName || physiotherapistId,
          patientResponse: 'authorized',
          fullTextRead: VERBAL_CONSENT_TEXT,
          patientUnderstood,
          voluntarilyGiven,
          witnessName: witnessName.trim() || undefined,
          notes: notes.trim() || undefined,
        };

        const result = await VerbalConsentService.obtainConsent(
          patientId,
          physiotherapistId,
          consentDetails,
          { hospitalId }
        );

        if (result.success) {
          onConsentObtained(result.consentId);
          handleClose();
        } else {
          setError('Error al registrar el consentimiento. Por favor intente nuevamente.');
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
      setError(err instanceof Error ? err.message : 'Error al procesar el consentimiento');
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
    setWitnessName('');
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Consentimiento Verbal Requerido</h2>
              <p className="text-blue-100 text-sm">
                {patientName ? `Paciente: ${patientName}` : `ID: ${patientId}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-blue-800 rounded-full p-2 transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'read' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-2">
                      Instrucciones Importantes
                    </h3>
                    <p className="text-yellow-700 text-sm">
                      Debe leer el texto completo de consentimiento al paciente antes de continuar.
                      Este proceso es requerido por PHIPA y es legalmente válido.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">
                    Texto de Consentimiento a Leer
                  </h3>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                    {VERBAL_CONSENT_TEXT}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleStartReading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  He Leído el Texto al Paciente
                </button>
              </div>
            </div>
          )}

          {step === 'response' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Texto leído al paciente</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  ¿Cuál fue la respuesta del paciente?
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
                          ✅ SÍ - Paciente autorizó verbalmente
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          El paciente entendió y autorizó la grabación y procesamiento
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
                          ❌ NO - Paciente no autorizó
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          El paciente no autorizó la grabación
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
                          ⚠️ Paciente no puede decidir (SDM requerido)
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Se requiere representante legal o decisor sustituto
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
                  Volver
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && patientResponse === 'authorized' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Paciente autorizó verbalmente</span>
                </div>
              </div>

              <div className="space-y-4">
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
                        Confirmo que el paciente entendió el texto completo
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        El paciente demostró comprensión del consentimiento
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
                        Confirmo que el consentimiento fue dado voluntariamente
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Sin presión o coerción
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Testigos presentes (opcional)
                  </label>
                  <input
                    type="text"
                    value={witnessName}
                    onChange={(e) => setWitnessName(e.target.value)}
                    placeholder="Ej: Enfermera María, Familiar Juan"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas sobre la obtención del consentimiento..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  Volver
                </button>
                <button
                  onClick={() => handleSubmit()}
                  disabled={!patientUnderstood || !voluntarilyGiven || isSubmitting}
                  className={`px-6 py-2 rounded-lg transition font-medium ${
                    patientUnderstood && voluntarilyGiven && !isSubmitting
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? 'Registrando...' : 'Registrar Consentimiento'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t p-4 rounded-b-lg">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Shield className="w-4 h-4" />
            <span>
              Consentimiento verbal válido bajo PHIPA. Una vez otorgado, es válido para todo el tratamiento.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerbalConsentModal;


