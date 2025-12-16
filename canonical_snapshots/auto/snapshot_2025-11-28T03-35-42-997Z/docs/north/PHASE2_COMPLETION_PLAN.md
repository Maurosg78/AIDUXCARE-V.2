# 🎯 PLAN DE COMPLETACIÓN FASE 2
## Correcciones Críticas Identificadas en Auditoría

**Fecha:** Noviembre 2025  
**Autorización:** ✅ APROBADA  
**Prioridad:** 🔴 CRÍTICA - Requerido para Pilot Readiness

---

## 📋 RESUMEN EJECUTIVO

Basado en los cuestionarios de auditoría completados, se identificaron **5 correcciones críticas** que deben implementarse antes del piloto:

1. ✅ **Bloqueo de grabación sin consentimiento** (PHIPA compliance)
2. ✅ **Corrección de región Functions** (Data residency)
3. ✅ **Política de NO uso de PHI** (Legal compliance)
4. ✅ **Campos adicionales de consentimiento** (Audit trail)
5. ✅ **Verificación de regiones** (Documentación)

---

## 🔴 TAREA 1: BLOQUEO DE GRABACIÓN SIN CONSENTIMIENTO

### **Estado:** 🔴 CRÍTICO - Requerido para PHIPA compliance

### **Problema Identificado:**
- El código bloquea generación de SOAP sin consentimiento ✅
- **NO bloquea grabación de audio** sin consentimiento ❌
- Riesgo de compliance: Audio puede ser grabado sin consentimiento explícito

### **Archivo a Modificar:**
- `src/components/RealTimeAudioCapture.tsx`
- `src/services/AudioCaptureServiceReal.ts`

### **Implementación:**

**1. Modificar `RealTimeAudioCapture.tsx`:**

```typescript
// Agregar import
import { PatientConsentService } from '../services/patientConsentService';

// Modificar handleStartCapture (línea ~99)
const handleStartCapture = async () => {
  if (!audioCaptureRef.current) return;

  // ✅ AGREGAR: Verificar consentimiento antes de grabar
  const patientId = currentPatient?.id; // Obtener de props/context
  if (patientId) {
    try {
      const hasConsent = await PatientConsentService.hasConsent(patientId);
      if (!hasConsent) {
        setErrorMessage('Patient consent is required before recording audio. Please obtain consent first.');
        setCaptureStatus('error');
        return; // Bloquear grabación
      }
    } catch (error) {
      console.error('[AUDIO CAPTURE] Error checking consent:', error);
      setErrorMessage('Unable to verify patient consent. Recording blocked for safety.');
      setCaptureStatus('error');
      return;
    }
  }

  // Continuar con grabación si consentimiento verificado
  try {
    setErrorMessage('');
    setTranscriptionSegments([]);
    setSessionStats(null);
    
    const session = await audioCaptureRef.current.startCapture();
    setCurrentSession(session);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    setErrorMessage(errorMsg);
    setCaptureStatus('error');
  }
};
```

**2. Agregar prop para patientId:**

```typescript
interface RealTimeAudioCaptureProps {
  onCaptureComplete?: (segments: TranscriptionSegment[]) => void;
  onTranscriptionUpdate?: (segment: TranscriptionSegment) => void;
  language?: 'es' | 'en';
  className?: string;
  patientId?: string; // ✅ NUEVO: Para verificación de consentimiento
}
```

### **Criterios de Aceptación:**
- ✅ Grabación bloqueada si NO hay consentimiento
- ✅ Mensaje de error claro y profesional
- ✅ Logging de intentos de grabación sin consentimiento
- ✅ Test unitario que valida bloqueo

### **ETA:** 2 horas

---

## 🔴 TAREA 2: CORRECCIÓN DE REGIÓN FUNCTIONS

### **Estado:** 🔴 CRÍTICO - Requerido para PHIPA data residency

### **Problema Identificado:**
- `functions/index.js` línea 5: `LOCATION = 'us-central1'` ❌
- Debe ser: `LOCATION = 'northamerica-northeast1'` ✅

### **Archivo a Modificar:**
- `functions/index.js`

### **Implementación:**

```javascript
// Línea 5 - CAMBIAR:
const LOCATION = 'northamerica-northeast1'; // ✅ Canadá (Montreal)

// Verificar que todas las funciones usen esta región:
exports.processWithVertexAI = functions.region(LOCATION).https.onCall(...);
exports.sendConsentSMS = functions.region(LOCATION).https.onRequest(...);
exports.receiveSMS = functions.region(LOCATION).https.onRequest(...);
exports.vertexAIProxy = functions.region(LOCATION).https.onRequest(...);
```

### **Verificación Post-Deploy:**
1. Acceder a Firebase Console → Functions
2. Verificar que cada función muestra región: `northamerica-northeast1`
3. Screenshot de verificación requerido

### **Criterios de Aceptación:**
- ✅ Todas las funciones en región Canadá
- ✅ Redeploy exitoso sin errores
- ✅ Screenshot de verificación en Console

### **ETA:** 1 hora (incluye redeploy y verificación)

---

## 🔴 TAREA 3: POLÍTICA DE NO USO DE PHI PARA TRAINING

### **Estado:** 🔴 CRÍTICO - Requerido para legal compliance

### **Problema Identificado:**
- No existe documento explícito de política
- Requerido antes del piloto

### **Archivo a Crear:**
- `docs/compliance/NO_PHI_TRAINING_POLICY.md`

### **Contenido del Documento:**

```markdown
# POLÍTICA: NO USO DE PHI PARA ENTRENAMIENTO

**Fecha:** Noviembre 2025  
**Versión:** 1.0  
**Aplicable a:** AiduxCare V.2

## DECLARACIÓN DE POLÍTICA

AiduxCare **NO utiliza, procesa, almacena ni transmite Personal Health Information (PHI) para:**

1. **Entrenamiento de modelos de IA**
2. **Desarrollo de productos**
3. **Análisis comerciales agregados**
4. **Cualquier fin no autorizado explícitamente por el custodio de datos (fisioterapeuta)**

## IMPLEMENTACIÓN TÉCNICA

### Pseudonymización
- Todos los datos de analytics son pseudonymizados antes de almacenamiento
- User IDs y Session IDs son hasheados (SHA-256)
- K-anonymity aplicado (mínimo 5 eventos para agregación)

### Validación
- `analyticsValidationService.ts` valida que queries no contengan PHI
- `pseudonymizationService.ts` aplica hashing antes de analytics

### Almacenamiento
- PHI almacenado en Firestore (control del fisioterapeuta)
- Analytics almacenados sin PHI identificable
- Logs no contienen PHI raw

## CUMPLIMIENTO REGULATORIO

- **PHIPA:** Datos solo para fines autorizados
- **PIPEDA:** Uso limitado a propósito declarado
- **CPO:** Cumplimiento con estándares profesionales

## AUDITORÍA

Esta política es verificable mediante:
- Revisión de código fuente
- Auditoría de queries de analytics
- Verificación de pseudonymización

## CONTACTO

Para preguntas sobre esta política: [Contacto]
```

### **Actualizar Términos de Servicio:**

Agregar sección en `docs/legal/TERMS_OF_SERVICE.md`:

```markdown
## 5. DATA USAGE POLICY

AiduxCare does NOT use Personal Health Information (PHI) for:
- AI model training
- Product development
- Commercial analytics
- Any purpose not explicitly authorized by the data custodian (physiotherapist)

All analytics data is pseudonymized and aggregated according to K-anonymity principles.
```

### **Criterios de Aceptación:**
- ✅ Documento creado y aprobado
- ✅ Referenciado en términos de servicio
- ✅ Incluido en privacy policy
- ✅ Disponible para auditores

### **ETA:** 2 horas

---

## 🟡 TAREA 4: CAMPOS ADICIONALES DE CONSENTIMIENTO

### **Estado:** 🟡 IMPORTANTE - Mejora audit trail

### **Problema Identificado:**
- Consentimiento no captura `idioma usado`
- Consentimiento no captura `método de obtención`

### **Archivo a Modificar:**
- `src/services/patientConsentService.ts`

### **Implementación:**

**1. Actualizar interfaz `PatientConsent`:**

```typescript
export interface PatientConsent {
  patientId: string;
  patientName: string;
  clinicName: string;
  physiotherapistId: string;
  physiotherapistName: string;
  consentScope: 'ongoing' | 'session-only' | 'declined';
  consented: boolean;
  consentDate: Date;
  consentVersion: string;
  tokenUsed: string;
  digitalSignature?: string;
  ipAddress?: string;
  userAgent?: string;
  // ✅ NUEVOS CAMPOS:
  languageUsed?: string; // 'en' | 'fr' | 'es'
  obtainmentMethod?: 'SMS' | 'Portal' | 'Email' | 'Manual';
}
```

**2. Actualizar `recordConsent`:**

```typescript
static async recordConsent(
  token: string,
  scope: 'ongoing' | 'session-only' | 'declined',
  digitalSignature?: string,
  languageUsed?: string, // ✅ NUEVO
  obtainmentMethod?: 'SMS' | 'Portal' | 'Email' | 'Manual' // ✅ NUEVO
): Promise<void> {
  // ... código existente ...
  
  const consentRecord: any = {
    // ... campos existentes ...
    languageUsed: languageUsed || 'en', // ✅ NUEVO
    obtainmentMethod: obtainmentMethod || 'Portal', // ✅ NUEVO
  };
  
  // ... resto del código ...
}
```

**3. Actualizar UI para capturar estos campos:**

- `src/pages/PatientConsentPortalPage.tsx` - Capturar idioma
- `src/services/smsService.ts` - Marcar método como 'SMS' cuando se envía

### **Criterios de Aceptación:**
- ✅ Campos agregados a interfaz
- ✅ Campos guardados en Firestore
- ✅ UI captura estos valores
- ✅ Screenshot de Firestore mostrando campos

### **ETA:** 3 horas

---

## 🟡 TAREA 5: VERIFICACIÓN DE REGIONES

### **Estado:** 🟡 IMPORTANTE - Documentación requerida

### **Problema Identificado:**
- Regiones no verificadas en Firebase Console
- Requiere documentación con screenshots

### **Acción Requerida:**

**1. Verificar en Firebase Console:**

- Firestore Database → Settings → Database location
- Firebase Storage → Settings → Bucket location
- Firebase Functions → Cada función → Region

**2. Documentar resultados:**

Crear `docs/compliance/DATA_RESIDENCY_VERIFIED.md`:

```markdown
# DATA RESIDENCY VERIFICATION

**Fecha de Verificación:** [Fecha]
**Verificado por:** [Nombre]

## REGIONES VERIFICADAS

### Firestore Database
- **Región:** `northamerica-northeast1` ✅
- **Screenshot:** [Adjuntar]
- **Fecha:** [Fecha]

### Firebase Storage
- **Región:** `northamerica-northeast1` ✅
- **Screenshot:** [Adjuntar]
- **Fecha:** [Fecha]

### Firebase Functions
- **processWithVertexAI:** `northamerica-northeast1` ✅
- **sendConsentSMS:** `northamerica-northeast1` ✅
- **vertexAIProxy:** `northamerica-northeast1` ✅
- **Screenshot:** [Adjuntar]
- **Fecha:** [Fecha]

## PROCESAMIENTO EXTERNO

### OpenAI Whisper
- **Región:** EE.UU. (requiere consentimiento explícito)
- **Consentimiento:** ✅ Implementado (`CrossBorderAIConsentService`)
- **CLOUD Act:** ✅ Disclosure implementado

### Vertex AI
- **Región:** [Verificar - puede ser EE.UU. o Canadá]
- **Consentimiento:** ✅ Requerido si fuera de Canadá
```

### **Criterios de Aceptación:**
- ✅ Screenshots de todas las regiones
- ✅ Documento de verificación creado
- ✅ Todas las regiones en Canadá (o consentimiento documentado)

### **ETA:** 1 hora

---

## 📊 RESUMEN DE TAREAS

| Tarea | Prioridad | Estado | ETA | Bloqueador |
|-------|-----------|--------|-----|------------|
| Bloqueo grabación sin consentimiento | 🔴 CRÍTICO | ⏳ Pendiente | 2h | PHIPA compliance |
| Corrección región Functions | 🔴 CRÍTICO | ⏳ Pendiente | 1h | Data residency |
| Política NO uso PHI | 🔴 CRÍTICO | ⏳ Pendiente | 2h | Legal compliance |
| Campos consentimiento | 🟡 IMPORTANTE | ⏳ Pendiente | 3h | Audit trail |
| Verificación regiones | 🟡 IMPORTANTE | ⏳ Pendiente | 1h | Documentación |

**Total estimado:** 9 horas

---

## 🎯 CRITERIOS DE COMPLETACIÓN FASE 2

### **Tareas Críticas (P1):**
- ✅ Bloqueo de grabación implementado y testeado
- ✅ Región Functions corregida y verificada
- ✅ Política de NO uso de PHI documentada

### **Tareas Importantes (P2):**
- ✅ Campos adicionales de consentimiento implementados
- ✅ Regiones verificadas y documentadas

### **Validación Final:**
- ✅ Todos los tests pasando
- ✅ Screenshots de verificación adjuntados
- ✅ Documentación actualizada
- ✅ CTO approval obtenido

---

## 🚀 PRÓXIMOS PASOS

1. **Implementar Tarea 1** (Bloqueo grabación)
2. **Implementar Tarea 2** (Región Functions)
3. **Implementar Tarea 3** (Política PHI)
4. **Implementar Tarea 4** (Campos consentimiento)
5. **Completar Tarea 5** (Verificación regiones)
6. **Testing completo**
7. **Documentación final**
8. **CTO approval**

---

**Status:** 🚀 **AUTORIZADO PARA COMPLETAR**  
**Fecha de inicio:** Noviembre 2025  
**Fecha estimada de finalización:** [Fecha + 9 horas]

