# 📋 Datos del Paciente de Prueba - SMS Consent Flow

## 🎯 Objetivo
Crear un paciente de prueba para validar el flujo completo de consentimiento SMS usando Vonage Cloud Function.

---

## 👤 Datos del Paciente

### Información Requerida:

**First Name:** `John`

**Last Name:** `TestPatient`

**Phone:** `+14168496475` 
- ⚠️ **NOTA:** Este es el número de Vonage configurado como `from_number`
- Para recibir el SMS, usa **TU número personal** en formato E.164 (ej: `+1XXXXXXXXXX`)

**Email:** `john.testpatient@example.com` (opcional)

**Date of Birth:** `1985-06-15`
- Formato: YYYY-MM-DD
- Edad: ~39 años

**Chief Complaint:** `Lower back pain - testing SMS consent workflow`

---

## 📱 Configuración SMS

### Número Remitente (Vonage):
- **From Number:** `+14168496475`
- Configurado en: Firebase Functions Config (`vonage.from_number`)

### Número Destino (Para recibir SMS):
- **Tu número personal:** `+1XXXXXXXXXX` (reemplaza con tu número real)
- Formato E.164 requerido: `+` + código país + número

---

## 🔄 Flujo de Prueba Esperado

1. **Crear Paciente:**
   - Usa los datos arriba en el formulario del Command Center
   - ✅ El paciente se crea en Firestore

2. **Abrir Workflow:**
   - Navega a `/workflow?patientId={ID_DEL_PACIENTE}`
   - ✅ Se detecta que es la primera sesión
   - ✅ Se genera un token de consentimiento

3. **Envío SMS:**
   - ✅ La Cloud Function `sendConsentSMS` recibe la petición
   - ✅ Llama a Vonage API con las credenciales configuradas
   - ✅ SMS se envía al número del paciente

4. **Verificación:**
   - ✅ Revisa los logs de Firebase Functions
   - ✅ Verifica que el SMS llegó al número destino
   - ✅ El token de consentimiento está en Firestore (`patient_consent_tokens`)

---

## 🧪 Datos Alternativos (Si necesitas múltiples pruebas)

### Paciente 2:
- **Name:** `Jane`, `Doe`
- **Phone:** `+1XXXXXXXXXX` (tu número alternativo)
- **DOB:** `1990-03-20`
- **Complaint:** `Shoulder pain - second test`

### Paciente 3:
- **Name:** `Test`, `User`
- **Phone:** `+1XXXXXXXXXX`
- **DOB:** `1975-11-10`
- **Complaint:** `Knee rehabilitation - third test`

---

## ✅ Checklist de Verificación

- [ ] Paciente creado en Firestore (`patients` collection)
- [ ] Token de consentimiento generado (`patient_consent_tokens` collection)
- [ ] Cloud Function `sendConsentSMS` ejecutada exitosamente
- [ ] SMS recibido en el número destino
- [ ] Logs de Firebase Functions muestran éxito
- [ ] No hay errores CORS en la consola del navegador
- [ ] El consent status se muestra correctamente en el workflow

---

## 🔍 URLs Importantes

- **Cloud Function:** `https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/sendConsentSMS`
- **Firebase Console:** `https://console.firebase.google.com/project/aiduxcare-v2-uat-dev`
- **Firestore Console:** `https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/firestore`

---

## 📝 Notas

- El número de teléfono debe estar en formato E.164
- El número destino debe ser válido y capaz de recibir SMS
- Los logs de la Cloud Function están disponibles en Firebase Console → Functions → Logs
- Si el SMS no llega, verifica:
  1. Las credenciales de Vonage en Firebase Functions Config
  2. El formato del número (E.164)
  3. Los logs de la Cloud Function para errores específicos

