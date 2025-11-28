# Vertex AI Canada Verification - W1-002 Task 2

## 1. Active Project (CLI)
```bash
gcloud config list project
```
- Result: `project = aiduxcare-v2-uat-dev`
- Evidence: `vertex-project-config.txt`

## 2. Cloud Function Region Check
```bash
gcloud functions describe vertexAIProxy --region=northamerica-northeast1
```
- Confirms function name + location `northamerica-northeast1`
- Endpoint: `https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy`
- Evidence: `vertex-function-describe.txt`

## 3. Client Configuration Audit
```bash
rg -n "VERTEX_PROXY_URL" src
```
- All occurrences reference the same Canadian endpoint (lines recorded in `vertex-env-occurrences.txt`).
- Additional scan for `northamerica-northeast1` stored in `vertex-region-strings.txt`.

## 4. Runtime Availability Test
```bash
curl -I https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy
```
- Returns HTTP/2 405 (expected for HEAD without POST) proving endpoint reachable.
- Evidence: `vertex-proxy-head.txt`.

## 5. Summary
- ✅ All serverless components for Vertex AI run in `northamerica-northeast1`.
- ✅ Client-side code calls only the Canadian proxy URL.
- ✅ No references to US regions detected.
- ✅ Evidence stored for ISO audit.

## Next Steps
1. Remove Ollama codepaths and env vars.
2. Re-run `rg -n "ollama"` to confirm zero references.
3. Perform regression tests + document results.

--
**Status**: ✅ Vertex verification completed (2025-11-27).
