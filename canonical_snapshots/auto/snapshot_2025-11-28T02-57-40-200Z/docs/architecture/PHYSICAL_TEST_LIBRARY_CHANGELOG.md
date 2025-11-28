# AiduxCare – Physical Test Library · Changelog
Status: Canonical Log (non-editable without SoT Review)

---

## v1.0 — 2025-11
Initial release as part of Aidux North.

### Added
- 5 MSK regions (Shoulder, Cervical, Lumbar, Knee, Ankle)
- 60+ canonical tests with neutral descriptions
- Fuzzy matching engine (Dice coefficient, internal)
- Manual, AI-suggested and custom test entry
- Functional UI (selection, notes, result toggle)
- Persistent state → SessionContext
- SOAP integration with factual-only output
- Strict PHIPA/PIPEDA guardrails

### Notable exclusions
- No diagnostic interpretations  
- No numerical sensitivity/specificity  
- No treatment recommendations  
- No device parameters  
- No assistant/voice integration (frozen)  

---

## Upcoming (v1.1 – queued)
- Add Hip region
- Expand Shoulder test subclusters
- Cleanup internal typings
- Add unit tests for fuzzy matching

