import crypto from 'node:crypto';
import type { SOAPNote } from '@/types/vertex-ai';

/** Hash estable (SHA-256 truncado) del contenido clínico SOAP para comparar corridas. */
export function soapHash(soap: SOAPNote | null): string {
  if (!soap) return 'sha256:null';
  const canonical = JSON.stringify({
    subjective: soap.subjective ?? '',
    objective: soap.objective ?? '',
    assessment: soap.assessment ?? '',
    plan: soap.plan ?? '',
    followUp: soap.followUp ?? '',
    precautions: soap.precautions ?? '',
    referrals: soap.referrals ?? '',
  });
  return (
    'sha256:' + crypto.createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 24)
  );
}
