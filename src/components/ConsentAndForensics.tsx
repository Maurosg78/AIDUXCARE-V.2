import React from 'react';
import { Shield, Lock, FileCheck, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ConsentAndForensicsProps {
  hasConsent: boolean;
  onConsentChange: (consent: boolean) => void;
  sessionId?: string;
  timestamp?: string;
}

export const ConsentAndForensics: React.FC<ConsentAndForensicsProps> = ({
  hasConsent,
  onConsentChange,
  sessionId,
  timestamp
}) => {
  const { t, language } = useLanguage();
  
  const texts = {
    es: {
      title: 'Cumplimiento Legal y Trazabilidad',
      consentTitle: 'Consentimiento PIPEDA/PHIPA',
      consentText: 'El paciente ha sido informado y consiente la grabación y procesamiento de sus datos de salud según las normativas PIPEDA (Canadá) y PHIPA (Ontario)',
      forensicTitle: 'Trazabilidad Forense',
      sessionLabel: 'Sesión ID:',
      timestampLabel: 'Timestamp:',
      hashLabel: 'Hash:',
      warningText: 'Se requiere consentimiento antes de procesar datos del paciente'
    },
    en: {
      title: 'Legal Compliance and Traceability',
      consentTitle: 'PIPEDA/PHIPA Consent',
      consentText: 'The patient has been informed and consents to the recording and processing of their health data according to PIPEDA (Canada) and PHIPA (Ontario) regulations',
      forensicTitle: 'Forensic Traceability',
      sessionLabel: 'Session ID:',
      timestampLabel: 'Timestamp:',
      hashLabel: 'Hash:',
      warningText: 'Consent required before processing patient data'
    }
  };
  
  const txt = texts[language];

  return (
    <div className="bg-gray-50 border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">{txt.title}</h3>
        </div>
      </div>

      <div className="mb-3 p-3 bg-white rounded border">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasConsent}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="mt-1"
          />
          <div>
            <div className="font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-600" />
              {txt.consentTitle}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {txt.consentText}
            </p>
          </div>
        </label>
      </div>

      <div className="p-3 bg-blue-50 rounded">
        <div className="flex items-center gap-2 mb-2">
          <FileCheck className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-sm">{txt.forensicTitle}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-600">{txt.sessionLabel}</span>
            <span className="ml-1 font-mono">{sessionId || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-600">{txt.timestampLabel}</span>
            <span className="ml-1">{timestamp || new Date().toISOString()}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-600">{txt.hashLabel}</span>
            <span className="ml-1 font-mono text-xs">
              {sessionId ? btoa(sessionId).substring(0, 16) : 'pending'}
            </span>
          </div>
        </div>
      </div>

      {!hasConsent && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">{txt.warningText}</span>
        </div>
      )}
    </div>
  );
};

export default ConsentAndForensics;
