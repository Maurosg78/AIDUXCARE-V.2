/**
 * WO-IA-CLOSE-01: Modal de confirmación al cerrar Initial Assessment.
 * Muestra feedback de "todo guardado" y redirige automáticamente al Command Center
 * tras 1–2 segundos para que el fisio vuelva a la lista de pacientes.
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { setSessionCompleted } from '@/features/command-center/todayListSessionStorage';

const REDIRECT_DELAY_MS = 2000;

export interface CloseInitialAssessmentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  patientName?: string;
  baselineId?: string;
}

export function CloseInitialAssessmentConfirmModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  baselineId,
}: CloseInitialAssessmentConfirmModalProps) {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(REDIRECT_DELAY_MS / 1000));

  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(Math.ceil(REDIRECT_DELAY_MS / 1000));
    const t = setTimeout(() => {
      if (patientId) setSessionCompleted(patientId, 'initial');
      onClose();
      navigate('/command-center');
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(t);
  }, [isOpen, onClose, navigate, patientId]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-green-600 rounded-t-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Everything saved</h2>
                <p className="text-sm text-green-100 mt-1">
                  Initial assessment closed. Baseline saved for follow-up visits.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-900">Clinical baseline has been saved.</p>
            {patientName && (
              <p className="text-sm text-green-800 mt-1">
                <strong>Patient:</strong> {patientName}
              </p>
            )}
            {baselineId && (
              <p className="text-xs text-green-700 mt-2 font-mono truncate" title={baselineId}>
                Baseline ID: {baselineId.slice(0, 12)}…
              </p>
            )}
          </div>

          <p className="text-sm text-slate-600 text-center">
            {secondsLeft > 0
              ? `Redirecting to Command Center in ${secondsLeft} s…`
              : 'Redirecting to Command Center…'}
          </p>
        </div>
      </div>
    </div>
  );
}
