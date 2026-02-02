# Resumen ejecutivo — Consentimiento y datos (PHIPA/PIPEDA)

**Objetivo:** Una página de claridad para socios piloto (ej. Niagara): cómo se obtiene el consentimiento, qué se guarda, quién accede, alineado con PHIPA/PIPEDA.

**Referencia completa:** `INFORME_PHIPA_PIPEDA_COMPLIANCE.md` (raíz del proyecto).

---

## 1. Cómo se obtiene el consentimiento

- **Verbal:** El fisioterapeuta obtiene consentimiento verbal del paciente; la app registra que se obtuvo (VerbalConsentService, verbal_consents en Firestore). Incluye validación por jurisdicción (ej. CA-ON).
- **Digital:** El paciente puede aceptar o declinar mediante enlace (PatientConsentPortalPage); la decisión se registra vía Cloud Function (acceptPatientConsentByToken).
- **SMS (opcional):** Confirmación por SMS; el estado se consulta vía ConsentVerificationService.
- **Gate clínico:** Antes de usar el flujo de notas clínicas (workflow/SOAP), la app verifica que exista consentimiento válido (VerbalConsentService.hasValidConsent / checkConsentViaServer). Sin consentimiento válido, no se permite el uso del flujo clínico.

---

## 2. Qué se guarda

- **Notas clínicas (SOAP):** Se guardan en la colección `consultations` con `patientId`, `sessionId`, `soapData`, `visitType`, `source`. Se cifran en reposo (CryptoService: AES-GCM 256-bit, PBKDF2 100.000 iteraciones) y se almacena también una copia cifrada (`encryptedData`) para cumplimiento.
- **Encounters (sesiones clínicas):** En la colección `encounters`; unidad facturable/auditable; incluyen `patientId`, `authorUid`, `encounterDate`, `status` (draft/completed/signed).
- **Consentimientos:** En `verbal_consents` (y vía Cloud Functions para consent digital); incluyen paciente, profesional, timestamp, jurisdicción.
- **Retención:** Datos clínicos retenidos 10+ años (requisito PHIPA). No se permite eliminación desde cliente (reglas Firestore: `allow delete: if false`).

---

## 3. Quién accede

- **Consultations y encounters:** Solo el profesional autor (autorUid) puede leer/escribir sus propios documentos. Reglas Firestore: `resource.data.authorUid == request.auth.uid` (y equivalente en create/update).
- **Perfiles de usuario/profesional:** Usuarios autenticados pueden leer perfiles; cada usuario solo puede crear/actualizar su propio perfil (userId == auth.uid).
- **Auditoría:** Cada documento incluye `authorUid`, `createdAt`, `updatedAt` (y `patientId`, `sessionId` donde aplica) para trazabilidad.

---

## 4. Alineación PHIPA/PIPEDA (resumen)

| Área | Implementación | Normativa |
|------|----------------|-----------|
| Cifrado en reposo | AES-GCM 256-bit, PBKDF2, IV único por documento | PHIPA s.12(1); PIPEDA 4.7 |
| Control de acceso | Firestore: solo authorUid == auth.uid en consultations/encounters | PHIPA s.10(1); PIPEDA 4.7.1 |
| Consentimiento | Verbal + digital + gate antes del flujo clínico | PHIPA/PIPEDA principios de consentimiento |
| Retención | 10+ años, no eliminación desde cliente | PHIPA s.52(1); PIPEDA 4.5.3 |
| Auditoría | authorUid, createdAt, updatedAt en documentos | Trazabilidad clínica |

---

**Uso:** Este resumen puede compartirse con el socio piloto (Niagara) como base para revisar cómo AiDux protege datos y consentimiento antes de firmar. Para detalle técnico y reglas exactas, ver `INFORME_PHIPA_PIPEDA_COMPLIANCE.md`.
