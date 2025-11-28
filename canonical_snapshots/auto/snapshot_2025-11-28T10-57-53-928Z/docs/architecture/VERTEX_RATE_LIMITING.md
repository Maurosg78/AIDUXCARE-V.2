# AiduxCare — Vertex Quota Safeguards (Niagara Pipeline)

Market: CA · Language: en-CA · Compliance: PHIPA/PIPEDA  
Status: Canonical Addendum (v2025-11)

---

## 1. Purpose
Vertex AI occasionally returns HTTP 429 (`RESOURCE_EXHAUSTED`) in the free-tier environment. To keep the workflow operational—and compliant—we added lightweight client controls that reduce burst traffic without storing additional PHI.

---

## 2. Mitigations Implemented (Free Tier)

| Control | Location | Behaviour |
| --- | --- | --- |
| **Exponential backoff (0s → 2s → 5s)** | `src/hooks/useNiagaraProcessor.ts` | Retries the Niagara call twice when the error code/message indicates rate limiting. Stops early if a non-quota error occurs. |
| **Session-level cooldown (8 seconds)** | `src/hooks/useNiagaraProcessor.ts` | Blocks repeated clicks in the same browser session; users see a friendly prompt without hitting Vertex again. |
| **Transcript sanitization + 6k tail trim** | `src/services/vertex-ai-service-firebase.ts` | Collapses whitespace and submits only the most recent 6,000 characters, reducing payload size while preserving the clinically relevant part of the interview. |

All three measures operate in-memory, respect existing compliance guarantees, and do **not** persist patient content to disk or third-party storage.

---

## 3. PHIPA/PIPEDA Lens
- Controls run on the client session; no additional data is logged.
- Trimming keeps the “minimum necessary” transcript segment; older text remains in the local UI for clinician review.
- Rate-limit messages are non-clinical and contain no identifiers.

---

## 4. Operational Guidance
1. **Free tier**: Continue using these safeguards. Expect an occasional 429 during high traffic.
2. **Paid tier / production**: Move the project to a billing account and request higher Vertex quotas. Keep the safeguards—they smooth real traffic spikes even with guaranteed quota.
3. **Monitoring (future)**: For production, add server-side telemetry (Supabase or Firebase) to track real request rates. No logs should contain PHI.

---

## 5. Future Enhancements (Optional)
- Server relay queue (Cloud Tasks) for clinic-wide deployments.
- Feature flag to adjust cooldown/backoff thresholds per environment.
- Regional failover (`northamerica-northeast1`) while staying within Canadian privacy requirements.

