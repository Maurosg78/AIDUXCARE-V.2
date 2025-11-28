    # ✅ Aidux North — Pull Request Template (Audio Multilingual Module)

    Market: CA | Language: en-CA | Compliance: PHIPA/PIPEDA | SoT lineage: validated

    ## 🧾 PR Title

    Provide a concise title (e.g., `feat(audio): add multilingual detection + manual override in useTranscript`).

    ## 📌 Summary (What This PR Does)

    Describe exactly what the PR introduces.

    Identify whether it touches:
    - `OpenAIWhisperService`
    - `useTranscript`
    - UI components (language selector, warnings, audio button)
    - Niagara metadata integration

    ## 🔍 Scope of Changes

    This PR includes:
    - Auto-detection of EN/ES/FR
    - Manual language override (`Auto | English | Español | Français`)
    - Modo live (chunks cortos, baja latencia)
    - Modo dictation (chunks largos, tolerancia a silencios)
    - Prompt clínico con guardrails (sin PII, genérico, CAN-health focus)
    - Advertencia suave sobre acentos canadienses
    - Metadata audit (sin audio)
    - Integración con Niagara Processor (`{ text, lang, mode, timestamp }`)

    ## 🔒 Security / PHIPA / PIPEDA Compliance Checklist

    Confirma todas:
    - [ ] No se guardó audio (Blob, .wav, .mp3, .ogg, etc.) en disco.
    - [ ] No se escribieron archivos JSON locales en `/audit`, `/logs`, `/tmp`, etc.
    - [ ] Solo se enviaron metadatos permitidos.
    - [ ] El prompt NO contiene PII, nombres de pacientes ni datos identificables.
    - [ ] No se agregó ni habilitó acceso a almacenamiento no cifrado.
    - [ ] No se añadió ninguna dependencia que pueda transmitir audio a terceros.

    ## 🧠 Source of Truth (SoT) Compliance Checklist

    - [ ] Market: CA
    - [ ] Language: en-CA
    - [ ] No se modificaron archivos protegidos sin aprobación previa:
    - `src/core/agent/**`
    - `src/core/niagara/**`
    - `src/features/onboarding/**`
    - `src/pages/**`
    - `src/router.tsx`
    - `src/main.tsx`
    - `vite.config.ts`
    - `docs/north/SOURCE_OF_TRUTH.md`
    - `config/env/*`

    Si se tocó algún archivo restringido, adjunta explicación explícita:
    - Archivo tocado: ______
    - Justificación: ______
    - Alternativas consideradas: ______

    ## 🧱 Architecture & Code Quality

    - [ ] No se renombró `useTranscript`.
    - [ ] Solo se extendió su funcionalidad (idioma + modo).
    - [ ] `OpenAIWhisperService` recibió parámetros nuevos (`languageHint`, `mode`, `prompt`).
    - [ ] No se creó ningún directorio adicional sin aprobación (`src/services/audio`, etc.).
    - [ ] Cualquier hook adicional encapsula, no reemplaza, la lógica existente.
    - [ ] Tipos TypeScript actualizados (`lang`, `mode`, `metadata`).
    - [ ] Sin duplicación de lógica.
    - [ ] Sin side effects inesperados.

    ## 🎨 UX Requirements

    - [ ] Selector de idioma implementado.
    - [ ] Advertencia sobre variabilidad de acentos canadienses.
    - [ ] UI no bloqueante, no intrusiva.
    - [ ] Errores y fallback manejados correctamente.
    - [ ] Modo dictado distingue silencios prolongados sin cortar audio prematuramente.

    ## 🔗 Integration Tests

    - [ ] Whisper devuelve transcript válido en EN, ES y FR.
    - [ ] Auto-detect funciona sin override.
    - [ ] Manual override ignora auto-detect.
    - [ ] Niagara Processor recibe `{ text, lang, mode, timestamp }` sin crash.
    - [ ] Chunks de 3–5 s procesados en modo live.
    - [ ] Chunks largos procesados en modo dictation.

    ## 📦 Test Artifacts

    - [ ] No test artifacts en el repo.
    - [ ] `whisper-test.wav` eliminado
    - [ ] `whisper-response.json` eliminado
    - [ ] Confirmación de `.gitignore` para test artifacts

    ## 📸 Screenshots (opcional)

    Adjuntar si se modificó UI (selector, advertencias, etc.)

    ## ▶️ How to Test (Manual)

    1. Abrir Workflow
    2. Activar audio
    3. Hablar en inglés → transcript correcto
    4. Hablar en español → transcript correcto
    5. Hablar en francés → transcript correcto
    6. Forzar override a ES y hablar en EN → transcript debe seguir ES
    7. Test live mode (chunks cortos)
    8. Test dictation (sin cortar por silencios largos)

    ## 📝 Additional Notes

    Incluye cualquier preocupación técnica, dudas o sugerencias.

    ## ✔️ Final Approval Checklist (for Mauricio)

    - [ ] No viola SoT
    - [ ] No viola PHIPA
    - [ ] No viola arquitectura
    - [ ] Cambios mínimos, controlados
    - [ ] Flujo clínico funcional
    - [ ] Audio resiliente multi-idioma
