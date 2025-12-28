---
Market: CA
Language: en-CA
Document: SoT
---

# Aidux North — Reading Guide (en-CA)
Start here. This guide explains how to use our Source of Truth (SoT).

## Documents
- `SOURCE_OF_TRUTH.md` — Canonical technical & process baseline for Aidux North.
- `LIMITS.md` — Out-of-scope boundaries and guardrails.

## Defaults
- Market: CA
- Language/locale default: en-CA
- Spain pilots: optional, behind feature flag, never default.

## PR DoD (summary)
- Title/body must include `Market: CA` and `Language: en-CA`.
- No Spanish as default in code or configs.
- Spain pilots only via feature flags.
- CI must pass SoT & CPO compliance.
