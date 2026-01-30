# Secure Committing — WO-CLINICAL-STATE-REHYDRATION-001 (Fase 0)

**Objetivo:** No comitear nunca API keys ni secrets por error humano.

---

## Reglas

* **Nunca** incluir en commits:
  * Valores que empiecen por `sk-` (OpenAI API keys)
  * Líneas `OPENAI_API_KEY=...` o `VITE_OPENAI_API_KEY=...` con valor real
* **Solo** en `.env.local` / `.env.local.bak` (gitignored) o en secrets del entorno (GitHub/Firebase).

---

## Pre-commit (Husky)

Si Husky está activo, el hook `pre-commit` ejecuta `scripts/check-secrets-pre-commit.sh` y **bloquea** el commit si detecta en los archivos staged:

* `sk-proj-` o `sk-` seguido de 20+ caracteres alfanuméricos
* `OPENAI_API_KEY=` o `VITE_OPENAI_API_KEY=` con valor que parezca key

---

## Si el commit es bloqueado

1. Quita del stage los archivos que contengan la key:  
   `git restore --staged <archivo>`
2. Asegúrate de que la key solo esté en `.env.local` (no versionado).
3. Vuelve a intentar el commit.

---

## Referencias

* WO-COMMIT-HYGIENE-001 — Protocolo de commit y secrets (cerrado).
* `.gitignore` — `.env`, `.env.local`, `.env.*.bak` ignorados.
