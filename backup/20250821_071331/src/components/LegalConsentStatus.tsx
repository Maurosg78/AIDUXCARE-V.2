/**
 * 🏛️ Legal Consent Status Component - AiDuxCare V.2
 * Componente para mostrar el estado del consentimiento legal
 * 
 * @version 1.0.0
 * @author CTO/Implementador Jefe
 */

import React, { useState, useEffect } from 'react';
import { legalConsentService, type LegalConsent } from '../services/legalConsentService';

interface LegalConsentStatusProps {
  showDetails?: boolean;
  onConsentChange?: (hasConsent: boolean) => void;
}

export const LegalConsentStatus: React.FC<LegalConsentStatusProps> = ({
  showDetails = false,
  onConsentChange
}) => {
  const [consent, setConsent] = useState<LegalConsent | null>(null);
  const [hasValidConsent, setHasValidConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConsent = () => {
      try {
        const currentConsent = legalConsentService.getCurrentConsent();
        const isValid = legalConsentService.hasValidConsent();
        
        setConsent(currentConsent);
        setHasValidConsent(isValid);
        onConsentChange?.(isValid);
      } catch (error) {
        console.error('Error al verificar consentimiento:', error);
        setHasValidConsent(false);
        onConsentChange?.(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConsent();
  }, [onConsentChange]);

  const handleRevokeConsent = async () => {
    if (!consent?.userId) return;

    try {
      await legalConsentService.revokeConsent(consent.userId);
      setConsent(null);
      setHasValidConsent(false);
      onConsentChange?.(false);
      alert('Consentimiento revocado exitosamente');
    } catch (error) {
      console.error('Error al revocar consentimiento:', error);
      alert('Error al revocar el consentimiento');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Verificando consentimiento...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Estado del Consentimiento Legal</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          hasValidConsent 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {hasValidConsent ? '✅ Válido' : '❌ Pendiente'}
        </div>
      </div>

      {hasValidConsent && consent && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Fecha de Consentimiento:</span>
              <p className="text-gray-600">
                {consent.consentTimestamp?.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Versión:</span>
              <p className="text-gray-600">{consent.version}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Consentimientos Aceptados:</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  consent.termsAccepted ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-700">Términos y Condiciones</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  consent.privacyAccepted ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-700">Política de Privacidad</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  consent.medicalDisclaimerAccepted ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-700">Disclaimer Médico</span>
              </div>
            </div>
          </div>

          {showDetails && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Detalles Técnicos:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>User Agent:</strong> {consent.userAgent}</p>
                <p><strong>Session ID:</strong> {consent.sessionId || 'N/A'}</p>
                <p><strong>IP Address:</strong> {consent.ipAddress || 'N/A'}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <button
              onClick={handleRevokeConsent}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              Revocar Consentimiento
            </button>
            
            <button
              onClick={() => {
                const report = legalConsentService.generateConsentReport();
  console.log('Reporte de consentimiento:', report);
                alert('Reporte generado. Revisa la consola para más detalles.');
              }}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
            >
              Generar Reporte
            </button>
          </div>
        </div>
      )}

      {!hasValidConsent && (
        <div className="text-center py-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Consentimiento Legal Requerido
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Para usar AiDuxCare, debe aceptar los términos y condiciones legales.
          </p>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Importante:</strong> El consentimiento es obligatorio para cumplir 
              con las regulaciones médicas y de privacidad.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 