# 🧪 TESTING: Flujo Completo de Consentimiento - Paso a Paso

**Objetivo:** Probar el flujo completo desde la aplicación, enviando SMS al Virtual Phone y generando trazabilidad legal.

---

## ✅ PREREQUISITOS

1. **Aplicación corriendo:**
   ```bash
   npm run dev
   ```

2. **Virtual Phone abierto:**
   - URL: https://console.twilio.com/us1/develop/sms/try-it-out/send-an-sms
   - Mantén esta pestaña abierta

3. **Firebase Console abierto (opcional, para ver trazabilidad):**
   - URL: https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/firestore
   - Collection: `consent_verifications`, `patient_consents`, `pending_sms`

---

## 🔄 FLUJO COMPLETO PASO A PASO

### **PASO 1: Crear Paciente de Prueba**

1. Inicia sesión en la aplicación
2. Ve a la sección de registro de pacientes (Command Center o donde esté el formulario)
3. Crea un paciente nuevo con:
   - **Nombre:** "Test Patient Virtual"
   - **Teléfono:** `+18777804236` (Twilio Virtual Phone)
   - **Email:** (opcional)
   - Otros datos requeridos

4. **Haz clic en "Guardar" o "Crear Paciente"**

5. **Resultado esperado:**
   - ✅ Paciente creado exitosamente
   - ✅ Redirección automática a `/consent-verification/:patientId`

### **PASO 2: Consent Verification Page**

1. **Deberías llegar automáticamente** a `/consent-verification/:patientId`

2. **Verifica que veas:**
   - ✅ Header: "Patient Consent Verification"
   - ✅ Nombre del paciente: "Test Patient Virtual"
   - ✅ Sección "Digital Consent via SMS"
   - ✅ Status: "Sending SMS..." → "SMS sent to +18777804236..."
   - ✅ Sección "Manual Consent Verification" (fallback)

3. **En el Virtual Phone (otra pestaña):**
   - Espera 5-10 segundos
   - Deberías ver el SMS aparecer
   - Mensaje: "Hola Test Patient Virtual, Dr. Smith necesita su consentimiento..."
   - Enlace clickeable: `http://localhost:5173/consent/:token`

### **PASO 3: Hacer Clic en el Enlace del SMS**

1. **En el Virtual Phone**, haz clic en el enlace del SMS
2. **Deberías llegar a:** `/consent/:token` (Patient Consent Portal)

### **PASO 4: Patient Consent Portal**

1. **Verifica que veas:**
   - ✅ Header: "Informed Consent for Health Data Processing"
   - ✅ Información del paciente, fisio, clínica
   - ✅ Warning crítico: "⚠️ IMPORTANT: All AI Processing Occurs in the United States"
   - ✅ Sección "Your Rights Under PHIPA"
   - ✅ Sección "How Your Data Will Be Processed"
   - ✅ Opciones de consentimiento:
     - Ongoing Consent
     - This Session Only
     - Decline AI Processing

2. **Selecciona una opción:**
   - Prueba con **"Ongoing Consent"**
   - Si seleccionas "Ongoing", deberás ingresar **firma digital** (tu nombre)

3. **Haz clic en "Submit Consent"**

4. **Resultado esperado:**
   - ✅ Mensaje de éxito: "Consent Recorded"
   - ✅ Redirección automática a `/workflow?patientId=:patientId`

### **PASO 5: Verificar Trazabilidad Legal**

1. **Ve a Firebase Console:**
   - https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/firestore

2. **Verifica las siguientes collections:**

   **a. `consent_verifications`:**
   - Debe tener un documento con el `patientId`
   - Campos: `smsStatus`, `consentMethod`, `consentTimestamp`, `auditTrail`
   - `auditTrail` debe tener eventos: `sms_sent`, `consent_verified`

   **b. `patient_consents`:**
   - Debe tener un documento con el consentimiento
   - Campos: `patientId`, `consentScope`, `consented`, `consentDate`, `tokenUsed`
   - `consented` debe ser `true`
   - `consentScope` debe ser `'ongoing'` o `'session-only'`

   **c. `pending_sms`:**
   - Debe tener un documento con el SMS enviado
   - Campos: `phone`, `message`, `status`, `twilioSid`
   - `status` debe ser `'sent'`
   - `twilioSid` debe tener un valor (ej: `SM...`)

3. **Verifica timestamps:**
   - Todos los documentos deben tener `createdAt` o `timestamp`
   - Los timestamps deben ser recientes (hace unos segundos/minutos)

### **PASO 6: Verificar Workflow Access**

1. **Deberías llegar al workflow** después del consentimiento
2. **Verifica que:**
   - ✅ No hay redirección de vuelta a consent verification
   - ✅ El workflow carga normalmente
   - ✅ Puedes usar todas las funciones

---

## 🔍 VERIFICACIONES ESPECÍFICAS

### **Trazabilidad Legal Completa:**

- [ ] **SMS enviado** → Registrado en `pending_sms` con `twilioSid`
- [ ] **Consent verificado** → Registrado en `consent_verifications` con `auditTrail`
- [ ] **Consent guardado** → Registrado en `patient_consents` con `consentDate`
- [ ] **Timestamps presentes** → Todos los eventos tienen timestamps
- [ ] **IP address** → `fisioIpAddress` en `consent_verifications`
- [ ] **User agent** → Presente en `auditTrail`
- [ ] **Token usado** → `tokenUsed` en `patient_consents` referencia al token del SMS

### **Datos en Firestore:**

**Documento en `consent_verifications`:**
```json
{
  "patientId": "test-patient-xxx",
  "patientName": "Test Patient Virtual",
  "patientPhone": "+18777804236",
  "smsStatus": "sent",
  "consentMethod": "sms",
  "consentTimestamp": Timestamp,
  "fisioIpAddress": "client-side",
  "auditTrail": [
    {
      "event": "sms_sent",
      "timestamp": Timestamp,
      "ipAddress": "...",
      "userAgent": "...",
      "metadata": { "token": "...", "phone": "+18777804236" }
    },
    {
      "event": "consent_verified",
      "timestamp": Timestamp,
      "metadata": { "method": "sms", "auditId": "..." }
    }
  ]
}
```

**Documento en `patient_consents`:**
```json
{
  "patientId": "test-patient-xxx",
  "patientName": "Test Patient Virtual",
  "consentScope": "ongoing",
  "consented": true,
  "consentDate": Timestamp,
  "consentVersion": "1.0.0",
  "tokenUsed": "token-xxx",
  "digitalSignature": "Tu Nombre",
  "ipAddress": "client-side",
  "userAgent": "..."
}
```

---

## 🐛 TROUBLESHOOTING

### **Problema: SMS no aparece en Virtual Phone**

**Solución:**
- Espera 10-15 segundos
- Revisa la consola del navegador para errores
- Verifica que las variables de Twilio estén correctas
- Usa el fallback manual mientras tanto

### **Problema: Enlace del SMS no funciona**

**Solución:**
- Verifica que la URL sea `http://localhost:5173/consent/:token`
- Verifica que el token sea válido
- Revisa la consola para errores

### **Problema: Consent no se guarda**

**Solución:**
- Verifica Firestore que el consent se guardó
- Revisa la consola para errores
- Verifica que el token sea válido

---

## ✅ CHECKLIST FINAL

### **Flujo Completo:**
- [ ] Paciente creado exitosamente
- [ ] Redirección automática a consent verification
- [ ] SMS enviado y aparece en Virtual Phone
- [ ] Enlace del SMS funciona
- [ ] Portal de consentimiento carga correctamente
- [ ] Consent completado exitosamente
- [ ] Redirección a workflow
- [ ] Workflow accesible

### **Trazabilidad Legal:**
- [ ] SMS registrado en `pending_sms` con `twilioSid`
- [ ] Consent verification registrado en `consent_verifications`
- [ ] Consent guardado en `patient_consents`
- [ ] Audit trail completo con todos los eventos
- [ ] Timestamps presentes en todos los documentos
- [ ] IP address y user agent registrados

---

**Última actualización:** Noviembre 16, 2025  
**Mantenedor:** CTO Assistant

