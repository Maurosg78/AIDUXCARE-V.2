/**
 * Consent Status Badge Component
 * 
 * Displays current consent status for a patient
 * ISO 27001 Compliant - All status checks are logged
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import VerbalConsentService, { ConsentVerificationResult } from '../../services/verbalConsentService';

export interface ConsentStatusBadgeProps {
  patientId: string;
  physiotherapistId?: string;
  showDetails?: boolean;
  onStatusChange?: (hasConsent: boolean) => void;
}

export const ConsentStatusBadge: React.FC<ConsentStatusBadgeProps> = ({
  patientId,
  physiotherapistId,
  showDetails = false,
  onStatusChange,
}) => {
  const [status, setStatus] = useState<ConsentVerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConsent = async () => {
      setIsLoading(true);
      try {
        const result = await VerbalConsentService.verifyConsent(patientId, physiotherapistId);
        setStatus(result);
        if (onStatusChange) {
          onStatusChange(result.hasConsent && result.status === 'active');
        }
      } catch (error) {
        console.error('[ConsentStatusBadge] Error checking consent:', error);
        setStatus({ hasConsent: false });
        if (onStatusChange) {
          onStatusChange(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (patientId) {
      checkConsent();
    }
  }, [patientId, physiotherapistId, onStatusChange]);

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm">
        <Clock className="w-4 h-4 animate-spin" />
        <span>Verificando...</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  if (status.hasConsent && status.status === 'active') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm">
        <CheckCircle className="w-4 h-4" />
        <span>Consentimiento Activo</span>
        {showDetails && status.obtainedDate && (
          <span className="text-xs text-green-600">
            ({new Date(status.obtainedDate).toLocaleDateString()})
          </span>
        )}
      </div>
    );
  }

  if (status.status === 'expired') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm">
        <Clock className="w-4 h-4" />
        <span>Consentimiento Expirado</span>
      </div>
    );
  }

  if (status.status === 'withdrawn') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm">
        <XCircle className="w-4 h-4" />
        <span>Consentimiento Retirado</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm">
      <AlertCircle className="w-4 h-4" />
      <span>Sin Consentimiento</span>
    </div>
  );
};

export default ConsentStatusBadge;

