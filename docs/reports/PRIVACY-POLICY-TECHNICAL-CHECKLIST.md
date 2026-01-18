# Privacy Policy — Technical Checklist Verification

**Fecha:** 2025-01-18  
**Estado:** ⚠️ Pendientes de confirmación

---

## 1. Whisper/OpenAI opt-in

### Estado actual

**⚠️ PROBLEMA ENCONTRADO:** No hay un opt-in explícito en la UI para Whisper/OpenAI transcription.

**Evidencia:**
- `TranscriptArea.tsx`: Permite grabar audio directamente sin consentimiento previo
- `FirebaseWhisperService.ts`: Se llama automáticamente cuando el usuario graba
- No se encontró ningún componente de "opt-in" o "consent for transcription" en la UI

**Privacy Policy dice:**
> "If clinicians **opt in** to audio transcription features, transcription may be processed by a third-party provider outside Canada (e.g., the United States)."

**Recomendación:**
1. **Opción A (rápida):** Cambiar Privacy Policy a:
   > "Audio transcription features may be processed by a third-party provider outside Canada (e.g., the United States) when clinicians use the recording feature."

2. **Opción B (correcta):** Implementar opt-in real:
   - Agregar checkbox/banner en `TranscriptArea` o `ProfessionalWorkflowPage`
   - Mensaje: "Audio transcription uses OpenAI (US). Click to enable."
   - Guardar preferencia en perfil del profesional
   - Solo llamar a Whisper si opt-in está activo

---

## 2. Dirección

### Estado actual

**✅ ACTUALIZADA:** Niagara Falls Innovation Hub

**Privacy Policy dice:**
> **Postal (Pilot / Niagara Hub):**  
> AiduxCare Inc.  
> **Niagara Falls Innovation Hub**  
> 4255 Queen St, Niagara Falls, ON L2E 2L3, Canada

**Confirmación:** ✅ OK por ahora (según instrucciones)

---

## 3. IP logging

### Estado actual

**✅ CONFIRMADO:** Se guarda IP en varios lugares

**Evidencia:**

1. **Functions (`apiConsentVerify`):**
   ```javascript
   // functions/index.js:798-842
   const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip || '').trim();
   // Se guarda en:
   - patient_consent_tokens.consentGiven.ipAddress
   - patient_consents.ipAddress
   - audit_logs.metadata.ipAddress
   ```

2. **Frontend (`patientConsentService.ts`):**
   ```typescript
   // Algunos lugares tienen placeholder:
   ipAddress: 'client-side', // TODO: Get from backend in production
   ipAddress: 'manual-authorization',
   ```

**Privacy Policy dice:**
> "Technical and security data: basic device/browser information, **IP address**, logs and event metadata used for security, troubleshooting, and auditability."

**Confirmación:** ✅ Correcto - Se guarda IP en:
- Consent verification (backend)
- Audit logs (backend)
- Consent records (backend)

**Nota:** Algunos lugares en frontend tienen placeholders que deberían obtener IP del backend.

---

## Resumen de acciones requeridas

### Crítico (antes de publicar)

1. **Whisper opt-in:**
   - ⚠️ **PROBLEMA:** Privacy Policy dice "opt in" pero no hay opt-in real
   - **Acción:** Cambiar Privacy Policy (Opción A) o implementar opt-in (Opción B)

### No crítico (mejoras)

2. **IP logging en frontend:**
   - Algunos lugares tienen `'client-side'` como placeholder
   - Deberían obtener IP del backend cuando sea posible
   - No afecta la Privacy Policy (ya menciona que se guarda IP)

---

## Recomendación CTO

**Para publicar ahora (pilot-safe):**

1. ✅ Cambiar Privacy Policy wording de Whisper:
   - De: "If clinicians **opt in** to audio transcription..."
   - A: "Audio transcription features may be processed by a third-party provider outside Canada (e.g., the United States) when clinicians use the recording feature."

2. ✅ Dirección: OK (Niagara Hub)

3. ✅ IP logging: OK (se guarda correctamente en backend)

**Para implementar después (mejora):**

- Implementar opt-in real para Whisper/OpenAI
- Obtener IP del backend en todos los lugares (no usar 'client-side')
