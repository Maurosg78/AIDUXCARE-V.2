# WO-PDF-STUCK-001 — Informe de diagnóstico: bloqueo "Processing file…" en extracción PDF

**Fecha:** 2026-02-23  
**Objetivo:** Determinar con evidencia técnica por qué el estado "Processing file… Extracting text from PDF" queda bloqueado indefinidamente en el piloto.  
**Restricción:** Solo instrumentación (logs temporales). Sin cambios de lógica, UI, configuración ni servicios.

---

## 1. Secuencia real de logs observados en navegador

*(Rellenar tras reproducir en piloto: subir un PDF y copiar aquí los logs de consola en orden cronológico.)*

```
[Orden cronológico esperado si el flujo estuviera completo:]
1. [AttachmentCard] Upload triggered <nombre>.pdf application/pdf
2. [AttachmentCard] Setting status = processing
3. [FileProcessor] START <nombre>.pdf application/pdf
4. [FileProcessor] Processing: ...
5. [FileProcessor] Checking PDF branch application/pdf
6. [FileProcessor] Entering PDF branch
7. [FileProcessor] 📄 Extracting text from PDF: ...
8. [PDFExtractor] START <nombre>.pdf
9. [PDFExtractor] Starting extraction from: ...
10. [PDF] workerSrc = <url>
11. [PDFExtractor] Before getDocument
12. [PDFExtractor] Document loaded
13. [PDFExtractor] PDF loaded: N pages
14. [PDFExtractor] ✅ Extracted ... characters ...
15. [PDFExtractor] Extraction finished
16. [FileProcessor] PDF extraction resolved
17. [FileProcessor] ✅ Extracted ...
```

**Logs realmente observados (sesión piloto 2026-02-23):**

En la consola aparecen: Firebase (Functions no available, Firestore init, Storage OK), consent, workflow, login, profile, `workflow_session_started`, `Auto-saved workflow state` (con `transcriptLength: 2561`), y repeticiones de consent resolution. **No aparece ningún log de la instrumentación PDF/adjuntos:** ni `[AttachmentCard] Upload triggered`, ni `[AttachmentCard] Setting status = processing`, ni `[FileProcessor] START`, ni `[PDFExtractor] START`, ni `[PDF] workerSrc`, ni `Before getDocument`, ni `Document loaded`, ni `Extraction finished`, ni `[FileProcessor] ERROR` ni `[PDFExtractor] ERROR`. Hay un `DEBUG FILE:` manual (listener añadido en consola por el usuario), pero no logs del código instrumentado.

---

## 2. Punto exacto donde el flujo se detiene

Marcar según lo observado:

- [x] **No entra en FileProcessor** — No aparece `[FileProcessor] START`. Implicación: en la sesión capturada no se ejecutó `FileProcessorService.processFile()` (o el build desplegado no incluye los logs, o no se subió un PDF en esta captura).
- [ ] **No entra en branch PDF** — Aparece `START` pero no `Entering PDF branch`. Implicación: `isValidPDF(file)` devuelve false o no se llega al `if`.
- [ ] **Se cuelga en getDocument** — Aparece `Before getDocument` pero nunca `Document loaded`. Implicación: `loadingTask.promise` no resuelve (worker/PDF.js).
- [ ] **Promesa nunca resuelve** — Último log visto: _______________ . La promesa de extracción queda pendiente.
- [ ] **Excepción silenciosa** — Aparece `[FileProcessor] ERROR` o `[PDFExtractor] ERROR` (revisar stack).

**Último log que SÍ aparece antes del bloqueo:** No aplica — no se observaron logs del flujo de extracción PDF en esta captura.

---

## 3. Confirmación: ¿La promesa de extracción termina?

- [ ] **Resuelve** — Se ve "Extraction finished" y/o "PDF extraction resolved"; la UI pasa a texto extraído o mensaje de error.
- [ ] **Rechaza** — Se ve "ERROR" en consola; la UI debería mostrar error si está manejada.
- [x] **No se puede afirmar / No se inició** — En esta captura no apareció ninguno de los logs de extracción; o el flujo de extracción no se ejecutó (nadie llama a `processFile` tras el upload) o el build en piloto no incluye la instrumentación.

---

## 4. Conclusión técnica (máx. 10 líneas)

**Conclusión:**

En la sesión de consola proporcionada **no aparece ningún log de la instrumentación** (`[AttachmentCard]`, `[FileProcessor]`, `[PDFExtractor]`). Eso implica una de tres cosas: (1) **El build desplegado en piloto no incluye los logs** (hay que desplegar un build que contenga los cambios de WO-PDF-STUCK-001 y volver a reproducir). (2) **En esta captura no se subió un PDF** en la pantalla de adjuntos del workflow (solo se ve uso de transcript y consent). (3) **El flujo nunca llama a la extracción:** en el código actual de `ProfessionalWorkflowPage`, tras `handleAttachmentUpload` solo se hace `ClinicalAttachmentService.upload()` y `setAttachments([...prev, ...uploads])`; no hay ninguna llamada a `FileProcessorService.processFile()` para los adjuntos recién subidos, por tanto `extractedText` nunca se rellena y la tarjeta queda en "Processing file…" indefinidamente. Para cerrar el diagnóstico: desplegar build con instrumentación, subir un PDF en el workflow y capturar de nuevo; si entonces sigue sin aparecer `[FileProcessor] START`, la causa es (3) — falta integrar `processFile` tras el upload en ese flujo.

---

## 5. Instrumentación añadida (referencia)

| Archivo | Logs añadidos |
|--------|----------------|
| `ClinicalAttachmentCard.tsx` | `[AttachmentCard] Upload triggered` (name, contentType); `[AttachmentCard] Setting status = processing` |
| `FileProcessorService.ts` | `[FileProcessor] START`; `Checking PDF branch`; `Entering PDF branch`; `PDF extraction resolved`; `[FileProcessor] ERROR` en catch |
| `pdfTextExtractor.ts` | `[PDFExtractor] START`; `Before getDocument`; `Document loaded`; `Extraction finished`; `[PDFExtractor] ERROR` en catch |

Todos los logs son temporales y no alteran flujos ni configuración.
