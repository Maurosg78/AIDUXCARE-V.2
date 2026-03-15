## Jurisdiction Engine Roadmap

Centralized plan for evolving the jurisdiction engine without breaking existing pilots.

### Current state (Phase 1)

- **Active jurisdiction**: `CA-ON` only (Canadian pilot).
- **Engine**:
  - `JurisdictionEngine` defines configs for `CA-ON` and `ES-ES` (ES-ES inactive).
  - `getActiveJurisdiction()` always returns `CA-ON`.
  - UI language helpers exist but are not yet wired into i18n bootstrap.
- **Consent**:
  - `CONSENT_TEXTS` includes:
    - `v1-en-CA`, `v1-en-US`, `v2-en-CA`
    - `v1-es-ES-verbal`, `v1-es-ES-written`
  - Mapping helpers:
    - `getConsentTextVersionForCurrentJurisdiction()` (verbal)
    - `getConsentVersionForPortal(jurisdiction)` (written/portal)

### Guardrails

- Do **not** change `getActiveJurisdiction()` behaviour without:
  - explicit plan for pilot rollout, and
  - smoke tests for CA-ON (consent, workflow, PDFs, landing).
- ES-ES must remain **feature-flagged** until:
  - RGPD consent texts are legally reviewed,
  - minimal ES i18n is in place,
  - Spanish clinical PDF template is ready,
  - Spain landing page is live.

### Future improvements (non-blocking)

These are **tech-debt / refactors**, not required to launch Spain pilot.
They should be done incrementally, after pilots are stable.

- **Consent text API**
  - Replace `getVerbalConsentText` with a neutral `getConsentText(version)`.
  - Keep `getVerbalConsentText` as a thin wrapper during migration for backwards compatibility.

- **Registry helpers**
  - `getConsentTextsForJurisdiction(jurisdiction: string)`:
    - Return all `ConsentText` entries matching `jurisdiction`.
  - `getWrittenConsentForJurisdiction(jurisdiction: string)`:
    - Return the `ConsentText` with `type === 'written'` for that jurisdiction (or `null`).

- **Service split**
  - Separate verbal / written concerns:
    - `VerbalConsentService` (capture + logging).
    - `WrittenConsentService` or portal-specific service (token + portal behaviour).
  - Ensure both rely on the same consent text registry and jurisdiction engine.

- **Consent registry refactor**
  - Consider a more explicit structure, e.g.:
    - `byVersion` (current `CONSENT_TEXTS` / `consentTexts`).
    - `byJurisdictionAndType` (precomputed index to simplify lookups).

- **Jurisdiction-aware i18n**
  - Wire `getUiLanguageForCurrentJurisdiction()` into i18n bootstrap:
    - Only after confirming it does not conflict with user language preferences (`aidux-lang`).

### Activation checklist for ES-ES (high level)

Before switching any real users to `ES-ES`:

1. **i18n mínimo en español**
   - Core UI flows (Command Center, Workflow, Consent, Portal) con labels críticos en ES.
2. **Consentimiento RGPD revisado**
   - Revisión legal de `v1-es-ES-verbal` y `v1-es-ES-written`.
   - Ajustes según feedback de asesoría.
3. **PDF clínico en español**
   - Template `clinical_report_es` con:
     - logo clínica,
     - datos del fisio,
     - evolución y recomendaciones en ES.
4. **Landing para fisios España**
   - Mensaje orientado a reputación clínica, derivaciones y calidad de informe.
5. **Feature flag / kill switch**
   - Capacidad de activar ES-ES solo para cuentas piloto y apagarlo sin afectar CA-ON.

