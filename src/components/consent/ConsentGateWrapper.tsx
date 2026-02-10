/**
 * Enterprise wrapper: gates clinical content by consent. Use on any page that needs consent.
 * Renders ConsentGateScreen when consent is required, declined UI when declined, else children.
 */
import React, { useRef, useEffect } from 'react';
import { useConsentGate } from '@/hooks/useConsentGate';
import { useAuth } from '@/hooks/useAuth';
import { ConsentGateScreen } from './ConsentGateScreen';
import { consentLogger } from '@/domain/consent/consentLogger';

export interface ConsentGateWrapperProps {
  patientId: string | null | undefined;
  patientName?: string;
  patientPhone?: string;
  clinicName?: string;
  isFirstSession?: boolean;
  /** Override clinician; if not set, uses useAuth().user */
  physiotherapistId?: string | null;
  physiotherapistName?: string | null;
  children: React.ReactNode;
}

export const ConsentGateWrapper: React.FC<ConsentGateWrapperProps> = ({
  patientId,
  patientName,
  patientPhone,
  clinicName,
  isFirstSession = true,
  physiotherapistId: propPhysiotherapistId,
  physiotherapistName: propPhysiotherapistName,
  children,
}) => {
  const { user } = useAuth();

  const {
    status,
    consentResolution,
    workflowConsentStatus,
    showGate,
    showDeclined,
    handleConsentGranted,
    refetch,
    error,
  } = useConsentGate({ patientId, isFirstSession });

  const physiotherapistId = propPhysiotherapistId ?? user?.uid ?? null;
  const physiotherapistName = propPhysiotherapistName ?? (user?.displayName ?? user?.email ?? undefined);
  const hasLoggedUnmount = useRef(false);
  const shouldLogUnmount = status === 'granted' && consentResolution?.channel === 'none';
  useEffect(() => {
    if (shouldLogUnmount && !hasLoggedUnmount.current) {
      hasLoggedUnmount.current = true;
      consentLogger.info('workflow_gate_unmounted', {});
      if (typeof console !== 'undefined') {
        console.log('[WORKFLOW] Consent resolution from domain');
        console.log('[WORKFLOW] Gate UNMOUNTED, rendering clinical workflow');
      }
    }
  }, [shouldLogUnmount]);

  const handleConsentDeclined = async () => {
    await refetch();
  };

  const handleRecordNewConsent = () => {
    refetch();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center text-red-600">
          <p className="font-medium">Unable to load consent status.</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (status === 'loading' || (patientId && consentResolution == null)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="text-slate-500">Checking consent…</div>
      </div>
    );
  }

  if (showGate && consentResolution) {
    return (
      <ConsentGateScreen
        patientId={patientId!}
        patientName={patientName}
        patientPhone={patientPhone}
        clinicName={clinicName}
        consentResolution={consentResolution}
        physiotherapistId={physiotherapistId ?? undefined}
        physiotherapistName={physiotherapistName}
        onConsentDeclined={handleConsentDeclined}
        onConsentGranted={handleConsentGranted}
      />
    );
  }

  if (showDeclined) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center">
          <p className="font-medium text-amber-700">Consent declined</p>
          <p className="text-sm mt-2 text-slate-600">Clinical workflow is not available until consent is obtained.</p>
          {workflowConsentStatus?.declineReasons?.length ? (
            <p className="text-xs text-slate-500 mt-2">Reasons: {workflowConsentStatus.declineReasons.join(', ')}</p>
          ) : null}
          <button
            type="button"
            onClick={handleRecordNewConsent}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Record new consent
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
