# ENGINEERING.md Changelog

## 2026-09-13 — TD-023 confirmado READY

Los 6 índices compuestos de Firestore desplegados la noche del 2026-09-11 (ver entrada abajo) terminaron de construirse y pasaron a `READY` (confirmado con `gcloud firestore indexes composite list`). TD-023 queda cerrado del todo — no solo desplegado, sino verificado activo.

## 2026-09-11 — v1.17 (TD-021 documentado, TD-022 documentado, TD-023 — índices de Firestore faltantes desplegados)

Mismo día que TD-020, con el celular en mano durante la sesión de field-testing:

- **TD-021 registrado, sin arreglar:** hallazgo nuevo, reproducido 1 de 4 veces en la misma sesión — el flujo de generar nota de seguimiento puede colgarse indefinidamente sin ningún error, entre `[HEP-ADHERENCE-PROVENANCE]` y `generateFollowUpSOAPV2Raw`. Causa probable: `resolveFollowUpClinicalContext()` dentro de un `try/catch` que no protege contra una promesa que nunca resuelve ni rechaza (solo contra rechazo) — ninguna llamada de red de esta cadena tiene timeout. Sigue sin confirmarse con reproducción controlada.
- **TD-022 registrado, sin arreglar:** el reloj visible en la app (`useTimer.ts`) y el aviso de pantalla bloqueada (tiempo real de grabación) mostraron valores muy distintos para la misma grabación (03:14 vs. 01:37, exactamente el doble). Confirmado por observación directa que ambos relojes visibles se detienen al bloquear el teléfono con el botón lateral, mientras la grabación nativa sigue corriendo. Distinto de TD-017 — ese era sobre el aviso, este es sobre que el reloj *dentro* de la app no es confiable.
- **TD-023 registrado y resuelto:** `getLatestFinalizedTreatmentDecision` fallaba su consulta ordenada para los 6 campos de ownership posibles, siempre, no de forma intermitente — confirmado con `gcloud` que los índices compuestos que necesita (ya definidos en `firestore.indexes.json`) nunca se habían desplegado a la base real. `firebase deploy --only firestore:indexes` ejecutado; los 6 índices quedaron `CREATING` (confirmados `READY` el 2026-09-13, ver arriba). Fix de infraestructura puro, sin tocar código de la app.

## 2026-09-11 — v1.16 (TD-020 — red_flags/yellow_flags: objeto tratado como string)

Bug de producción confirmado con stack trace mapeado al bundle real (sesión Luciana Correa, AiDux Air), aparecido justo después de desplegar el fix de TD-019 — antes ni siquiera llegaba a este código porque la petición nunca completaba.

- `alerts.red_flags`/`alerts.yellow_flags` son `FollowUpAlertFlag[]` (`{label, evidence, suggested_action}`), no `string[]`. `ProfessionalWorkflowPage.tsx` los casteaba con `as any` a `string[]` antes de pasarlos a `filterRedFlagsAgainstDecisions()`, que sí espera strings de verdad y llama `.normalize('NFD')` sobre cada elemento — de ahí `TypeError: t.normalize is not a function`.
- Solo se disparaba cuando el modelo devolvía al menos un red flag real; con `red_flags` vacío el código nunca tocaba esa rama, por eso no había aparecido en pruebas previas.
- Fix: extracción explícita de `.label` en ambos casos (`red_flags` y el `yellow_flags` con el mismo riesgo latente, sin evidencia de haberse disparado); los dos `as any` removidos — el tipo real (`FollowUpAlerts`) ya existía y hubiera detectado esto en compilación de no ser por el cast.
- Tests: primer archivo de test para `clinicalDecisionService.ts` (no existía ninguno) — incluye un caso que reproduce el `TypeError` exacto si un caller vuelve a pasar objetos sin extraer `.label`.
- TD-020 registrado en `ENGINEERING.md` §7.1.
- Verificación post-deploy de TD-019 (CORS): 4/4 intentos reales completaron `[FOLLOWUP-REQUEST]` → `[FOLLOWUP-RESPONSE] status:200 ok:true` sin error de CORS — 3 de esos 4 cayeron en el bug de TD-020 (confirmando que era real y reproducible), el cuarto se coló silenciosamente antes de llegar a la llamada de red (ver TD-021).
- **Mergeado a `stable` y desplegado 2026-09-13** — el deploy automático (`deploy-pilot.yml`) cubrió el pilot web; falta rebuild + `cap sync` + reinstalar manualmente para que llegue al bundle nativo de AiDux Air.

## 2026-09-10 — v1.15 (TD-019 — CORS bloqueaba AiDux Air en vertexAIProxy)

Bug de producción confirmado con logs de servidor y consola de dispositivo real (sesión Luciana Correa, AiDux Air) — determinístico, no intermitente: `vertexAIProxy` nunca aceptó peticiones desde `capacitor://localhost` (el origen fijo de cualquier app Capacitor/iOS), mientras `whisperProxy` (`cors: true`, sin allowlist) siempre funcionó desde el mismo cliente. Por eso grabar y transcribir nunca fallaba, pero generar la nota de seguimiento fallaba siempre desde el móvil.

- Fix: `capacitor://localhost` agregado a `APP_ALLOWED_ORIGINS` en `functions/index.js` — compartido por `vertexAIProxy`, `apiErasePatientData`, `apiConsentVerify` y el envío de SMS, todas via `applyRestrictedCors`.
- TD-019 registrado en `ENGINEERING.md` §7.1.

## 2026-09-10 — v1.15.1 (CI en verde + TD-011 actualizado con alcance real)

Ejecutado tras auditoría de modularización/CI del mismo día (diagnóstico previo, sin cambios). Tres arreglos de infraestructura de CI, ninguno toca lógica de producto:

- `typecheck.yml`, `size.yml`, `ci.yml` repuntados de `main` a `stable`: `main` lleva 747 commits de atraso y cero pushes desde 2026-02-21 — todo el trabajo real vive en `stable`, y ninguno de los tres workflows disparaba contra esa rama.
- `ci.yml`: corregidas las 7 condiciones `steps.<id>.outputs.<x> == true` (comparación string-vs-booleano, siempre falsa) a `== '<x>'`. También se quitó `version: 10.29.2` del step `Setup pnpm` — mismo conflicto `version`+`packageManager` ya corregido en `typecheck.yml`/`size.yml` el 28-ago, pero no tocado entonces por ser diagnóstico-only.
- Lint: excluido `bin/hashFiles/index.js` (bundle webpack de terceros, no código propio) del linteo; resueltos los ~36 errores/warnings reales repartidos en 9 archivos (`no-useless-escape` en clases de regex, un `no-control-regex` intencional documentado con `eslint-disable` justificado, y un bloque de UI muerto `{false && ...}` eliminado de `ProfessionalWorkflowPage.tsx` tras confirmar que era inalcanzable). Verificado con node que cada cambio de regex produce output idéntico antes/después — dos casos tenían el guion en posición de rango (`[•\-*]`, `[\d\.\)\-\•\*\s]`) donde quitar el escape a ciegas habría roto la clase o cambiado su significado; se reordenó el guion al final en vez de solo quitar la barra.
- Verificado localmente contra `stable`: typecheck ✅, build ✅, size-limit ✅, lint ✅ (0 errores), test:gate ✅, tests de los archivos de regex tocados ✅ (incluye snapshot test, confirma que el valor de los strings no cambió).
- `docs/backlog/PARKING-LOT.md`: las dos entradas de CI movidas a nueva sección "Resueltos", corregidas para reflejar que la causa real incluía el branch equivocado, no solo el bug ya arreglado en agosto.
- TD-011 (`ENGINEERING.md` §7.1) actualizado: 73 usos de `isSpainPilot()`/`!isSpainPilot()` en 43 archivos, no los 3 originalmente estimados. Severidad revisada de Media a Alta.
- Modularización de `ProfessionalWorkflowPage.tsx` explícitamente no tocada — decisión aparte, pendiente.

## 2026-09-09 — v1.14.2 (TD-018 — reintento de red en generación de nota de seguimiento)

Bug de producción confirmado con logs reales (sesión Luciana Correa, AiDux Air), no reproducido en local: al volver de background tras una grabación larga (~90 min suspendido), la red tardaba unos segundos en reestabilizarse y el primer intento de `generateFollowUpSOAPV2Raw` fallaba sin reintentar, descartando 30+ minutos de sesión ya grabada y transcrita.

- Diagnóstico: logs de Cloud Run confirmaron cero peticiones HTTP a `vertexAIProxy` en el momento del fallo (ni siquiera el preflight OPTIONS), aislando la falla al lado cliente, antes del `fetch()`.
- Consola del dispositivo (Safari Web Inspector) confirmó el canal de tiempo real de Firestore reconectando (`network lost` / `WebKit internal error` / 400s) en la misma ventana — la red genuinamente no estaba estable al volver de background.
- Fix: `generateFollowUpSOAPV2Raw` (`vertex-ai-soap-service.ts`) ahora envuelve `buildAuthenticatedJsonHeaders()` + `fetch()` con `withRetry` (reutilizado de `core/audio-pipeline/retryWrapper.ts`, sin duplicar lógica). Solo reintenta fallos de red/`fetch`, no respuestas HTTP de error del servidor.
- Tests: 2 casos nuevos en `vertex-ai-soap-service.test.ts` (reintento exitoso tras un fallo transitorio; `AI_UNAVAILABLE` solo tras agotar los reintentos, no en el primer fallo).
- TD-018 registrado en §7.1.
- **Nota honesta añadida 2026-09-13:** la investigación de TD-019 (dos días después) reveló que `vertexAIProxy` rechazaba por CORS todo origen `capacitor://localhost`, de forma determinística. Es posible que este incidente fuera en realidad el mismo bloqueo de CORS y no inestabilidad de red — no se pudo confirmar retroactivamente, los logs de esa noche ya expiraron. El retry sigue siendo válido para fallos de red genuinos.

## 2026-09-08 — v1.14.1 (TD-013 acotado, TD-014, TD-015 y TD-016 registrados)

Al validar TD-013 con el usuario, dos gaps quedaron claros que el fix original no cerraba:

- **TD-013 se resolvió solo del lado de escritura.** El dato queda a salvo y recuperable con una simple lectura de Firestore — ya no hace falta volver a llamar a Whisper a mano — pero no aparece solo en la UI al reanudar una sesión.
- **TD-014 registrado (Media), resuelto el mismo día:** el flujo de reanudar sesión (`WO-IA-RESUME-01`) lee el transcript de `sessions`, que solo se llena al generar el SOAP — nunca lee `session_audio_backups.transcriptText`. Fix: `getTranscriptTextForSession` hidrata el cuadro de texto desde ahí si `sessions.transcript` está vacío. Corrección posterior: `sessions.transcript` (auto-guardado por `WO-BUG-011` mientras se graba) tiene prioridad sobre `session_audio_backups` — un caso real mostró texto legítimo del profesional que el fix original hubiera ignorado.
- **TD-015 registrado (Baja, backlog explícito):** la persistencia de TD-013 ocurre solo al finalizar la grabación, no por segmento mientras sigue en curso. Si el dispositivo muere durante la grabación (no después de detenerla, que es lo que pasó en el incidente real), el texto se sigue perdiendo. Decisión del usuario: dejarlo en backlog, no es un escenario común.
- **TD-016 registrado (Media, backlog explícito):** los 4 resultados del análisis de IA (`niagaraResults` — red flags, medicamentos, highlights, biopsicosocial) no se persisten hasta el SOAP final — misma clase de riesgo que TD-013, un paso más adelante en el pipeline. Decisión del usuario: esperar a confirmar que el flujo completo funciona bien antes de decidir si se aborda.

## 2026-09-07 — v1.14 (TD-013 — texto de transcripción no persistido server-side, registrado y resuelto)

Detectado tras un incidente real: sesión clínica grabada desde laptop, batería agotada antes de generar el SOAP. El audio quedó a salvo en `session_audio_backups`/Storage, pero el texto de la transcripción se había perdido — se recuperó a mano re-transcribiendo el audio original mientras se preparaba este fix.

- **TD-013 registrado y resuelto en el mismo cambio, severidad Alta:** `whisperProxy.js` es un proxy puro hacia OpenAI — recibe audio, devuelve texto por HTTP, no escribía nada en Firestore. `useTranscript.ts` guardaba el resultado solo en `useState` local (`setTranscriptState`). Si la pestaña/dispositivo que originó la llamada se cerraba antes de que el usuario disparara la generación del SOAP, el texto no era recuperable por ningún camino normal de la app.
- **No es específico de AiDux Air ni del path nativo** — afectaba igual al flujo web de escritorio, que es donde ocurrió el incidente. Era deuda de producto general, no de una feature en spike.
- **`transcriptionStatus: success` en `session_audio_backups` era una señal engañosa:** solo confirmaba que la llamada a Whisper tuvo éxito, no que el texto resultante estuviera guardado o fuera recuperable en la UI.
- **Fix:** `updateAudioBackupTranscriptionStatus` (`src/services/audioBackupService.ts`) acepta ahora `transcriptText` opcional, escrito en el mismo documento de `session_audio_backups`. El call site de éxito en `useTranscript.ts` (`processChunksSequentially`, path web — el único que existe en `stable`) lo pasa apenas Whisper responde con éxito, antes de que el usuario tenga que hacer nada más. El mismo fix se aplicó por separado al path nativo de AiDux Air (`finalizeNativeRecording`) en la rama de esa feature, que todavía no vive en `stable`.

## 2026-06-09 — v1.13.1 (UX clínica — aceptación de sugerencia de medicamento)

Cambio observable en UX clínica: el fisioterapeuta puede aceptar una coincidencia de medicamento sugerida sin perder trazabilidad clínica.

- `applyMedicationSuggestion` (pure helper exportado de `useEditableResults.ts`): preserva `original_text ?? entity.text`, `dose`, `frequency`, `duration`, `mention_status`; escribe `selected_suggestion`, `suggestion_status: accepted_by_clinician`, `requires_review: false`.
- Dedup de dosis normalizado: "25", "25mg", "25 mg", "25 MG" se tratan como equivalentes — no se duplica la dosis en el texto de display.
- UI `ClinicalAnalysisResults.tsx`: chip "Posible coincidencia / Usar sugerencia" reemplaza "¿Quiso decir?"; chip oculto tras aceptación; traza "Texto original" visible al clinician.
- `StructuredMedicationData` extendida: `dose`, `frequency`, `duration`, `selected_suggestion`, `suggestion_status`.
- Tests: 16 tests unitarios sobre `applyMedicationSuggestion` (pure, sin React environment).

## 2026-06-07 — v1.12.1

- Refuerza §8.4 Deploy a producción: la limpieza remota `rm -rf /var/www/pilot/dist/*` antes de cada `gcloud compute scp` queda como regla obligatoria, no solo como comando sugerido.
- Documenta el riesgo operacional observado: bundles Vite antiguos pueden persistir en `/var/www/pilot/dist/assets/`, dejando múltiples `index-[hash].js` y comportamiento impredecible por cache/service worker o referencias HTML/assets desalineadas.
- Añade verificación post-deploy: confirmar que existe un solo bundle principal `index-[hash].js` en el VPS.

## 2026-05-20 — v1.10

- Creado `PRODUCT_VISION.md` v1.0 en `docs/governance/`.
- Añadido §11 en `ENGINEERING.md` como referencia al documento de visión.
- Principio fundacional canonizado. Sesión estratégica CEO/CTO.

## 2026-05-19 — v1.9.2

- Sintetiza guardrails de imagen en taxonomía P0: `diagnostic_image`, `diagnostic_study`, `physio_ultrasound_assessment`, `clinical_context_photo` y `restricted_body_surface_photo`.
- Excluye piel/heridas/cicatrices/edema/hematomas de la foto clínica contextual general y las mueve a superficie corporal restringida.
- Mantiene regla madre: ningún píxel alimenta razonamiento clínico; solo texto OCR o descripción explícita del profesional.

## 2026-05-19 — v1.9.1

- P0 feedback imágenes: aclara ADR-009 para distinguir imágenes diagnósticas de fotos clínicas contextuales.
- FileProcessor clasifica imagen sin OCR como `diagnostic_image` solo si el nombre sugiere imagen diagnóstica; si no, la conserva como `clinical_photo_reference` / `visual_reference_only`.
- Mantiene el guardrail: ninguna imagen sin texto extraíble alimenta el prompt clínico ni genera interpretación diagnóstica automática.

## 2026-05-19 — v1.9

- ADR-009 — Política de scope de imágenes diagnósticas. Base legal España (LOPS, RD 1976/1999, RD 1001/2002, Orden CIN/2135/2008) y Ontario (Physiotherapy Act 1991, CPO mayo 2026).
- Fix FileProcessor: visualScore eliminado del contexto clínico. ocrScore === 0 → rejected.
- Actualiza versión a 1.9 y fecha a 2026-05-19.

## 2026-05-18 — v1.8

- Añadido §1.13 Principio de diseño clínico realista: AiduxCare captura la realidad clínica disponible, estructura según Magee y genera la mejor ficha posible sin agregar carga cognitiva.
- Añadidos ADR-006, ADR-007 y ADR-008: Magee como framework MSK, Zotero como inbox de evidencia candidata y roadmap secuencial de inteligencia clínica.
- Añadidas referencias 28 y 29 para Magee 8th Ed. y la consulta técnica estratégica Vertex AI / Claude de mayo 2026.
- Actualiza versión a 1.8 manteniendo intacta la numeración previa.

## 2026-05-18 — v1.7

- Added safety decision under §1.6: AI-generated physical-test suggestions are disabled by default; manual/library/custom tests remain enabled. Reactivation requires explicit feature flag, region/case guardrails, documented clinical evaluation and CTO approval.
- Añadido §0 Definición de Producto: declaración fundacional de AiduxCare como plataforma documental asistida por IA con memoria longitudinal del paciente y del profesional, y companion thinking como capa de profundidad clínica a demanda.
- Incorpora las tres capas de producto en orden de profundidad regulatoria y de adopción: documentación → memoria longitudinal → companion thinking.
- Incluye nota regulatoria inline que distingue el lenguaje de producto del lenguaje de intended use para documentación MDR/Health Canada.
- Actualiza versión a 1.7 y fecha a 2026-05-18.

## 2026-05-17 — v1.6

- Added §1.12 Clinical Scope Policy — Imaging Analysis.
- Established canonical physiotherapy rule: AiduxCare does not visually interpret diagnostic images for physiotherapy.
- Distinguished permitted source types: written imaging reports/OCR, clinician transcript comments and objective lab values with mandatory attribution.
- Distinguished prohibited source type: diagnostic image visual content cannot generate diagnosis, red flags, treatment, objective findings, key findings or recommended tests.
- Documented deterministic enforcement requirement: prompts may describe the rule, but source classification, post-processing guards and attribution checks enforce it before output reaches SOAP, clinical decisions, memory or Socratic context.
- Added official scope references: BOE RD 1001/2002, BOE Ley 44/2003 and CPO 11 May 2026 scope expansion communication.

## 2026-05-14 — v1.5

- Added §1.7 Diagnostic Imaging Scope Boundary: defines four clinical source levels (transcript, text_layer_pdf, ocr_text, image_visual) with distinct trust levels and prompt rules.
- Established canonical rule: AI is not authorized to interpret diagnostic images; an AI visual description of a radiograph or MRI is not a clinical finding — it is an observation requiring review by a competent professional.
- Added non-negotiable design restrictions for image/OCR attachments in analysis prompts: no AI-generated red flags from visual descriptions, no diagnostic image interpretation, no overruling written radiology reports.
- Documented implementation anchor: `buildAttachmentsSection()` imaging-derived detection and restricted instruction block.
- Added policy type anchor: `ClinicalSourceLevel`, `CanonicalityStatus`, `ImagingInputPolicy`, `ScopeBoundarySignalCategory` in `src/core/clinical-safety/types.ts`.

## 2026-05-13 — v1.4

- Added Principio Sócrates: AiduxCare amplifies clinical reasoning instead of replacing clinician judgment.
- Defined two explicit operating modes: documentation burden reduction and clinician-activated Socratic reasoning.
- Added non-negotiable design restrictions for Socratic mode: traceable observations, forward-looking questions, no imperative clinical language, no repeated same-session prompts and full clinician control.
- Added canonical Socratic architecture: ClinicalContextLedger, threshold evaluation, candidate generation, interaction logging and memory update.
- Established data provenance boundaries: documented facts, AI observations and clinician decisions must not be conflated.
- Added temporal validity as a canonical Socratic constraint: only active, non-superseded and non-expired documented facts can feed threshold evaluation.
- Declared active longitudinal memory as the technical prerequisite for Socratic reasoning.

## 2026-05-07 — v1.3

- Added product north star: AiduxCare as a clinical operating system with auditable AI agents, not an isolated AI note generator.
- Added agentic architecture principles: traceable inputs, verifiable outputs, explicit memory, bounded tools, human confirmation, auditability and prudent escalation.
- Clarified that models are interchangeable components and product advantage lives in the surrounding clinical system: memory, prompts, validators, traceability and clinician authority.

## 2026-05-06 — v1.2

- Added conservative SaMD/MLMD regulatory posture for future commercialization.
- Added Health Canada MLMD 2026 readiness expectations: lifecycle evidence, GMLP, risk management, data, validation, transparency, post-market monitoring and PCCP.
- Added audit baseline artifacts required before commercial sale: intended use, claims register, classification memo, risk file, traceability matrix, model/prompt card, SOC 2 control matrix and DPIA/PIA.
- Added ISO 14971-lite, IEC 62304-lite, ISO/IEC 27001, SOC 2 and ISO/IEC 42001 readiness framing.
- Added rules for clinical feature briefs, commercial claims, AI/ML controls and medical-device cybersecurity readiness.

## 2026-05-05 — v1.1

- Declared `ENGINEERING.md` as the editable source of truth for AiduxCare engineering governance.
- Established PDFs as historical reference artifacts only.
- Added CTO ownership and changelog requirement for future SoT changes.
- Snapshotted the current editable baseline at `docs/governance/ENGINEERING.v2026-05-05.md`.
