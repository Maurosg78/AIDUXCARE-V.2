# AiduxCare Legal Delivery Framework
**Marco Legal de Entrega - Compliance y Protección Empresarial**

**Versión:** 1.0  
**Fecha:** Noviembre 2025  
**Estado:** 🔒 CRÍTICO - Requerido antes de deployment  
**Autor:** CTO - Mauricio Sobarzo  
**Revisión Legal:** Pendiente

---

## ⚠️ DECLARACIÓN DE CRITICIDAD

Este documento es **OBLIGATORIO** antes de cualquier deployment a producción o pilot con usuarios reales. No proceder con deployment sin completar y revisar este framework.

---

## 📋 1. COMPLIANCE CHECKLIST COMPLETO

### 1.1 PHIPA (Personal Health Information Protection Act, 2004 - Ontario)

#### Status de Compliance

- [ ] **PHIPA Agent Status Confirmation**
  - [ ] Confirmación de que AiduxCare actúa como "Agent" bajo PHIPA
  - [ ] Contratos de agencia firmados con profesionales de la salud
  - [ ] Documentación de relación agente-custodio
  - [ ] **Evidencia requerida:** Contratos de servicio, términos de uso

- [ ] **Custodian Requirements**
  - [ ] Identificación de custodios (fisioterapeutas registrados)
  - [ ] Verificación de registro profesional (CPO)
  - [ ] Contratos de custodia documentados
  - [ ] **Evidencia requerida:** Licencias profesionales, contratos

- [ ] **Consent Requirements**
  - [ ] Consentimiento explícito del paciente para uso de PHI
  - [ ] Consentimiento informado para procesamiento AI
  - [ ] Documentación de consentimiento en sistema
  - [ ] **Evidencia requerida:** Formularios de consentimiento, logs de aceptación

- [ ] **Security Safeguards**
  - [ ] Encriptación en tránsito (TLS 1.3+)
  - [ ] Encriptación en reposo (AES-256)
  - [ ] Control de acceso basado en roles (RBAC)
  - [ ] Audit logs completos
  - [ ] **Evidencia requerida:** Certificados de seguridad, documentación técnica

- [ ] **Data Retention & Disposal**
  - [ ] Política de retención documentada
  - [ ] Proceso de eliminación segura
  - [ ] Cumplimiento de períodos de retención legales
  - [ ] **Evidencia requerida:** Política de retención, procedimientos

#### PHIPA Compliance Checklist

| Requisito | Status | Evidencia | Fecha Verificación |
|-----------|--------|-----------|-------------------|
| Agent Status Confirmado | ☐ | Contratos | ___ |
| Custodian Verification | ☐ | Licencias CPO | ___ |
| Consent Explicito | ☐ | Formularios | ___ |
| Security Safeguards | ☐ | Certificados | ___ |
| Retention Policy | ☐ | Documento | ___ |
| Breach Response Plan | ☐ | Procedimiento | ___ |

---

### 1.2 PIPEDA (Personal Information Protection and Electronic Documents Act - Federal)

#### Status de Compliance

- [ ] **PIPEDA Data Processing Compliance**
  - [ ] Identificación de propósito de recolección
  - [ ] Limitación de recolección (solo necesario)
  - [ ] Limitación de uso (solo propósito declarado)
  - [ ] Precisión de datos
  - [ ] Limitación de retención
  - [ ] Seguridad de datos
  - [ ] Transparencia (política de privacidad)
  - [ ] Acceso individual a datos
  - [ ] **Evidencia requerida:** Política de privacidad, procedimientos

- [ ] **Cross-Border Data Transfer**
  - [ ] Identificación de jurisdicciones de procesamiento
  - [ ] Evaluación de adecuación de protección
  - [ ] Contratos con procesadores (cláusulas PIPEDA)
  - [ ] **Evidencia requerida:** Contratos de procesamiento, evaluaciones

- [ ] **Third-Party Processors**
  - [ ] Lista de procesadores terceros (Firebase, Vertex AI, etc.)
  - [ ] Contratos de procesamiento de datos
  - [ ] Evaluación de compliance de terceros
  - [ ] **Evidencia requerida:** DPAs, evaluaciones de terceros

#### PIPEDA Compliance Checklist

| Principio | Status | Evidencia | Fecha Verificación |
|-----------|--------|-----------|-------------------|
| Purpose Identification | ☐ | Política Privacidad | ___ |
| Limitation of Collection | ☐ | Documentación | ___ |
| Security Safeguards | ☐ | Certificados | ___ |
| Individual Access | ☐ | Procedimientos | ___ |
| Third-Party Compliance | ☐ | DPAs | ___ |
| Cross-Border Transfer | ☐ | Contratos | ___ |

---

### 1.3 CPO (College of Physiotherapists of Ontario) Documentation Standards

#### Status de Compliance

- [ ] **CPO Documentation Standards Adherence**
  - [ ] Cumplimiento de estándares de documentación CPO
  - [ ] Formato SOAP conforme a estándares profesionales
  - [ ] Trazabilidad de decisiones clínicas
  - [ ] **Evidencia requerida:** Revisión de estándares CPO, validación de formato

- [ ] **Professional Liability**
  - [ ] Clarificación de responsabilidad clínica (fisioterapeuta)
  - [ ] Disclaimer de no-diagnóstico
  - [ ] Documentación de asistencia AI (no reemplazo)
  - [ ] **Evidencia requerida:** Términos de servicio, disclaimers

- [ ] **Record Keeping Requirements**
  - [ ] Retención mínima de 10 años (Ontario)
  - [ ] Accesibilidad de registros
  - [ ] Integridad de registros (inmutabilidad de notas finalizadas)
  - [ ] **Evidencia requerida:** Política de retención, procedimientos

#### CPO Compliance Checklist

| Requisito | Status | Evidencia | Fecha Verificación |
|-----------|--------|-----------|-------------------|
| Documentation Standards | ☐ | Validación formato | ___ |
| Professional Liability | ☐ | Términos servicio | ___ |
| Record Retention (10 años) | ☐ | Política | ___ |
| Record Integrity | ☐ | Procedimientos | ___ |
| Clinical Responsibility | ☐ | Disclaimers | ___ |

---

### 1.4 Health Canada Medical Device Exemption Validation

#### Status de Compliance

- [ ] **Medical Device Classification**
  - [ ] Confirmación de que AiduxCare NO es dispositivo médico
  - [ ] Clarificación: Software de documentación asistida
  - [ ] No diagnóstico, no tratamiento, no prescripción
  - [ ] **Evidencia requerida:** Análisis de clasificación, documentación

- [ ] **Exemption Validation**
  - [ ] Software de documentación clínica (exento)
  - [ ] No afecta directamente diagnóstico/treatment
  - [ ] Asistencia a profesional, no reemplazo
  - [ ] **Evidencia requerida:** Análisis regulatorio, documentación

#### Health Canada Compliance Checklist

| Requisito | Status | Evidencia | Fecha Verificación |
|-----------|--------|-----------|-------------------|
| Classification Analysis | ☐ | Documento análisis | ___ |
| Exemption Validation | ☐ | Justificación | ___ |
| No Medical Device Status | ☐ | Documentación | ___ |
| Regulatory Review | ☐ | Consulta legal | ___ |

---

### 1.5 Ontario Bill 194 (Public Sector Privacy)

#### Status de Compliance

- [ ] **Public Sector Considerations**
  - [ ] Identificación si clientes incluyen sector público
  - [ ] Requisitos adicionales para sector público
  - [ ] Contratos específicos si aplica
  - [ ] **Evidencia requerida:** Análisis de clientes, contratos

- [ ] **Municipal/Provincial Health Units**
  - [ ] Evaluación de requisitos adicionales
  - [ ] Compliance con FIPPA (Freedom of Information and Protection of Privacy Act)
  - [ ] **Evidencia requerida:** Análisis, consulta legal

#### Bill 194 Compliance Checklist

| Requisito | Status | Evidencia | Fecha Verificación |
|-----------|--------|-----------|-------------------|
| Public Sector Analysis | ☐ | Evaluación | ___ |
| FIPPA Compliance (si aplica) | ☐ | Documentación | ___ |
| Contract Requirements | ☐ | Contratos | ___ |

---

## 📊 2. DATA CLASSIFICATION MATRIX

### 2.1 Tabla Específica de Datos - Cada Field Capturado

Esta sección detalla **cada campo específico** que AiduxCare captura, clasifica su nivel de protección, y define permisos exactos.

---

#### 2.1.1 Collection: `sessions` (Firestore)

**Propósito:** Almacenar sesiones clínicas completas con transcript, SOAP notes, y tests físicos.

| Field | Tipo | Nivel | Captura | Almacenamiento | Analytics | Retención | Razón Legal |
|-------|------|-------|---------|----------------|-----------|-----------|-------------|
| `userId` | `string` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Hash | 10+ años | PHIPA: Identificar custodio |
| `patientId` | `string` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Identificador paciente |
| `patientName` | `string` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: PHI directo |
| `transcript` | `string` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Contenido clínico |
| `soapNote.subjective` | `string` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Nota clínica SOAP |
| `soapNote.objective` | `string` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Nota clínica SOAP |
| `soapNote.assessment` | `string` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Nota clínica SOAP |
| `soapNote.plan` | `string` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Nota clínica SOAP |
| `soapNote.additionalNotes` | `string?` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Nota clínica SOAP |
| `soapNote.followUp` | `string?` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Nota clínica SOAP |
| `soapNote.precautions` | `string?` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Nota clínica SOAP |
| `soapNote.referrals` | `string?` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Nota clínica SOAP |
| `physicalTests[].id` | `string` | Nivel 2 | ✅ | ✅ Encriptado | ✅ Hash test ID | 10+ años | CPO: Referencia test MSK |
| `physicalTests[].testId` | `string?` | Nivel 2 | ✅ | ✅ Encriptado | ✅ Hash test ID | 10+ años | CPO: Referencia test MSK library |
| `physicalTests[].name` | `string` | Nivel 2 | ✅ | ✅ Encriptado | ✅ Hash test name | 10+ años | CPO: Nombre test MSK |
| `physicalTests[].region` | `string \| null` | Nivel 2 | ✅ | ✅ Encriptado | ✅ Agregado | 10+ años | CPO: Región anatómica |
| `physicalTests[].source` | `enum` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | 10+ años | Técnico: ai/manual/custom |
| `physicalTests[].description` | `string?` | Nivel 2 | ✅ | ✅ Encriptado | ✅ Hash description | 10+ años | CPO: Descripción test |
| `physicalTests[].result` | `enum` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Resultado clínico |
| `physicalTests[].notes` | `string` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Notas clínicas |
| `physicalTests[].values` | `Record<string, number \| string \| boolean \| null>` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Medidas clínicas (ROM, fuerza, etc.) |
| `physicalTests[].values.*.angle_left` | `number?` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Medida ROM izquierda (grados) |
| `physicalTests[].values.*.angle_right` | `number?` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Medida ROM derecha (grados) |
| `physicalTests[].values.*.strength` | `number?` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Medida fuerza (kg) |
| `physicalTests[].values.*.pain_score` | `number?` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Escala dolor 0-10 |
| `physicalTests[].values.*.yes_no` | `boolean?` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Respuesta binaria |
| `physicalTests[].values.*.text` | `string?` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Texto libre clínico |
| `physicalTests[]._prefillDefaults` | `Record<string, number \| null>` (Internal) | Nivel 3 | ✅ Interno | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | Técnico: Valores pre-fill internos |
| `transcriptionMeta.lang` | `string?` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | 90 días | Técnico: Idioma detectado |
| `transcriptionMeta.languagePreference` | `string` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | 90 días | Técnico: Preferencia usuario |
| `transcriptionMeta.mode` | `enum` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | 90 días | Técnico: Modo (live/dictation) |
| `transcriptionMeta.averageLogProb` | `number?` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | 90 días | Técnico: Calidad transcripción |
| `transcriptionMeta.durationSeconds` | `number?` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | 90 días | Técnico: Duración audio |
| `transcriptionMeta.recordedAt` | `string` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | 90 días | Técnico: Timestamp |
| `status` | `enum` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | 10+ años | Técnico: draft/completed |
| `timestamp` | `Timestamp` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | 10+ años | Técnico: Creación sesión |
| `createdAt` | `Timestamp` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | 10+ años | Técnico: Auditoría |
| `attachments[]` | `array` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Archivos clínicos |

---

#### 2.1.2 Collection: `treatment_plans` (Firestore)

**Propósito:** Almacenar planes de tratamiento para recordatorios en visitas de follow-up.

| Field | Tipo | Nivel | Captura | Almacenamiento | Analytics | Retención | Razón Legal |
|-------|------|-------|---------|----------------|-----------|-----------|-------------|
| `id` | `string` | Nivel 2 | ✅ | ✅ Encriptado | ✅ Hash | 10+ años | CPO: Identificador plan |
| `patientId` | `string` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Identificador paciente |
| `patientName` | `string` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: PHI directo |
| `clinicianId` | `string` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Hash | 10+ años | CPO: Identificar custodio |
| `planText` | `string` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Plan de tratamiento |
| `acceptedAt` | `string` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | 10+ años | CPO: Timestamp aceptación |
| `visitType` | `enum` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | 10+ años | Técnico: initial/follow-up |
| `modalities[]` | `array` | Nivel 2 | ✅ | ✅ Encriptado | ✅ Agregado | 10+ años | CPO: Modalities (TENS, US, etc.) |
| `frequency` | `string?` | Nivel 2 | ✅ | ✅ Encriptado | ✅ Agregado | 10+ años | CPO: Frecuencia tratamiento |
| `duration` | `string?` | Nivel 2 | ✅ | ✅ Encriptado | ✅ Agregado | 10+ años | CPO: Duración tratamiento |
| `goals[]` | `array` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Objetivos clínicos |
| `interventions[]` | `array` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Intervenciones clínicas |
| `nextAppointment` | `string?` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Próxima cita |
| `createdAt` | `Timestamp` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | 10+ años | Técnico: Auditoría |
| `updatedAt` | `Timestamp` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | 10+ años | Técnico: Auditoría |

---

#### 2.1.3 Collection: `clinical_attachments` (Firebase Storage)

**Propósito:** Almacenar archivos adjuntos clínicos (imágenes, PDFs, documentos).

| Field | Tipo | Nivel | Captura | Almacenamiento | Analytics | Retención | Razón Legal |
|-------|------|-------|---------|----------------|-----------|-----------|-------------|
| `id` | `string` | Nivel 2 | ✅ | ✅ Encriptado | ✅ Hash | 10+ años | Técnico: Identificador archivo |
| `name` | `string` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Nombre puede contener PHI |
| `size` | `number` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | 90 días | Técnico: Tamaño archivo |
| `contentType` | `string?` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | 90 días | Técnico: MIME type |
| `storagePath` | `string` | Nivel 2 | ✅ | ✅ Encriptado | ✅ Hash | 10+ años | Técnico: Ruta almacenamiento |
| `downloadURL` | `string` | Nivel 2 | ✅ | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | Técnico: URL temporal |
| `uploadedAt` | `string` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | 90 días | Técnico: Timestamp |
| `file_content` | `blob` | Nivel 1 | ✅ Con consent | ✅ Encriptado | ❌ PROHIBIDO | 10+ años | PHIPA: Contenido archivo |

---

#### 2.1.4 Collection: `analytics_events` (Firestore) - PROPUESTO

**Propósito:** Almacenar eventos de analytics agregados y pseudonymizados.

| Field | Tipo | Nivel | Captura | Almacenamiento | Analytics | Retención | Razón Legal |
|-------|------|-------|---------|----------------|-----------|-----------|-------------|
| `hashed_user_id` | `string` | Nivel 2 | ✅ | ✅ Encriptado | ✅ Permite tracking | Indefinida | Hash irreversible SHA-256 |
| `event_type` | `enum` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | Indefinida | Técnico: Tipo evento |
| `timestamp` | `Timestamp` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | Indefinida | Técnico: Timestamp |
| `metadata.duration_seconds` | `number?` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | Indefinida | Técnico: Duración (sin PHI) |
| `metadata.suggestion_type` | `string?` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | Indefinida | Técnico: Tipo sugerencia |
| `metadata.feature_used` | `string?` | Nivel 3 | ✅ | ✅ Encriptado | ✅ Agregado | Indefinida | Técnico: Feature usada |
| `aggregated_metrics` | `object` | Nivel 2 | ✅ | ✅ Encriptado | ✅ Agregado | Indefinida | Técnico: Métricas agregadas |

---

### 2.2 Pseudonymization Examples - Exact Hash Methods

Esta sección proporciona **métodos exactos de hash** para pseudonymization, listos para implementación (después de revisión legal).

---

#### 2.2.1 Hash de User ID (Fisioterapeuta)

**Propósito:** Pseudonymizar identificador de fisioterapeuta para analytics sin re-identificación.

```typescript
import { createHash } from 'crypto';

/**
 * Pseudonymize user ID for analytics
 * 
 * REQUIREMENTS:
 * - SHA-256 one-way hash
 * - Salt from environment variable (never in code)
 * - No reverse lookup possible
 * - Same user always produces same hash
 * 
 * @param userId - Real user ID (e.g., "user-abc123")
 * @returns Hashed user ID (64-character hex string)
 */
function pseudonymizeUserId(userId: string): string {
  // CRITICAL: Salt must be stored in environment variable, never hardcoded
  const salt = process.env.ANALYTICS_USER_SALT;
  if (!salt) {
    throw new Error('ANALYTICS_USER_SALT environment variable not set');
  }
  
  // CRITICAL: Ensure salt is at least 32 characters
  if (salt.length < 32) {
    throw new Error('ANALYTICS_USER_SALT must be at least 32 characters');
  }
  
  // SHA-256 hash of userId + salt
  const hash = createHash('sha256');
  hash.update(userId);
  hash.update(salt);
  
  return hash.digest('hex'); // Returns 64-character hex string
}

// Example:
// Input:  "user-abc123"
// Output: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
// Note: Output is deterministic (same input = same output) but irreversible
```

**Validación de No Re-identification:**
```typescript
/**
 * Test that hash is irreversible
 * This test should ALWAYS pass
 */
function testIrreversible(): void {
  const userId = 'user-test-123';
  const hashed = pseudonymizeUserId(userId);
  
  // CRITICAL: This should be IMPOSSIBLE
  // Attempting to reverse hash should fail
  const reverseLookup = attemptReverseHash(hashed); // Should return null/undefined
  
  if (reverseLookup === userId) {
    throw new Error('SECURITY VIOLATION: Hash is reversible!');
  }
}
```

---

#### 2.2.2 Hash de Test ID (MSK Test)

**Propósito:** Pseudonymizar identificador de test MSK para analytics agregados.

```typescript
/**
 * Pseudonymize MSK test ID for analytics
 * 
 * REQUIREMENTS:
 * - Same hash method as user ID
 * - Separate salt for test IDs
 * - Allows aggregation by test type without PHI
 * 
 * @param testId - MSK test ID (e.g., "shoulder-neer-impingement")
 * @returns Hashed test ID (64-character hex string)
 */
function pseudonymizeTestId(testId: string): string {
  const salt = process.env.ANALYTICS_TEST_SALT;
  if (!salt || salt.length < 32) {
    throw new Error('ANALYTICS_TEST_SALT must be set and at least 32 characters');
  }
  
  const hash = createHash('sha256');
  hash.update(testId);
  hash.update(salt);
  
  return hash.digest('hex');
}
```

---

#### 2.2.3 Hash de Storage Path (Attachments)

**Propósito:** Pseudonymizar ruta de almacenamiento para analytics sin exponer estructura.

```typescript
/**
 * Pseudonymize storage path for analytics
 * 
 * REQUIREMENTS:
 * - Hash path without user/patient identifiers
 * - Only extract file type and size metadata
 * - No PHI in hashed path
 * 
 * @param storagePath - Full storage path (e.g., "clinical-attachments/user-123/1234567890-uuid-image.jpg")
 * @returns Hashed path (64-character hex string)
 */
function pseudonymizeStoragePath(storagePath: string): string {
  // Extract only file extension and root directory
  const pathParts = storagePath.split('/');
  const rootDir = pathParts[0]; // "clinical-attachments"
  const fileName = pathParts[pathParts.length - 1];
  const fileExt = fileName.split('.').pop() || 'unknown';
  
  // Build anonymized path (no user/patient IDs)
  const anonymizedPath = `${rootDir}/[REDACTED]/[REDACTED].${fileExt}`;
  
  const salt = process.env.ANALYTICS_PATH_SALT;
  if (!salt || salt.length < 32) {
    throw new Error('ANALYTICS_PATH_SALT must be set and at least 32 characters');
  }
  
  const hash = createHash('sha256');
  hash.update(anonymizedPath);
  hash.update(salt);
  
  return hash.digest('hex');
}
```

---

#### 2.2.4 Generación de Salt para Producción

**CRÍTICO:** Los salts deben generarse de forma segura y almacenarse como variables de entorno.

```bash
# Generate secure salt for production (32+ characters)
openssl rand -hex 32

# Example output:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

# Store in environment variable:
export ANALYTICS_USER_SALT="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
export ANALYTICS_TEST_SALT="[different-salt-here]"
export ANALYTICS_PATH_SALT="[different-salt-here]"
```

**Requisitos de Salt:**
- ✅ Mínimo 32 caracteres
- ✅ Único por tipo de dato (user, test, path)
- ✅ Almacenado en variables de entorno
- ✅ Nunca en código fuente
- ✅ Nunca en logs
- ✅ Rotado anualmente o después de breach

---

### 2.3 Retention Periods - Por Cada Tipo Específico de Dato

Esta sección detalla **períodos exactos de retención** para cada tipo de dato específico, basados en requisitos legales (PHIPA, CPO, PIPEDA).

---

#### 2.3.1 Tabla de Retención por Collection y Field

| Collection | Field | Retención Mínima | Retención Máxima | Eliminación | Razón Legal |
|------------|-------|------------------|------------------|-------------|-------------|
| `sessions` | `patientId` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Registro clínico |
| `sessions` | `patientName` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Registro clínico |
| `sessions` | `transcript` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Registro clínico |
| `sessions` | `soapNote.subjective` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Nota SOAP legal |
| `sessions` | `soapNote.objective` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Nota SOAP legal |
| `sessions` | `soapNote.assessment` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Nota SOAP legal |
| `sessions` | `soapNote.plan` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Nota SOAP legal |
| `sessions` | `soapNote.additionalNotes` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Nota SOAP legal |
| `sessions` | `soapNote.followUp` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Nota SOAP legal |
| `sessions` | `soapNote.precautions` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Nota SOAP legal |
| `sessions` | `soapNote.referrals` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Nota SOAP legal |
| `sessions` | `physicalTests[].id` | **10 años** | Indefinida* | Eliminación segura | CPO: Referencia test |
| `sessions` | `physicalTests[].testId` | **10 años** | Indefinida* | Eliminación segura | CPO: Referencia test library |
| `sessions` | `physicalTests[].name` | **10 años** | Indefinida* | Eliminación segura | CPO: Nombre test |
| `sessions` | `physicalTests[].region` | **10 años** | Indefinida* | Eliminación segura | CPO: Región anatómica |
| `sessions` | `physicalTests[].source` | **10 años** | Indefinida* | Eliminación segura | Técnico: Fuente test |
| `sessions` | `physicalTests[].description` | **10 años** | Indefinida* | Eliminación segura | CPO: Descripción test |
| `sessions` | `physicalTests[].result` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Resultado clínico |
| `sessions` | `physicalTests[].notes` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Nota clínica |
| `sessions` | `physicalTests[].values` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Medidas clínicas |
| `sessions` | `physicalTests[].values.*.angle_left` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Medida ROM izquierda |
| `sessions` | `physicalTests[].values.*.angle_right` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Medida ROM derecha |
| `sessions` | `physicalTests[].values.*.strength` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Medida fuerza |
| `sessions` | `physicalTests[].values.*.pain_score` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Escala dolor |
| `sessions` | `physicalTests[].values.*.yes_no` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Respuesta binaria |
| `sessions` | `physicalTests[].values.*.text` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Texto libre |
| `sessions` | `physicalTests[]._prefillDefaults` | **10 años** | Indefinida* | Eliminación segura | Técnico: Valores pre-fill internos |
| `sessions` | `transcriptionMeta.lang` | **90 días** | 1 año | Eliminación automática | Técnico: Metadata no clínico |
| `sessions` | `transcriptionMeta.languagePreference` | **90 días** | 1 año | Eliminación automática | Técnico: Metadata no clínico |
| `sessions` | `transcriptionMeta.mode` | **90 días** | 1 año | Eliminación automática | Técnico: Metadata no clínico |
| `sessions` | `transcriptionMeta.averageLogProb` | **90 días** | 1 año | Eliminación automática | Técnico: Metadata no clínico |
| `sessions` | `transcriptionMeta.durationSeconds` | **90 días** | 1 año | Eliminación automática | Técnico: Metadata no clínico |
| `sessions` | `transcriptionMeta.recordedAt` | **90 días** | 1 año | Eliminación automática | Técnico: Metadata no clínico |
| `sessions` | `status` | **10 años** | Indefinida* | Eliminación segura | CPO: Estado sesión |
| `sessions` | `timestamp` | **10 años** | Indefinida* | Eliminación segura | CPO: Timestamp legal |
| `sessions` | `createdAt` | **10 años** | Indefinida* | Eliminación segura | CPO: Auditoría |
| `sessions` | `attachments[]` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Archivo clínico |
| `treatment_plans` | `patientId` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Plan tratamiento |
| `treatment_plans` | `patientName` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Plan tratamiento |
| `treatment_plans` | `clinicianId` | **10 años** | Indefinida* | Eliminación segura | CPO: Identificar custodio |
| `treatment_plans` | `planText` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Plan tratamiento |
| `treatment_plans` | `acceptedAt` | **10 años** | Indefinida* | Eliminación segura | CPO: Timestamp aceptación |
| `treatment_plans` | `visitType` | **10 años** | Indefinida* | Eliminación segura | Técnico: initial/follow-up |
| `treatment_plans` | `modalities[]` | **10 años** | Indefinida* | Eliminación segura | CPO: Modalities tratamiento |
| `treatment_plans` | `frequency` | **10 años** | Indefinida* | Eliminación segura | CPO: Frecuencia |
| `treatment_plans` | `duration` | **10 años** | Indefinida* | Eliminación segura | CPO: Duración |
| `treatment_plans` | `goals[]` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Objetivos clínicos |
| `treatment_plans` | `interventions[]` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Intervenciones |
| `treatment_plans` | `nextAppointment` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Próxima cita |
| `treatment_plans` | `createdAt` | **10 años** | Indefinida* | Eliminación segura | CPO: Auditoría |
| `treatment_plans` | `updatedAt` | **10 años** | Indefinida* | Eliminación segura | CPO: Auditoría |
| `clinical_attachments` | `file_content` | **10 años** | Indefinida* | Eliminación segura | PHIPA + CPO: Archivo clínico |
| `clinical_attachments` | `name` | **10 años** | Indefinida* | Eliminación segura | PHIPA: Nombre puede contener PHI |
| `clinical_attachments` | `storagePath` | **10 años** | Indefinida* | Eliminación segura | Técnico: Ruta almacenamiento |
| `clinical_attachments` | `downloadURL` | **10 años** | Indefinida* | Eliminación segura | Técnico: URL temporal |
| `clinical_attachments` | `size` | **90 días** | 1 año | Eliminación automática | Técnico: Metadata |
| `clinical_attachments` | `contentType` | **90 días** | 1 año | Eliminación automática | Técnico: Metadata |
| `clinical_attachments` | `uploadedAt` | **90 días** | 1 año | Eliminación automática | Técnico: Metadata |
| `analytics_events` | `hashed_user_id` | **Indefinida** | Indefinida | No requiere eliminación | Pseudonymized: Sin PHI |
| `analytics_events` | `event_type` | **Indefinida** | Indefinida | No requiere eliminación | Técnico: Tipo evento |
| `analytics_events` | `timestamp` | **Indefinida** | Indefinida | No requiere eliminación | Técnico: Timestamp |
| `analytics_events` | `metadata.*` | **Indefinida** | Indefinida | No requiere eliminación | Técnico: Metadata agregado |
| `analytics_events` | `aggregated_metrics` | **Indefinida** | Indefinida | No requiere eliminación | Agregado: Sin PHI |

\* **Nota:** Retención indefinida requiere justificación clínica y consentimiento del paciente (CPO Standard).

---

#### 2.3.2 Procedimientos de Eliminación

**Eliminación Segura (PHI):**
```typescript
/**
 * Secure deletion of PHI data
 * 
 * REQUIREMENTS:
 * - Overwrite data before deletion
 * - Delete from all backups
 * - Log deletion event
 * - Verify deletion
 * 
 * @param documentId - Firestore document ID
 * @param collection - Firestore collection name
 */
async function secureDeletePHI(documentId: string, collection: string): Promise<void> {
  // 1. Overwrite with null values
  await overwriteDocument(collection, documentId, {
    patientId: null,
    patientName: null,
    transcript: null,
    soapNote: null,
    physicalTests: null,
  });
  
  // 2. Delete document
  await deleteDocument(collection, documentId);
  
  // 3. Delete from backups (if applicable)
  await deleteFromBackups(collection, documentId);
  
  // 4. Log deletion
  await logDeletionEvent({
    documentId,
    collection,
    deletedAt: new Date().toISOString(),
    deletedBy: getCurrentUser(),
  });
  
  // 5. Verify deletion
  const exists = await documentExists(collection, documentId);
  if (exists) {
    throw new Error('Failed to securely delete document');
  }
}
```

**Eliminación Automática (Metadata Técnico):**
```typescript
/**
 * Automatic deletion of technical metadata after retention period
 * 
 * REQUIREMENTS:
 * - Run daily via scheduled job
 * - Delete metadata older than retention period
 * - Log deletion events
 * 
 * @param collection - Firestore collection name
 * @param retentionDays - Number of days to retain
 */
async function autoDeleteMetadata(collection: string, retentionDays: number): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const query = query(
    collection(db, collection),
    where('timestamp', '<', cutoffDate)
  );
  
  const snapshot = await getDocs(query);
  
  for (const doc of snapshot.docs) {
    await deleteDoc(doc.ref);
    await logDeletionEvent({
      documentId: doc.id,
      collection,
      deletedAt: new Date().toISOString(),
      reason: 'Automatic deletion after retention period',
    });
  }
}
```

---

### 2.4 Analytics Queries Permitidas - Ejemplos Concretos

Esta sección proporciona **ejemplos concretos de queries permitidas** para analytics, sin PHI y con agregación apropiada.

---

#### 2.4.1 Queries Agregadas Permitidas

**Query 1: Tiempo Promedio de Documentación (Agregado por Mes)**

```typescript
/**
 * PERMITTED: Average time to documentation per month
 * 
 * REQUIREMENTS:
 * - Aggregate data (minimum 5 users per group)
 * - No PHI in results
 * - Hash user IDs
 */
async function getAverageTimeToDocumentation(month: string, year: number): Promise<number> {
  const startDate = new Date(year, monthIndex(month), 1);
  const endDate = new Date(year, monthIndex(month) + 1, 0);
  
  // Query analytics_events (NOT sessions directly)
  const q = query(
    collection(db, 'analytics_events'),
    where('event_type', '==', 'SOAP_FINALIZED'),
    where('timestamp', '>=', startDate),
    where('timestamp', '<=', endDate)
  );
  
  const snapshot = await getDocs(q);
  
  // Aggregate duration (no PHI)
  const durations = snapshot.docs
    .map(doc => doc.data().metadata?.duration_seconds)
    .filter(d => d !== null && d !== undefined);
  
  // CRITICAL: Minimum 5 events for k-anonymity
  if (durations.length < 5) {
    throw new Error('Insufficient data for aggregation (k-anonymity requirement)');
  }
  
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  return avgDuration;
}

// Example result:
// {
//   month: "November",
//   year: 2025,
//   avg_time_seconds: 450.5,
//   total_events: 1250,
//   // NO user IDs, NO patient IDs, NO PHI
// }
```

**Query 2: Tasa de Aceptación de Sugerencias (Agregado por Tipo)**

```typescript
/**
 * PERMITTED: Acceptance rate of AI suggestions by type
 * 
 * REQUIREMENTS:
 * - Aggregate by suggestion type (not user)
 * - Minimum 10 suggestions per type
 * - No PHI in results
 */
async function getSuggestionAcceptanceRate(suggestionType: string): Promise<number> {
  const q = query(
    collection(db, 'analytics_events'),
    where('event_type', '==', 'SUGGESTION_OFFERED'),
    where('metadata.suggestion_type', '==', suggestionType)
  );
  
  const snapshot = await getDocs(q);
  
  const offered = snapshot.docs.length;
  const accepted = snapshot.docs.filter(doc => {
    const acceptedEvents = doc.data().metadata?.accepted === true;
    return acceptedEvents;
  }).length;
  
  // CRITICAL: Minimum 10 suggestions for aggregation
  if (offered < 10) {
    throw new Error('Insufficient data for aggregation');
  }
  
  const acceptanceRate = (accepted / offered) * 100;
  return acceptanceRate;
}

// Example result:
// {
//   suggestion_type: "MSK_TEST_PROPOSAL",
//   acceptance_rate: 82.5,
//   total_offered: 150,
//   total_accepted: 124,
//   // NO user IDs, NO patient IDs, NO PHI
// }
```

**Query 3: Distribución de Regiones Anatómicas (Agregado Global)**

```typescript
/**
 * PERMITTED: Distribution of MSK test regions (aggregated)
 * 
 * REQUIREMENTS:
 * - Aggregate by region (not user/patient)
 * - Minimum 5 tests per region
 * - No PHI in results
 */
async function getRegionDistribution(startDate: Date, endDate: Date): Promise<Record<string, number>> {
  const q = query(
    collection(db, 'analytics_events'),
    where('event_type', '==', 'TEST_COMPLETED'),
    where('timestamp', '>=', startDate),
    where('timestamp', '<=', endDate)
  );
  
  const snapshot = await getDocs(q);
  
  const regionCounts: Record<string, number> = {};
  
  snapshot.docs.forEach(doc => {
    const region = doc.data().metadata?.test_region; // Hashed test ID, not PHI
    if (region) {
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    }
  });
  
  // CRITICAL: Filter regions with less than 5 tests (k-anonymity)
  const filteredCounts: Record<string, number> = {};
  for (const [region, count] of Object.entries(regionCounts)) {
    if (count >= 5) {
      filteredCounts[region] = count;
    }
  }
  
  return filteredCounts;
}

// Example result:
// {
//   "shoulder": 450,
//   "knee": 380,
//   "lumbar": 320,
//   // NO user IDs, NO patient IDs, NO PHI
//   // Regions with < 5 tests are excluded
// }
```

**Query 4: Uso de Funcionalidades (Agregado por Feature)**

```typescript
/**
 * PERMITTED: Feature usage statistics (aggregated)
 * 
 * REQUIREMENTS:
 * - Aggregate by feature (not user)
 * - No PHI in results
 */
async function getFeatureUsageStats(month: string, year: number): Promise<Record<string, number>> {
  const startDate = new Date(year, monthIndex(month), 1);
  const endDate = new Date(year, monthIndex(month) + 1, 0);
  
  const q = query(
    collection(db, 'analytics_events'),
    where('event_type', '==', 'FEATURE_USED'),
    where('timestamp', '>=', startDate),
    where('timestamp', '<=', endDate)
  );
  
  const snapshot = await getDocs(q);
  
  const featureCounts: Record<string, number> = {};
  
  snapshot.docs.forEach(doc => {
    const feature = doc.data().metadata?.feature_used;
    if (feature) {
      featureCounts[feature] = (featureCounts[feature] || 0) + 1;
    }
  });
  
  return featureCounts;
}

// Example result:
// {
//   "live_transcription": 850,
//   "dictation": 420,
//   "ai_suggestions": 1200,
//   "test_library": 980,
//   // NO user IDs, NO patient IDs, NO PHI
// }
```

---

### 2.5 Prohibited Analytics - Ejemplos Específicos de Qué NO Hacer

Esta sección detalla **ejemplos específicos de queries PROHIBIDAS** que violarían PHIPA/PIPEDA y cómo detectarlas.

---

#### 2.5.1 Queries Prohibidas con Ejemplos

**❌ PROHIBIDO 1: Query Individual por Patient ID**

```typescript
/**
 * PROHIBITED: Query sessions by patient ID for analytics
 * 
 * VIOLATION: PHIPA Section 30 - Use of PHI for non-clinical purposes
 * VIOLATION: PIPEDA Principle 5 - Limiting use and disclosure
 * 
 * ❌ DO NOT DO THIS:
 */
async function PROHIBITED_getPatientSessions(patientId: string): Promise<any[]> {
  // ❌ PROHIBIDO: Direct access to PHI for analytics
  const q = query(
    collection(db, 'sessions'),
    where('patientId', '==', patientId) // ❌ PHI en query
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    patientId: doc.data().patientId, // ❌ PHI en resultado
    patientName: doc.data().patientName, // ❌ PHI en resultado
    transcript: doc.data().transcript, // ❌ PHI en resultado
  }));
}

// ❌ RESULTADO PROHIBIDO:
// [
//   {
//     patientId: "CA-TEST-001", // ❌ PHI
//     patientName: "Sofia Bennett", // ❌ PHI
//     transcript: "Patient reports pain in shoulder...", // ❌ PHI
//   }
// ]
```

**✅ ALTERNATIVA PERMITIDA:**
```typescript
/**
 * PERMITTED: Aggregate statistics without PHI
 */
async function PERMITTED_getAggregateStats(): Promise<any> {
  // ✅ Query analytics_events (already pseudonymized)
  const q = query(collection(db, 'analytics_events'));
  const snapshot = await getDocs(q);
  
  // ✅ Aggregate without PHI
  return {
    total_sessions: snapshot.size,
    avg_duration: calculateAverage(snapshot),
    // NO patient IDs, NO patient names, NO PHI
  };
}
```

---

**❌ PROHIBIDO 2: Query por User ID con PHI**

```typescript
/**
 * PROHIBITED: Query sessions by user ID with PHI included
 * 
 * VIOLATION: PHIPA Section 30 - Use of PHI for non-clinical purposes
 * VIOLATION: PIPEDA Principle 5 - Limiting use and disclosure
 * 
 * ❌ DO NOT DO THIS:
 */
async function PROHIBITED_getUserSessionsWithPHI(userId: string): Promise<any[]> {
  // ❌ PROHIBIDO: PHI en resultados
  const q = query(
    collection(db, 'sessions'),
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    patientId: doc.data().patientId, // ❌ PHI
    patientName: doc.data().patientName, // ❌ PHI
    soapNote: doc.data().soapNote, // ❌ PHI
  }));
}
```

**✅ ALTERNATIVA PERMITIDA:**
```typescript
/**
 * PERMITTED: Query by hashed user ID without PHI
 */
async function PERMITTED_getUserStats(hashedUserId: string): Promise<any> {
  // ✅ Query analytics_events with hashed user ID
  const q = query(
    collection(db, 'analytics_events'),
    where('hashed_user_id', '==', hashedUserId)
  );
  
  const snapshot = await getDocs(q);
  
  // ✅ Aggregate without PHI
  return {
    total_events: snapshot.size,
    features_used: extractFeatures(snapshot),
    // NO patient IDs, NO patient names, NO PHI
  };
}
```

---

**❌ PROHIBIDO 3: Query de Contenido Clínico para Analytics**

```typescript
/**
 * PROHIBITED: Query transcript or SOAP note content for analytics
 * 
 * VIOLATION: PHIPA Section 30 - Use of PHI for non-clinical purposes
 * VIOLATION: PIPEDA Principle 5 - Limiting use and disclosure
 * 
 * ❌ DO NOT DO THIS:
 */
async function PROHIBITED_analyzeTranscripts(): Promise<any> {
  // ❌ PROHIBIDO: Acceso a contenido clínico
  const q = query(collection(db, 'sessions'));
  const snapshot = await getDocs(q);
  
  const transcripts = snapshot.docs.map(doc => doc.data().transcript); // ❌ PHI
  
  // ❌ PROHIBIDO: Análisis de contenido clínico
  const keywords = extractKeywords(transcripts); // ❌ Puede contener PHI
  const sentiment = analyzeSentiment(transcripts); // ❌ Puede contener PHI
  
  return { keywords, sentiment };
}
```

**✅ ALTERNATIVA PERMITIDA:**
```typescript
/**
 * PERMITTED: Analyze metadata only (no content)
 */
async function PERMITTED_analyzeMetadata(): Promise<any> {
  // ✅ Query analytics_events (no content)
  const q = query(
    collection(db, 'analytics_events'),
    where('event_type', '==', 'TRANSCRIPTION_COMPLETED')
  );
  
  const snapshot = await getDocs(q);
  
  // ✅ Analyze metadata only (no PHI)
  return {
    avg_duration: calculateAverage(snapshot.docs.map(d => d.data().metadata?.duration_seconds)),
    language_distribution: calculateDistribution(snapshot.docs.map(d => d.data().metadata?.language)),
    // NO content, NO transcripts, NO PHI
  };
}
```

---

**❌ PROHIBIDO 4: Query de Resultados de Tests Físicos Individuales**

```typescript
/**
 * PROHIBITED: Query individual test results for analytics
 * 
 * VIOLATION: PHIPA Section 30 - Use of PHI for non-clinical purposes
 * VIOLATION: PIPEDA Principle 5 - Limiting use and disclosure
 * 
 * ❌ DO NOT DO THIS:
 */
async function PROHIBITED_getTestResults(): Promise<any[]> {
  // ❌ PROHIBIDO: Resultados individuales con PHI
  const q = query(collection(db, 'sessions'));
  const snapshot = await getDocs(q);
  
  const results = [];
  snapshot.docs.forEach(doc => {
    const tests = doc.data().physicalTests || [];
    tests.forEach(test => {
      results.push({
        patientId: doc.data().patientId, // ❌ PHI
        testName: test.name,
        result: test.result, // ❌ PHI (resultado clínico)
        notes: test.notes, // ❌ PHI
      });
    });
  });
  
  return results;
}
```

**✅ ALTERNATIVA PERMITIDA:**
```typescript
/**
 * PERMITTED: Aggregate test statistics without PHI
 */
async function PERMITTED_getTestStatistics(): Promise<any> {
  // ✅ Query analytics_events (hashed test IDs)
  const q = query(
    collection(db, 'analytics_events'),
    where('event_type', '==', 'TEST_COMPLETED')
  );
  
  const snapshot = await getDocs(q);
  
  // ✅ Aggregate by hashed test ID (no PHI)
  const testCounts: Record<string, number> = {};
  snapshot.docs.forEach(doc => {
    const hashedTestId = doc.data().metadata?.hashed_test_id;
    if (hashedTestId) {
      testCounts[hashedTestId] = (testCounts[hashedTestId] || 0) + 1;
    }
  });
  
  return {
    test_distribution: testCounts,
    total_tests: snapshot.size,
    // NO patient IDs, NO results, NO PHI
  };
}
```

---

**❌ PROHIBIDO 5: Query de Attachments para Analytics**

```typescript
/**
 * PROHIBITED: Query attachment metadata with potential PHI
 * 
 * VIOLATION: PHIPA Section 30 - Use of PHI for non-clinical purposes
 * 
 * ❌ DO NOT DO THIS:
 */
async function PROHIBITED_getAttachments(): Promise<any[]> {
  // ❌ PROHIBIDO: Metadata puede contener PHI
  const q = query(collection(db, 'clinical_attachments'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    name: doc.data().name, // ❌ Puede contener PHI (ej: "Sofia_Bennett_XRay.jpg")
    storagePath: doc.data().storagePath, // ❌ Puede contener user ID
    downloadURL: doc.data().downloadURL, // ❌ Puede exponer estructura
  }));
}
```

**✅ ALTERNATIVA PERMITIDA:**
```typescript
/**
 * PERMITTED: Aggregate attachment statistics without PHI
 */
async function PERMITTED_getAttachmentStats(): Promise<any> {
  // ✅ Query analytics_events (hashed paths)
  const q = query(
    collection(db, 'analytics_events'),
    where('event_type', '==', 'ATTACHMENT_UPLOADED')
  );
  
  const snapshot = await getDocs(q);
  
  // ✅ Aggregate by file type (no PHI)
  const typeCounts: Record<string, number> = {};
  const sizeStats: { total: number; avg: number } = { total: 0, avg: 0 };
  
  snapshot.docs.forEach(doc => {
    const contentType = doc.data().metadata?.content_type;
    const size = doc.data().metadata?.size;
    
    if (contentType) {
      const type = contentType.split('/')[0]; // "image", "application", etc.
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
    
    if (size) {
      sizeStats.total += size;
    }
  });
  
  sizeStats.avg = sizeStats.total / snapshot.size;
  
  return {
    type_distribution: typeCounts,
    size_stats: sizeStats,
    // NO file names, NO storage paths, NO PHI
  };
}
```

---

**❌ PROHIBIDO 6: Query de Valores Específicos de Tests Físicos (ROM, Fuerza, etc.)**

```typescript
/**
 * PROHIBITED: Query specific test values (ROM, strength measurements) for analytics
 * 
 * VIOLATION: PHIPA Section 30 - Use of PHI for non-clinical purposes
 * VIOLATION: PIPEDA Principle 5 - Limiting use and disclosure
 * 
 * ❌ DO NOT DO THIS:
 */
async function PROHIBITED_getTestValues(): Promise<any[]> {
  // ❌ PROHIBIDO: Valores específicos de tests son PHI
  const q = query(collection(db, 'sessions'));
  const snapshot = await getDocs(q);
  
  const results = [];
  snapshot.docs.forEach(doc => {
    const tests = doc.data().physicalTests || [];
    tests.forEach(test => {
      // ❌ PROHIBIDO: Valores específicos son PHI
      if (test.values) {
        results.push({
          patientId: doc.data().patientId, // ❌ PHI
          testName: test.name,
          angleLeft: test.values.angle_left, // ❌ PHI (medida ROM específica)
          angleRight: test.values.angle_right, // ❌ PHI (medida ROM específica)
          strength: test.values.strength, // ❌ PHI (medida fuerza específica)
          painScore: test.values.pain_score, // ❌ PHI (escala dolor específica)
        });
      }
    });
  });
  
  return results;
}
```

**✅ ALTERNATIVA PERMITIDA:**
```typescript
/**
 * PERMITTED: Aggregate test completion statistics without specific values
 */
async function PERMITTED_getTestCompletionStats(): Promise<any> {
  // ✅ Query analytics_events (no specific values)
  const q = query(
    collection(db, 'analytics_events'),
    where('event_type', '==', 'TEST_COMPLETED')
  );
  
  const snapshot = await getDocs(q);
  
  // ✅ Count tests by type (hashed), NO specific values
  const testCounts: Record<string, number> = {};
  snapshot.docs.forEach(doc => {
    const hashedTestId = doc.data().metadata?.hashed_test_id;
    if (hashedTestId) {
      testCounts[hashedTestId] = (testCounts[hashedTestId] || 0) + 1;
    }
  });
  
  return {
    test_completion_counts: testCounts,
    total_tests_completed: snapshot.size,
    // NO specific values, NO ROM measurements, NO strength values, NO PHI
  };
}
```

---

**❌ PROHIBIDO 7: Query de Pre-fill Defaults para Analytics**

```typescript
/**
 * PROHIBITED: Query pre-fill defaults for analytics or machine learning
 * 
 * VIOLATION: PHIPA Section 30 - Use of PHI for non-clinical purposes
 * 
 * ❌ DO NOT DO THIS:
 */
async function PROHIBITED_analyzePrefillDefaults(): Promise<any> {
  // ❌ PROHIBIDO: Pre-fill defaults pueden correlacionarse con valores reales
  const q = query(collection(db, 'sessions'));
  const snapshot = await getDocs(q);
  
  const prefillData = [];
  snapshot.docs.forEach(doc => {
    const tests = doc.data().physicalTests || [];
    tests.forEach(test => {
      if (test._prefillDefaults) {
        prefillData.push({
          testName: test.name,
          prefillValues: test._prefillDefaults, // ❌ Puede correlacionarse con valores reales
          actualValues: test.values, // ❌ PHI
        });
      }
    });
  });
  
  // ❌ PROHIBIDO: Análisis puede exponer patrones clínicos
  return analyzePatterns(prefillData);
}
```

**✅ ALTERNATIVA PERMITIDA:**
```typescript
/**
 * PERMITTED: No analytics on pre-fill defaults (internal field only)
 */
// ✅ Simply do not query this field for analytics
// Pre-fill defaults are internal technical data, not for analytics
```

---

**❌ PROHIBIDO 8: Query de Treatment Plans con PHI para Analytics**

```typescript
/**
 * PROHIBITED: Query treatment plan content with PHI for analytics
 * 
 * VIOLATION: PHIPA Section 30 - Use of PHI for non-clinical purposes
 * VIOLATION: PIPEDA Principle 5 - Limiting use and disclosure
 * 
 * ❌ DO NOT DO THIS:
 */
async function PROHIBITED_analyzeTreatmentPlans(): Promise<any> {
  // ❌ PROHIBIDO: Planes de tratamiento contienen PHI
  const q = query(collection(db, 'treatment_plans'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    patientId: doc.data().patientId, // ❌ PHI
    patientName: doc.data().patientName, // ❌ PHI
    planText: doc.data().planText, // ❌ PHI (plan completo)
    goals: doc.data().goals, // ❌ PHI (objetivos específicos)
    interventions: doc.data().interventions, // ❌ PHI (intervenciones específicas)
    nextAppointment: doc.data().nextAppointment, // ❌ PHI (próxima cita)
  }));
}
```

**✅ ALTERNATIVA PERMITIDA:**
```typescript
/**
 * PERMITTED: Aggregate modality usage without PHI
 */
async function PERMITTED_getModalityUsageStats(): Promise<any> {
  // ✅ Query analytics_events (modalities without PHI)
  const q = query(
    collection(db, 'analytics_events'),
    where('event_type', '==', 'TREATMENT_PLAN_ACCEPTED')
  );
  
  const snapshot = await getDocs(q);
  
  // ✅ Aggregate by modality type (no PHI)
  const modalityCounts: Record<string, number> = {};
  snapshot.docs.forEach(doc => {
    const modalities = doc.data().metadata?.modalities || [];
    modalities.forEach((modality: string) => {
      modalityCounts[modality] = (modalityCounts[modality] || 0) + 1;
    });
  });
  
  return {
    modality_distribution: modalityCounts,
    total_plans: snapshot.size,
    // NO patient IDs, NO plan text, NO goals, NO interventions, NO PHI
  };
}
```

---

#### 2.5.2 Detección de Violaciones

**Código de Validación para Prevenir Violaciones:**

```typescript
/**
 * Validation function to detect prohibited analytics queries
 * 
 * REQUIREMENTS:
 * - Run before every analytics query
 * - Block queries that access PHI
 * - Log attempted violations
 */
function validateAnalyticsQuery(query: any): void {
  const prohibitedFields = [
    // PHI Identifiers
    'patientId',
    'patientName',
    
    // PHI Content
    'transcript',
    'soapNote',
    'soapNote.subjective',
    'soapNote.objective',
    'soapNote.assessment',
    'soapNote.plan',
    'soapNote.additionalNotes',
    'soapNote.followUp',
    'soapNote.precautions',
    'soapNote.referrals',
    
    // PHI Physical Test Results
    'physicalTests.result',
    'physicalTests.notes',
    'physicalTests.values',
    'physicalTests.values.angle_left',
    'physicalTests.values.angle_right',
    'physicalTests.values.strength',
    'physicalTests.values.pain_score',
    'physicalTests.values.yes_no',
    'physicalTests.values.text',
    'physicalTests._prefillDefaults', // Internal field, no analytics
    
    // PHI Treatment Plans
    'treatment_plans.patientId',
    'treatment_plans.patientName',
    'treatment_plans.planText',
    'treatment_plans.goals',
    'treatment_plans.interventions',
    'treatment_plans.nextAppointment',
    
    // PHI Attachments
    'attachments.name',
    'attachments.file_content',
    'attachments.downloadURL',
    
    // Prohibited patterns
    'patient_id',
    'patient_name',
    'soap_content',
    'clinical_findings',
  ];
  
  // Check if query includes prohibited fields
  const queryString = JSON.stringify(query).toLowerCase();
  for (const field of prohibitedFields) {
    const fieldLower = field.toLowerCase();
    if (queryString.includes(fieldLower)) {
      // Log violation attempt
      logViolationAttempt({
        query,
        prohibitedField: field,
        timestamp: new Date().toISOString(),
        user: getCurrentUser(),
      });
      
      throw new Error(
        `PROHIBITED: Cannot query field '${field}' for analytics. ` +
        `This field contains PHI and violates PHIPA/PIPEDA compliance. ` +
        `Use analytics_events collection with hashed identifiers instead.`
      );
    }
  }
  
  // Additional validation: Check if querying sessions collection directly
  if (queryString.includes('collection') && queryString.includes('sessions') && 
      !queryString.includes('analytics_events')) {
    // Only allow queries to sessions if they're filtered to non-PHI fields
    // This is a safety check, but sessions should generally not be queried for analytics
    console.warn(
      'WARNING: Querying sessions collection for analytics. ' +
      'Ensure no PHI fields are included in results.'
    );
  }
}
```

---

### 2.6 Resumen de Clasificación por Nivel

| Nivel | Definición | Ejemplos | Analytics Permitido | Retención |
|-------|------------|----------|---------------------|-----------|
| **Nivel 1: PHI** | Información que identifica paciente y su salud | `patientId`, `patientName`, `transcript`, `soapNote.*`, `physicalTests.result`, `physicalTests.notes`, `physicalTests.values`, `attachments.file_content` | ❌ **PROHIBIDO** | **10+ años** |
| **Nivel 2: Pseudonymized** | Datos con hash irreversible, sin PHI | `hashed_user_id`, `hashed_test_id`, `modalities[]`, `frequency`, `duration` | ✅ **Agregado** (k-anonymity ≥5) | **10+ años** (datos estructurados), **Indefinida** (analytics) |
| **Nivel 3: Técnico** | Metadata técnico sin PHI | `userId`, `timestamp`, `status`, `transcriptionMeta.*`, `contentType`, `size` | ✅ **Agregado** | **90 días** (metadata), **10+ años** (audit logs) |

---

## 🔒 3. TECHNICAL SAFEGUARDS IMPLEMENTATION

### 3.1 Event Tracking Architecture Sin PHI

#### Principios de Diseño

1. **Separation of Concerns**
   - Analytics separado de datos clínicos
   - No PHI en eventos de analytics
   - Agregación antes de almacenamiento

2. **Privacy-by-Design**
   - Anonimización en origen
   - No re-identificación posible
   - Consentimiento explícito para métricas

3. **Minimal Data Collection**
   - Solo métricas necesarias
   - No contenido clínico
   - No identificadores directos

#### Arquitectura Propuesta

```
┌─────────────────┐
│  Application    │
│  (SOAP Editor)  │
└────────┬────────┘
         │
         ├─── PHI Data ────► Firestore (Encriptado)
         │
         └─── Analytics Events (Sin PHI) ────► Analytics Service
                                                    │
                                                    ├─── Hash User ID
                                                    ├─── Aggregate
                                                    └─── Store Metrics
```

#### Eventos Permitidos (Sin PHI)

```typescript
// ✅ PERMITIDO
interface AllowedAnalyticsEvent {
  event_type: 'soap_finalized' | 'suggestion_accepted' | 'time_to_documentation';
  timestamp: string;
  hashed_user_id: string; // Hash irreversible
  metadata: {
    duration_seconds?: number; // Tiempo, no contenido
    suggestion_type?: string; // Tipo, no contenido
    // NO: patient_name, soap_content, clinical_findings
  };
}

// ❌ PROHIBIDO
interface ProhibitedAnalyticsEvent {
  patient_id: string; // ❌
  patient_name: string; // ❌
  soap_content: string; // ❌
  clinical_findings: string; // ❌
  test_results: any; // ❌
}
```

---

### 3.2 Data Aggregation Methods Privacy-Preserving

#### Métodos de Agregación

1. **Temporal Aggregation**
   - Agregar por día/semana/mes
   - Mínimo 5 usuarios por agregado (k-anonymity)
   - No desagregación individual

2. **Statistical Aggregation**
   - Promedios, medianas, percentiles
   - No valores individuales
   - No outliers identificables

3. **Differential Privacy** (Futuro)
   - Ruido estadístico agregado
   - Protección contra re-identificación
   - Implementación futura

#### Ejemplo de Agregación

```typescript
// ✅ Agregación permitida
interface AggregatedMetrics {
  date: string;
  avg_time_to_documentation_minutes: number; // Promedio
  p50_time_to_documentation: number; // Mediana
  p90_time_to_documentation: number; // Percentil
  total_notes_completed: number; // Conteo
  acceptance_rate: number; // Tasa agregada
  // NO valores individuales
}
```

---

### 3.3 Audit Trail Separation

#### Separación de Audit Trails

1. **Clinical Audit Trail** (PHI)
   - Almacenado en Firestore (encriptado)
   - Acceso solo a custodios autorizados
   - Retención: 10+ años
   - **Contenido:** Quién accedió a qué PHI, cuándo, por qué

2. **System Audit Trail** (Sin PHI)
   - Almacenado separadamente
   - Acceso a administradores técnicos
   - Retención: 90 días
   - **Contenido:** Errores técnicos, performance, uso de sistema

3. **Analytics Audit Trail** (Anonimizado)
   - Almacenado en analytics service
   - Acceso a equipo de producto
   - Retención: Indefinida
   - **Contenido:** Métricas agregadas, trends

#### Estructura de Audit Trail

```typescript
interface ClinicalAuditLog {
  timestamp: string;
  user_id: string; // Fisioterapeuta
  action: 'view' | 'edit' | 'finalize' | 'export';
  resource_type: 'soap_note' | 'patient_record';
  resource_id: string; // Hash del ID
  ip_address?: string; // Opcional, con consentimiento
  reason?: string; // Justificación si requerida
}

interface SystemAuditLog {
  timestamp: string;
  event_type: 'error' | 'performance' | 'system_event';
  severity: 'low' | 'medium' | 'high';
  message: string; // Sin PHI
  metadata: Record<string, any>; // Sin PHI
}
```

---

### 3.4 Hash-Based Analytics Sin Re-identification

#### Implementación de Hashing

**Requisitos:**
- Algoritmo: SHA-256
- Salt: Único por deployment, almacenado separadamente
- One-way: No reversible
- Collision-resistant: Mínimo riesgo de colisiones

#### Flujo de Pseudonymization

```
User ID (Real)
    │
    ├─── Hash Function (SHA-256 + Salt)
    │
    └─── Hashed User ID (Irreversible)
            │
            └─── Analytics Events
                    │
                    └─── Aggregation
                            │
                            └─── Stored Metrics (No re-identification)
```

#### Validación de No Re-identification

- [ ] Test: Intentar re-identificar desde hash (debe fallar)
- [ ] Test: Verificar que salt no está en analytics
- [ ] Test: Verificar que no hay lookup tables
- [ ] Test: Verificar agregación mínima (k-anonymity)

---

## ⚠️ 4. RISK MITIGATION & AUDIT READINESS

### 4.1 Potential Compliance Violations y Cómo Evitarlas

#### Violación 1: PHI en Analytics

**Riesgo:** Incluir contenido clínico en eventos de analytics

**Mitigación:**
- ✅ Validación automática de eventos (no PHI)
- ✅ Code review obligatorio para analytics
- ✅ Testing automatizado (unit tests)
- ✅ Separación física de datos (diferentes colecciones)

**Detección:**
- Scans automáticos de logs
- Alertas si se detecta PHI en analytics
- Auditorías trimestrales

---

#### Violación 2: Re-identification de Datos Anonimizados

**Riesgo:** Posibilidad de re-identificar pacientes desde métricas agregadas

**Mitigación:**
- ✅ K-anonymity (mínimo 5 usuarios por agregado)
- ✅ Hash irreversible con salt
- ✅ No valores individuales en métricas
- ✅ Differential privacy (futuro)

**Detección:**
- Tests de re-identification
- Auditorías de agregación
- Revisión de métricas publicadas

---

#### Violación 3: Falta de Consentimiento

**Riesgo:** Procesar PHI sin consentimiento explícito

**Mitigación:**
- ✅ Consentimiento explícito requerido antes de uso
- ✅ Documentación de consentimiento
- ✅ Opción de opt-out de analytics
- ✅ Registro de consentimientos

**Detección:**
- Audit logs de consentimientos
- Verificación de consentimiento antes de procesamiento
- Alertas si falta consentimiento

---

#### Violación 4: Retención Inadecuada

**Riesgo:** Eliminar datos antes de período mínimo o retener indefinidamente sin justificación

**Mitigación:**
- ✅ Política de retención documentada
- ✅ Automatización de retención
- ✅ Excepciones documentadas
- ✅ Revisión anual de políticas

**Detección:**
- Monitoreo de períodos de retención
- Alertas antes de eliminación
- Auditorías de cumplimiento

---

#### Violación 5: Acceso No Autorizado

**Riesgo:** Acceso a PHI por usuarios no autorizados

**Mitigación:**
- ✅ RBAC (Role-Based Access Control)
- ✅ Autenticación multi-factor (MFA)
- ✅ Audit logs de accesos
- ✅ Principio de menor privilegio

**Detección:**
- Monitoreo de accesos
- Alertas de accesos inusuales
- Auditorías de permisos

---

### 4.2 Documentation Requirements para Auditorías

#### Documentación Requerida

1. **Políticas y Procedimientos**
   - [ ] Política de Privacidad
   - [ ] Política de Retención de Datos
   - [ ] Política de Seguridad
   - [ ] Procedimiento de Respuesta a Breaches
   - [ ] Procedimiento de Eliminación de Datos

2. **Contratos y Acuerdos**
   - [ ] Contratos de Servicio (con custodios)
   - [ ] Términos de Uso
   - [ ] Data Processing Agreements (DPAs) con terceros
   - [ ] Contratos de agencia PHIPA

3. **Evidencia Técnica**
   - [ ] Arquitectura de seguridad
   - [ ] Certificados de encriptación
   - [ ] Configuración de RBAC
   - [ ] Procedimientos de backup
   - [ ] Procedimientos de disaster recovery

4. **Registros y Logs**
   - [ ] Audit logs (10+ años)
   - [ ] Registros de consentimiento
   - [ ] Registros de accesos
   - [ ] Registros de cambios en datos

5. **Evaluaciones y Revisión**
   - [ ] Evaluación de impacto de privacidad (PIA)
   - [ ] Evaluación de riesgos de seguridad
   - [ ] Revisión legal periódica
   - [ ] Certificaciones de compliance

---

### 4.3 Incident Response Procedures

#### Procedimiento de Respuesta a Breaches

**Fase 1: Detección (0-1 hora)**
- [ ] Identificar breach
- [ ] Contener breach inmediatamente
- [ ] Documentar incidente
- [ ] Notificar a equipo de seguridad

**Fase 2: Evaluación (1-24 horas)**
- [ ] Evaluar alcance del breach
- [ ] Identificar datos afectados
- [ ] Determinar si es notificable (PHIPA/PIPEDA)
- [ ] Consultar con asesor legal

**Fase 3: Notificación (24-72 horas si requerido)**
- [ ] Notificar a Information and Privacy Commissioner (Ontario) si aplica
- [ ] Notificar a pacientes afectados (si requerido)
- [ ] Notificar a custodios (fisioterapeutas)
- [ ] Documentar todas las notificaciones

**Fase 4: Remediation (Ongoing)**
- [ ] Corregir vulnerabilidad
- [ ] Implementar medidas preventivas
- [ ] Actualizar políticas si necesario
- [ ] Monitoreo continuo

**Fase 5: Post-Incident (1 semana+)**
- [ ] Revisión post-mortem
- [ ] Actualización de procedimientos
- [ ] Training adicional si necesario
- [ ] Documentación completa

#### Checklist de Notificación PHIPA

- [ ] ¿Involucra PHI? → Si SÍ, notificación requerida
- [ ] ¿Riesgo de daño? → Evaluar probabilidad
- [ ] ¿Notificar a Commissioner? → Si riesgo significativo
- [ ] ¿Notificar a pacientes? → Si riesgo de daño
- [ ] ¿Notificar a custodios? → Siempre

---

### 4.4 Legal Review Checklist

#### Pre-Deployment Legal Review

**Documentos a Revisar:**
- [ ] Este documento (Legal Delivery Framework)
- [ ] Política de Privacidad
- [ ] Términos de Servicio
- [ ] Contratos con custodios
- [ ] DPAs con procesadores terceros
- [ ] Política de Retención
- [ ] Procedimiento de Breach Response

**Revisión Técnica:**
- [ ] Arquitectura de seguridad
- [ ] Implementación de encriptación
- [ ] Control de acceso
- [ ] Audit logging
- [ ] Separación de datos

**Revisión de Compliance:**
- [ ] PHIPA compliance
- [ ] PIPEDA compliance
- [ ] CPO standards
- [ ] Health Canada exemption
- [ ] Bill 194 (si aplica)

**Revisión de Riesgos:**
- [ ] Evaluación de riesgos de privacidad
- [ ] Evaluación de riesgos de seguridad
- [ ] Plan de mitigación
- [ ] Procedimientos de respuesta

**Aprobaciones Requeridas:**
- [ ] CTO Approval: ☐
- [ ] Legal Counsel Approval: ☐
- [ ] Privacy Officer Approval: ☐
- [ ] Security Officer Approval: ☐

---

## 📝 5. CERTIFICACIÓN Y APROBACIONES

### 5.1 Compliance Certification

**Certificación de Compliance:**

Yo, [Nombre], en mi capacidad de [Cargo], certifico que:

1. He revisado este Legal Delivery Framework
2. Confirmo que AiduxCare cumple con los requisitos de:
   - PHIPA (Personal Health Information Protection Act)
   - PIPEDA (Personal Information Protection and Electronic Documents Act)
   - CPO Documentation Standards
   - Health Canada Medical Device Exemption
   - Ontario Bill 194 (si aplica)

3. Confirmo que las medidas técnicas y organizacionales descritas en este documento están implementadas o serán implementadas antes del deployment.

4. Entiendo que este documento es crítico para la protección de la empresa y el cumplimiento legal.

**Firma:** _________________  
**Nombre:** _________________  
**Cargo:** _________________  
**Fecha:** _________________

---

### 5.2 Pre-Deployment Checklist Final

**Antes de cualquier deployment a producción o pilot con usuarios reales:**

- [ ] Este documento completado y revisado
- [ ] Todas las secciones de compliance verificadas
- [ ] Políticas y procedimientos documentados
- [ ] Contratos y acuerdos en lugar
- [ ] Medidas técnicas implementadas
- [ ] Legal review completado
- [ ] Aprobaciones obtenidas
- [ ] Training del equipo completado
- [ ] Procedimientos de respuesta a incidentes probados

**NO PROCEDER SIN COMPLETAR TODOS LOS ITEMS ARRIBA.**

---

## 📚 6. REFERENCIAS Y RECURSOS

### 6.1 Legislación Relevante

- **PHIPA:** https://www.ontario.ca/laws/statute/04p03
- **PIPEDA:** https://laws-lois.justice.gc.ca/eng/acts/P-8.6/
- **CPO Standards:** https://www.collegept.org/
- **Health Canada Medical Devices:** https://www.canada.ca/en/health-canada/services/drugs-health-products/medical-devices.html
- **Ontario Bill 194:** https://www.ontario.ca/laws/statute/20b19

### 6.2 Recursos Adicionales

- **Privacy by Design:** https://www.ipc.on.ca/privacy/privacy-by-design/
- **PHIPA Guide:** https://www.ipc.on.ca/wp-content/uploads/2016/09/healthcare-guide.pdf
- **PIPEDA Guide:** https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/

---

## 🔄 7. REVISIÓN Y ACTUALIZACIÓN

Este documento debe ser revisado y actualizado:

- **Anualmente:** Revisión completa
- **Cuando cambie legislación:** Actualización inmediata
- **Después de incidentes:** Revisión y actualización
- **Antes de nuevos deployments:** Verificación de compliance

**Última Revisión:** ___  
**Próxima Revisión Programada:** ___

---

## ⚠️ DECLARACIÓN FINAL

**Este documento es BULLETPROOF para revisión legal externa.**

Todas las medidas descritas están diseñadas para:
- ✅ Proteger la empresa de responsabilidad legal
- ✅ Asegurar compliance total con legislación aplicable
- ✅ Proteger la privacidad de pacientes
- ✅ Mantener la confianza de profesionales de la salud
- ✅ Facilitar auditorías y revisiones regulatorias

**NO DEPLOYAR SIN COMPLETAR Y APROBAR ESTE FRAMEWORK.**

---

**Documento preparado para revisión legal externa si es necesario.**

