# 🧪 TESTING: Consent Verification Flow con Virtual Phone

**Fecha:** Noviembre 16, 2025  
**Método:** Twilio Virtual Phone para desarrollo/testing

---

## ✅ PREREQUISITOS

1. **Twilio Virtual Phone abierto:**
   - URL: https://console.twilio.com/us1/develop/sms/try-it-out/send-an-sms
   - Mantén esta pestaña abierta durante todo el testing

2. **Aplicación corriendo:**
   ```bash
   npm run dev
   ```

3. **Variables de entorno configuradas:**
   - `VITE_TWILIO_ACCOUNT_SID` ✅
   - `VITE_TWILIO_AUTH_TOKEN` ✅
   - `VITE_TWILIO_PHONE_NUMBER` ✅

---

## 🔄 FLUJO COMPLETO DE TESTING

### **PASO 1: Registrar Paciente Nuevo**

1. Inicia sesión en la aplicación
2. Ve a la sección de registro de pacientes
3. Crea un paciente nuevo con:
   - **Nombre:** "Test Patient"
   - **Teléfono:** `+18777804236` (Twilio Virtual Phone)
   - **Email:** (opcional)
   - Otros datos requeridos

4. **Resultado esperado:**
   - Paciente creado exitosamente
   - Redirección automática a `/consent-verification/:patientId`

### **PASO 2: Consent Verification Page**

1. Deberías llegar automáticamente a `/consent-verification/:patientId`
2. **Verifica que veas:**
   - ✅ Header con "Patient Consent Verification"
   - ✅ Nombre del paciente mostrado
   - ✅ Sección "Digital Consent via SMS"
   - ✅ Status: "Sending SMS..." → "SMS sent..."
   - ✅ Sección "Manual Consent Verification" (fallback)

3. **En el Virtual Phone:**
   - Deberías ver el SMS aparecer en unos segundos
   - Mensaje: "Hola Test Patient, Dr. Smith necesita su consentimiento..."
   - Enlace: `https://aiduxcare.ca/consent/:token`

### **PASO 3: Probar SMS Digital (PATH A)**

1. **Espera a que el SMS aparezca en Virtual Phone**
2. **Haz clic en el enlace del SMS**
3. **Deberías llegar a:** `/consent/:token` (Patient Consent Portal)

### **PASO 4: Patient Consent Portal**

1. **Verifica que veas:**
   - ✅ Header con "Informed Consent for Health Data Processing"
   - ✅ Información del paciente, fisio, clínica
   - ✅ Warning crítico sobre procesamiento en EE.UU.
   - ✅ Sección "Your Rights Under PHIPA"
   - ✅ Sección "How Your Data Will Be Processed"
   - ✅ Opciones de consentimiento:
     - Ongoing Consent
     - This Session Only
     - Decline AI Processing

2. **Selecciona una opción:**
   - Prueba con "Ongoing Consent"
   - Si seleccionas "Ongoing", deberás ingresar firma digital

3. **Haz clic en "Submit Consent"**

4. **Resultado esperado:**
   - ✅ Mensaje de éxito: "Consent Recorded"
   - ✅ Redirección automática a `/workflow?patientId=:patientId`

### **PASO 5: Workflow Access**

1. **Deberías llegar al workflow**
2. **Verifica que:**
   - ✅ No hay redirección de vuelta a consent verification
   - ✅ El workflow carga normalmente
   - ✅ Puedes usar todas las funciones

### **PASO 6: Probar Manual Fallback (PATH B)**

1. **Vuelve a crear otro paciente nuevo** (o usa uno existente sin consent)
2. **Ve a `/consent-verification/:patientId`**
3. **Si el SMS falla o no quieres esperar:**
   - Ve a la sección "Manual Consent Verification"
   - Haz clic en el checkbox con el texto exacto
   - Haz clic en el hyperlink a `/phipa-patient-rights`
   - Verifica que se abre en nueva pestaña
   - Vuelve a la página de verificación
   - Haz clic en "Verify Consent and Proceed to Workflow"

4. **Resultado esperado:**
   - ✅ Redirección a workflow
   - ✅ Consent guardado en Firestore

---

## 🔍 VERIFICACIONES ESPECÍFICAS

### **SMS Enviado Correctamente:**

- [ ] SMS aparece en Virtual Phone
- [ ] Mensaje contiene nombre del paciente
- [ ] Mensaje contiene enlace de consentimiento
- [ ] Enlace es clickeable y funciona

### **Consent Portal Funciona:**

- [ ] Portal carga correctamente con el token
- [ ] Muestra información del paciente
- [ ] Warning sobre EE.UU. es visible
- [ ] Opciones de consentimiento funcionan
- [ ] Firma digital requerida para "Ongoing"
- [ ] Submit guarda el consentimiento

### **Workflow Protection:**

- [ ] Sin consent → Redirige a verification
- [ ] Con consent → Permite acceso al workflow
- [ ] No hay loops de redirección

### **Audit Trail:**

- [ ] Firestore collection `consent_verifications` tiene registro
- [ ] Firestore collection `patient_consents` tiene registro
- [ ] Firestore collection `pending_sms` tiene registro del SMS
- [ ] Todos los eventos tienen timestamps

---

## 🐛 PROBLEMAS COMUNES Y SOLUCIONES

### **Problema 1: SMS no aparece en Virtual Phone**

**Causa:** SMS aún no enviado o error en envío

**Solución:**
- Espera 10-15 segundos
- Revisa la consola del navegador para errores
- Verifica que las variables de Twilio estén correctas
- Usa el fallback manual mientras tanto

### **Problema 2: Enlace del SMS no funciona**

**Causa:** URL incorrecta o token inválido

**Solución:**
- Verifica que la URL sea `http://localhost:5173/consent/:token` (o tu dominio)
- Verifica que el token sea válido en Firestore
- Revisa la consola para errores

### **Problema 3: Redirección loop**

**Causa:** Consent no se guarda correctamente

**Solución:**
- Verifica Firestore que el consent se guardó
- Revisa la consola para errores
- Limpia localStorage si es necesario

### **Problema 4: Workflow no carga después de consent**

**Causa:** Verificación de consent falla

**Solución:**
- Verifica que `PatientConsentService.hasConsent()` retorne `true`
- Revisa Firestore collection `patient_consents`
- Revisa la consola para errores

---

## 📊 CHECKLIST DE TESTING COMPLETO

### **Happy Path (SMS Digital):**
- [ ] Paciente nuevo creado
- [ ] Redirección a consent verification
- [ ] SMS enviado y aparece en Virtual Phone
- [ ] Enlace funciona y abre portal
- [ ] Consent completado exitosamente
- [ ] Redirección a workflow
- [ ] Workflow accesible

### **Fallback Path (Manual):**
- [ ] Paciente nuevo creado
- [ ] Redirección a consent verification
- [ ] Checkbox manual funciona
- [ ] Hyperlink a PHIPA rights funciona
- [ ] Consent manual guardado
- [ ] Redirección a workflow

### **Edge Cases:**
- [ ] Paciente sin teléfono → Solo muestra manual fallback
- [ ] SMS falla → Muestra manual fallback inmediatamente
- [ ] Token expirado → Muestra error apropiado
- [ ] Consent ya existe → Skip a workflow directamente

---

## 🎯 RESULTADO ESPERADO FINAL

Después de completar el testing:

✅ **SMS se envía correctamente** al Virtual Phone  
✅ **Portal de consentimiento funciona** completamente  
✅ **Consent se guarda** en Firestore  
✅ **Workflow se desbloquea** después de consent  
✅ **Audit trail completo** en Firestore  
✅ **Ambos paths funcionan** (SMS y manual)

---

**Última actualización:** Noviembre 16, 2025  
**Mantenedor:** CTO Assistant

