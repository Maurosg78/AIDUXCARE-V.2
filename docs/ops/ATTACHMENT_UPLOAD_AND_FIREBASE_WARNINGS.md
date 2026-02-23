# Adjuntos (PDF y archivos) — Subida y avisos de Firebase

**Fecha:** 2026-02-23  
**Relación:** WO-CONSENT-VERBAL-FIX-ACTIVATION, QA-CONSENT-WORKFLOW — "subir archivos tipo pdf o adjuntos en general"

---

## 1. ¿La subida de adjuntos usa Firebase Functions?

**No.** La subida de adjuntos clínicos (PDF, imágenes, Word, etc.) usa **solo Firebase Storage**.

- **Servicio:** `src/services/clinicalAttachmentService.ts`
- **Flujo:** navegador → `uploadBytes()` / `getDownloadURL()` de `firebase/storage` → bucket de Storage.
- El mensaje de consola **"Firebase Functions not available in this environment"** no afecta la subida de adjuntos. Functions se usa para otras cosas (por ejemplo Whisper/Cloud Function); si Functions no está disponible en el proyecto, Storage y Firestore siguen funcionando.

---

## 2. Avisos de consola que puedes ignorar para adjuntos

| Mensaje | Significado | ¿Bloquea adjuntos? |
|--------|-------------|---------------------|
| `⚠️ Firebase Functions not available in this environment` | El proyecto no tiene Functions habilitado o el SDK no pudo inicializar Functions. | **No** |
| `⚠️ Firebase Analytics unavailable` | Analytics no está registrado (por ejemplo en algunos entornos). | **No** |

Desde 2026-02-23 el aviso de Functions incluye la aclaración: *"Storage and Firestore are unaffected; attachment uploads use Storage only."*

---

## 3. Tipos de archivo permitidos (backend)

El servicio acepta por MIME (y, si el navegador no envía tipo, por extensión):

- **Imágenes:** cualquier `image/*`
- **PDF:** `application/pdf`, `application/x-pdf` (y extensión `.pdf` si no hay MIME)
- **Texto:** `text/plain`, `text/rtf`, etc. (`text/*`)
- **RTF:** `application/rtf` (y `.rtf`)
- **Word:** `application/msword` (.doc), `application/vnd.openxmlformats-officedocument.*` (.docx, etc.)

Límite por archivo: **25 MB**.  
Si un PDF o adjunto falla con "Unsupported file type", comprobar que el archivo tenga extensión correcta (p. ej. `.pdf`) o que el navegador envíe un MIME permitido; el servicio hace fallback por extensión cuando `file.type` viene vacío.

---

## 4. Dónde se usa la subida en la app

- **Professional Workflow (Analysis tab):** `TranscriptArea` → "Add files" → `handleAttachmentUpload` en `ProfessionalWorkflowPage.tsx` → `ClinicalAttachmentService.upload(file, userId)`.
- **Command Center / intake:** `OngoingPatientIntakeModal` → mismo servicio.

En ambos casos el archivo se sube a Storage en la ruta `clinical-attachments/{userId}/{timestamp}-{uuid}-{nombre}`. No se llama a ninguna Cloud Function para la subida.

---

## 5. Si la subida sigue fallando

1. **Reglas de Storage:** en Firebase Console → Storage → Rules, asegurar que los usuarios autenticados puedan escribir en `clinical-attachments/`.
2. **CORS / bucket:** si el bucket está en otro dominio, revisar configuración CORS del bucket.
3. **Variable de entorno:** `VITE_FIREBASE_STORAGE_BUCKET` debe estar definida (o el bucket por defecto del proyecto).
4. **Tamaño:** archivos &gt; 25 MB se rechazan con mensaje explícito; comprimir o dividir el archivo.
