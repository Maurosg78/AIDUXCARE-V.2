# Testing Summary - W1-002 Cleanup (2025-11-27)

## 1. Build Verification
- Command: `npm run build`
- Result: ✅ Success (existing chunk-size warnings only)
- Evidence: `build-log.txt`

## 2. Vertex AI Smoke Tests
| Test | Command | Result | Evidence |
|------|---------|--------|----------|
| Virtual Assistant prompt | `npx tsx scripts/test-vertex-virtual-assistant.ts` | ✅ 200 OK, JSON response (~200 chars) | `vertex-virtual-assistant.log` |
| Transcript summary | `curl -X POST ...` | ✅ 200 OK, structured JSON output | `vertex-transcript-smoke.log` |
| Error handling | `curl -X POST` with `action="unsupported"` | ✅ Returns `{ ok:false, error:'unsupported_action' }` | `vertex-error-smoke.log` |

Observations:
- Responses include Canadian region metadata (`northamerica-northeast1`).
- Proxy returns structured JSON suitable for downstream parsing.
- Error handling works as expected (400-level JSON response).

## 3. Next Steps
- [ ] (Optional) Add UI-level smoke scenario once hospital pilot staging ready.
- [ ] Update W1-002 README + DoD after documentation tasks.

All functional smoke tests executed via CLI for auditability.
