# Quality Gates — Evaluation Policy (en-CA)

**Scope:** Automated evals for AiDuxCare Copilot.

## Thresholds (initial)
- Pass rate: **≥ 90%**
- Critical failures: **0**
- Minor failures: **≤ 5** (soft ceiling; gate still passes if pass rate condition is met and critical=0)

## Definitions
- *Pass rate* = passed / (passed + failed)
- *Critical failure* = any eval item marked with `severity: "critical"`
- *Minor failure* = any eval item marked with `severity: "minor"` or unlabelled non-critical

## Enforcement
- CI check: **eval-gate** (blocking)
- When thresholds are not met → job fails (red), merge is blocked
- Release tags run eval and attach artefacts (JSONL + Markdown report)
- A historical trendline is maintained at `tools/eval/trends/quality-trend.md`

## Audit & Traceability
- Artefacts are timestamped (ISO 8601)
- Each release links to the trendline in `main`
- Commit/PR trailers (SoT):
  - Market: CA
  - Language: en-CA
  - COMPLIANCE_CHECKED
  - Signed-off-by: ROADMAP_READ
