# Architecture Decision - W1-005 De-identification

## Problem
We must guarantee no PHI hits Vertex AI or share exports before identifiers are stripped, while ensuring clinicians receive re-identified content immediately afterward.

## Selected Approach (Approved)
1. **Central Service:** Use `dataDeidentificationService` as single entry point with `deidentify()`, `reidentify()`, `validate()` helpers.
2. **Pipeline Hooks:**
   - `vertex-ai-service-firebase.ts` (Niagara transcription flow)
   - `vertex-ai-soap-service.ts` (SOAP generation flow)
   - Share/export flows (e.g., `hospitalPortalService` copy) for future extension.
3. **Mapping Strategy:**
   - Generate mapping objects per request (not persisted) keyed by `traceId`.
   - Store mapping in memory during request lifecycle; optionally encrypted if persisted.
4. **Audit Logging:**
   - Use `FirestoreAuditLogger` to log `deidentify_start`, `deidentify_complete`, `reidentify_complete` with counts of tokens removed.
5. **Fallback:** If de-ID fails validation, block AI call and surface PHIPA warning.

## Alternatives Considered
- Database-level pseudonymization → rejected (adds latency, conflicts with hospital portal real-time needs).
- Vertex metadata redaction only → rejected (insufficient; PHI would still leave Canada).

## Next Steps
- Wire service into Vertex request helpers with typed interfaces.
- Build unit tests for `dataDeidentificationService` using sample transcripts.
- CLI evidence: before/after snapshots of payloads (sanitized) for auditors.
