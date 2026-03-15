/**
 * Follow-up workflows unified in ProfessionalWorkflowPage
 * to ensure longitudinal reasoning pipeline remains consistent:
 *
 *   capture session → generate SOAP → clinician review → finalize encounter
 *   → record trajectory event → update patient memory
 *
 * This redirect ensures any link to /follow-up (e.g. /follow-up?patientId=X)
 * uses the single official workflow so SOAP save, encounter creation,
 * and Patient Clinical Memory always run.
 */
import { useEffect, useRef } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';

const REDIRECT_EVENT = 'followup_redirect_used';

export function FollowUpRedirect() {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const rest = Array.from(searchParams.entries())
    .filter(([k]) => k !== 'patientId')
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as Record<string, string>);

  const params = new URLSearchParams({ type: 'followup', ...(patientId ? { patientId } : {}), ...rest });
  const target = `/workflow?${params.toString()}`;

  const tracked = useRef(false);

  // Log redirect once per mount (avoids duplicate events in StrictMode / re-renders)
  useEffect(() => {
    if (typeof window === 'undefined' || tracked.current) return;
    tracked.current = true;

    if (process.env.NODE_ENV === 'development') {
      console.log('[FollowUpRedirect] Redirecting to unified workflow', { from: '/follow-up', target, hasPatientId: !!patientId });
    }
    import('../services/analyticsService').then(({ AnalyticsService }) => {
      AnalyticsService.trackEvent(REDIRECT_EVENT, {
        hasPatientId: !!patientId,
        target: target.split('?')[0],
        timestamp: new Date().toISOString(),
      }).catch(() => {});
    });
  }, []);

  return <Navigate to={target} replace />;
}

export default FollowUpRedirect;
