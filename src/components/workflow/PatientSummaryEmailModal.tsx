/**
 * PatientSummaryEmailModal
 *
 * Preview + confirmation modal before sending the session summary
 * (HEP + in-clinic treatment) to the patient by email.
 *
 * Spain pilot only — rendered only when isSpainPilot() is true.
 */

import React, { useState, useEffect } from 'react';
import { X, Send, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { derivePlanFromText } from '../../utils/derivePlanFromText';
import { sendPatientSummaryEmail } from '../../services/patientSummaryEmailService';

export interface PatientSummaryEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful send so the parent can update the button state. */
  onSent: () => void;
  patientEmail: string;
  patientFirstName: string;
  professionalName: string;
  professionalTitle: string;
  /** Raw SOAP plan text — HEP and in-clinic items are derived from this. */
  planText: string;
}

export const PatientSummaryEmailModal: React.FC<PatientSummaryEmailModalProps> = ({
  isOpen,
  onClose,
  onSent,
  patientEmail,
  patientFirstName,
  professionalName,
  professionalTitle,
  planText,
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const derived = derivePlanFromText(planText);
  const visitDate = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Reset local state each time the modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomMessage('');
      setIsSending(false);
      setIsSent(false);
      setSendError(null);
    }
  }, [isOpen]);

  const handleSend = async () => {
    setIsSending(true);
    setSendError(null);
    try {
      await sendPatientSummaryEmail({
        patientEmail,
        patientFirstName,
        professionalName,
        professionalTitle,
        visitDate,
        inClinicItems: derived.inClinic,
        hepItems: derived.homeProgram,
        customMessage: customMessage.trim() || undefined,
      });
      setIsSent(true);
      onSent();
    } catch {
      setSendError('No se pudo enviar el email. Verifica la conexión e inténtalo de nuevo.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const hasContent = derived.inClinic.length > 0 || derived.homeProgram.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 rounded-full p-2">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Enviar resumen al paciente
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Vista previa del email</p>
            </div>
          </div>
          {!isSent && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Success state */}
        {isSent ? (
          <div className="p-8 text-center">
            <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Resumen enviado</h3>
            <p className="text-sm text-gray-500 mb-6">
              El email ha sido enviado a{' '}
              <strong className="text-gray-700">{patientEmail}</strong>
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            {/* Preview + form */}
            <div className="p-6 space-y-5">

              {/* Email preview card */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4 text-sm">
                <p className="text-gray-700">
                  Hola <strong>{patientFirstName}</strong>,
                </p>
                <p className="text-xs text-gray-500">
                  Resumen de tu sesión del{' '}
                  <strong className="text-gray-700">{visitDate}</strong> con{' '}
                  <strong className="text-gray-700">{professionalName}</strong>.
                </p>

                {derived.inClinic.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                      Hoy trabajamos en
                    </p>
                    <ul className="space-y-1">
                      {derived.inClinic.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-gray-700">
                          <span className="text-gray-400 mt-0.5 select-none">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {derived.homeProgram.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                      Para casa 🏠
                    </p>
                    <ul className="space-y-1">
                      {derived.homeProgram.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-gray-700">
                          <span className="text-gray-400 mt-0.5 select-none">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!hasContent && (
                  <p className="text-xs text-gray-400 italic">
                    No se han encontrado ítems de tratamiento en la nota SOAP.
                  </p>
                )}

                {customMessage.trim() && (
                  <div className="bg-blue-50 border-l-2 border-blue-400 pl-3 py-2 rounded-r">
                    <p className="text-xs text-blue-700 font-medium">Nota de tu fisioterapeuta:</p>
                    <p className="text-xs text-blue-600 mt-0.5">{customMessage}</p>
                  </div>
                )}
              </div>

              {/* Optional custom note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nota opcional para el paciente
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Ej: Recuerda tomar el ibuprofeno solo si hay inflamación. Nos vemos el jueves."
                  rows={3}
                  maxLength={500}
                  className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-gray-400"
                />
                <p className="text-xs text-gray-400 text-right mt-1">
                  {customMessage.length}/500
                </p>
              </div>

              {/* Destination */}
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span>
                  Enviando a:{' '}
                  <strong className="text-gray-700">{patientEmail}</strong>
                </span>
              </div>

              {/* Error */}
              {sendError && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {sendError}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                disabled={isSending || !hasContent}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Confirmar envío
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientSummaryEmailModal;
