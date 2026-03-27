# ADR-004: CI Guardrails (No SOAP logs, Protect Infra)

- **Status:** Accepted (Oct 2025; CI toolchain note Mar 2026)
- **Scope:** PR-blocking checks that protect patient-adjacent data handling and repo hygiene.
- **No SOAP logs:** Workflow `No SOAP Logs` runs `scripts/check-no-soap-logs.sh`. Failures mean `console.*` / `logger.*` calls in app paths mention SOAP-like terms (see script allowlist). Fix by removing the log or routing through safe telemetry—not by weakening the script without CTO/architecture review.
- **pnpm in Actions:** `package.json` carries an exact pnpm via `packageManager`. The `pnpm/action-setup@v4` step defaults to pnpm 9 unless **`version` matches that field**. Mismatch fails fast with `ERR_PNPM_BAD_PM_VERSION` / “Multiple versions of pnpm specified”. When upgrading pnpm: bump `packageManager`, `engines.pnpm`, and **every** workflow `pnpm/action-setup` `version` in the same change.
