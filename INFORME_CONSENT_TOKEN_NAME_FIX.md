# 📋 INFORME: Evidencia de "Mauricio Sobarzo" Hardcodeado y Flujo de Consent SMS

**Fecha:** 2026-01-12  
**Objetivo:** Identificar dónde se arma el SMS de consentimiento y dónde se guarda/usa el nombre del fisioterapeuta

---

## 🔍 HALLAZGOS PRINCIPALES

### ✅ **1. No hay "Mauricio Sobarzo" hardcodeado en código de producción**

**Evidencia:**
```bash
rg -n "Mauricio Sobarzo" -S functions src
# Resultado: Solo aparece en:
# - canonical_snapshots/ (archivos históricos, no código activo)
# - src/tools/diagnoseUser.ts:58 (herramienta de diagnóstico/test, no producción)
```

**Conclusión:** El nombre "Mauricio Sobarzo" NO está hardcodeado en el flujo de consentimiento activo.

---

### 📍 **2. Dónde se arma el SMS (Template)**

**Archivo:** `src/content/smsTemplates.ts`  
**Líneas:** 16-22

```typescript
return `Hello ${patientName}, ${physioName} requires your consent for health data processing according to Canadian law (PHIPA s.18).

Authorize: ${consentUrl}

Privacy Policy: ${privacyUrl}

Reply STOP to opt out.`;
```

**✅ Estado:** El template está correcto, recibe `physioName` como parámetro dinámico.

---

### 📍 **3. Dónde se envía el SMS (Frontend)**

**Archivo:** `src/services/smsService.ts`  
**Método:** `SMSService.sendConsentLink()`  
**Líneas:** 69-88

```typescript
static async sendConsentLink(
  phone: string,
  patientName: string,
  clinicName: string,
  physiotherapistName: string,  // ← Parámetro dinámico
  consentToken: string
): Promise<void> {
  // ...
  const message = SMS_TEMPLATES.consent.en_CA(
    patientName,
    physiotherapistName,  // ← Se pasa al template
    consentUrl,
    privacyUrl
  );
}
```

**✅ Estado:** Recibe `physiotherapistName` como parámetro dinámico.

---

### 📍 **4. Dónde se llama desde el Workflow (Frontend)**

**Archivo:** `src/pages/ProfessionalWorkflowPage.tsx`  
**Líneas:** 1198-1217

```typescript
// 1. Generar token con nombre actual
const token = await PatientConsentService.generateConsentToken(
  patientId,
  patient.fullName,
  formattedPhone,
  patient.email || undefined,
  clinicName,
  userId,
  clinicianDisplayName  // ← Se obtiene dinámicamente
);

// 2. Enviar SMS con nombre actual
await SMSService.sendConsentLink(
  formattedPhone,
  patient.fullName,
  clinicName,
  clinicianDisplayName,  // ← Mismo nombre (no viene del token)
  token
);
```

**⚠️ Problema identificado:** El nombre viene de `deriveClinicianDisplayName(professionalProfile, user)` en tiempo real, NO del token document guardado en Firestore.

**Archivo:** `src/utils/clinicProfile.ts`  
**Líneas:** 25-54

```typescript
export const deriveClinicianDisplayName = (
  profile?: ProfessionalProfile | null,
  user?: { displayName?: string | null; email?: string | null }
): string => {
  // Fallback chain:
  // 1. preferredSalutation + lastNamePreferred
  // 2. fullName
  // 3. displayName
  // 4. user.displayName
  // 5. email prefix
  // 6. 'Dr. Smith' (fallback final)
  return 'Dr. Smith';  // ← Fallback hardcodeado
};
```

**✅ Estado:** El nombre se obtiene dinámicamente, pero hay un fallback hardcodeado `'Dr. Smith'` si todo falla.

---

### 📍 **5. Dónde se guarda el token (Firestore)**

**Archivo:** `src/services/patientConsentService.ts`  
**Método:** `PatientConsentService.generateConsentToken()`  
**Líneas:** 113-129

```typescript
const tokenData = {
  token,
  patientId,
  patientName,
  patientPhone: patientPhone || null,
  patientEmail: patientEmail || null,
  clinicName,
  physiotherapistId,        // ✅ Se guarda UID
  physiotherapistName,      // ✅ Se guarda nombre (snapshot)
  sessionId: sessionId || null,
  createdAt: serverTimestamp(),
  expiresAt: Timestamp.fromDate(expiresAt),
  used: false,
};

await setDoc(tokenRef, tokenData);
```

**✅ Estado:** El token SÍ guarda `physiotherapistId` y `physiotherapistName` en Firestore.

**⚠️ Problema identificado:** El token document NO tiene campos `requestedByUid` y `requestedByName` como campos separados/dedicados (aunque `physiotherapistId` y `physiotherapistName` cumplen esa función).

---

### 📍 **6. Cloud Function que envía SMS (Backend)**

**Archivo:** `functions/index.js`  
**Función:** `exports.sendSMS`  
**Líneas:** 67-70

```javascript
const { phone, message, clinicName, patientName, consentToken } = req.body || {};
// ...
// Send SMS via Vonage REST API
const payload = new URLSearchParams({
  api_key: VONAGE_API_KEY,
  api_secret: VONAGE_API_SECRET,
  to: cleanPhone,
  from: VONAGE_FROM_NUMBER,
  text: message,  // ← El mensaje YA viene armado desde el frontend
});
```

**⚠️ Problema identificado:** La Cloud Function NO construye el mensaje SMS. Recibe el mensaje ya armado desde el frontend, por lo que NO hay oportunidad de usar el `physiotherapistName` guardado en el token document.

---

### 📍 **7. Estructura del Token Document (Firestore)**

**Colección:** `patient_consent_tokens/{token}`

**Campos actuales:**
```typescript
{
  token: string;
  patientId: string;
  patientName: string;
  patientPhone: string | null;
  patientEmail: string | null;
  clinicName: string;
  physiotherapistId: string;      // ✅ Equivale a requestedByUid
  physiotherapistName: string;    // ✅ Equivale a requestedByName (snapshot)
  sessionId: string | null;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  used: boolean;
}
```

**✅ Estado:** El token document YA guarda el nombre como snapshot. Los campos `physiotherapistId` y `physiotherapistName` cumplen la función de `requestedByUid` y `requestedByName`.

---

## 🎯 RESUMEN EJECUTIVO

### ✅ **Lo que está bien:**

1. ✅ El template SMS recibe `physioName` como parámetro dinámico.
2. ✅ El token document guarda `physiotherapistId` y `physiotherapistName` como snapshot.
3. ✅ No hay "Mauricio Sobarzo" hardcodeado en código de producción.
4. ✅ El nombre se obtiene dinámicamente desde el perfil del profesional.

### ⚠️ **Problemas identificados:**

1. **Problema 1: El SMS se envía desde el frontend con el nombre actual, no desde el token**
   - **Ubicación:** `src/pages/ProfessionalWorkflowPage.tsx:1211-1217`
   - **Impacto:** Si el profesional cambia su nombre después de crear el token, el SMS usará el nombre nuevo, no el snapshot.
   - **Solución requerida:** Si queremos usar el nombre del token (snapshot), deberíamos:
     - Opción A: Leer el token document después de crearlo y usar `physiotherapistName` del token.
     - Opción B: Mover el envío de SMS al backend (Cloud Function) y que construya el mensaje desde el token.

2. **Problema 2: Fallback hardcodeado "Dr. Smith"**
   - **Ubicación:** `src/utils/clinicProfile.ts:53`
   - **Impacto:** Si no se puede obtener el nombre del profesional, se usa "Dr. Smith" genérico.
   - **Solución requerida:** Cambiar a un fallback más neutral como "Your physiotherapist".

3. **Problema 3: Cloud Function no construye el SMS**
   - **Ubicación:** `functions/index.js:67-110`
   - **Impacto:** La Cloud Function solo reenvía el mensaje ya armado, no usa el token document.
   - **Solución requerida:** Si queremos usar el token document, mover la lógica de construcción del SMS al backend.

---

## 🔧 RECOMENDACIONES DE IMPLEMENTACIÓN

### **Opción A: Usar el nombre del token document (recomendado)**

**Archivo:** `src/pages/ProfessionalWorkflowPage.tsx`

**Cambio:**
```typescript
// Después de generar el token, leer el token document
const tokenData = await PatientConsentService.getConsentByToken(token);

// Usar el nombre guardado en el token (snapshot)
await SMSService.sendConsentLink(
  formattedPhone,
  patient.fullName,
  clinicName,
  tokenData?.physiotherapistName || clinicianDisplayName,  // ← Usar snapshot del token
  token
);
```

**Ventajas:**
- El SMS siempre usará el nombre que tenía el profesional cuando creó el token.
- Histórico correcto si el profesional cambia su nombre después.

### **Opción B: Mejorar el fallback**

**Archivo:** `src/utils/clinicProfile.ts`

**Cambio:**
```typescript
return 'Your physiotherapist';  // ← Más neutral que "Dr. Smith"
```

**Ventajas:**
- Mensaje más neutro si no se puede obtener el nombre.

### **Opción C: Renombrar campos para claridad (opcional)**

**Archivo:** `src/services/patientConsentService.ts`

Si queremos que los campos se llamen explícitamente `requestedByUid` y `requestedByName`:

```typescript
const tokenData = {
  // ...
  requestedByUid: physiotherapistId,      // ← Renombrar
  requestedByName: physiotherapistName,   // ← Renombrar
  // ...
};
```

**Nota:** Esto requeriría migración de datos si hay tokens existentes.

---

## 📊 ARCHIVOS A MODIFICAR (Prioridad)

### **Alta prioridad:**

1. **`src/pages/ProfessionalWorkflowPage.tsx`** (líneas 1198-1217)
   - Leer el token document después de crearlo.
   - Usar `tokenData.physiotherapistName` para el SMS.

2. **`src/utils/clinicProfile.ts`** (línea 53)
   - Cambiar fallback de `'Dr. Smith'` a `'Your physiotherapist'`.

### **Media prioridad (opcional):**

3. **`functions/index.js`** (si se quiere mover lógica al backend)
   - Construir el SMS desde el token document en la Cloud Function.

4. **`src/services/patientConsentService.ts`** (si se quiere renombrar campos)
   - Agregar `requestedByUid` y `requestedByName` como alias o campos adicionales.

---

## ✅ CONCLUSIÓN

**El código NO tiene "Mauricio Sobarzo" hardcodeado en producción.** El flujo actual:

1. ✅ Obtiene el nombre dinámicamente desde el perfil del profesional.
2. ✅ Guarda el nombre en el token document como snapshot.
3. ⚠️ **PERO** envía el SMS con el nombre actual (no el snapshot del token).

**Recomendación:** Implementar **Opción A** para usar el nombre guardado en el token document, garantizando que el SMS siempre use el nombre que tenía el profesional cuando se creó el token.

---

**Fin del informe**
