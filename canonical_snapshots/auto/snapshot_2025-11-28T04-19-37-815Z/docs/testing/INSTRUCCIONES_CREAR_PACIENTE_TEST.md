# Instrucciones para Crear Paciente de Prueba

## Método 1: Script en Consola del Navegador (Recomendado)

Este es el método más rápido y directo. Usa los servicios existentes de la aplicación.

### Pasos:

1. **Inicia la aplicación:**
   ```bash
   npm run dev
   ```

2. **Abre el navegador y navega a:**
   ```
   http://localhost:5173
   ```

3. **Abre la consola del navegador:**
   - Presiona `F12` o `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux)
   - Ve a la pestaña "Console"

4. **Copia y pega el script completo:**
   - Abre el archivo: `scripts/create-patient-browser.js`
   - Copia TODO el contenido
   - Pégalo en la consola del navegador
   - Presiona Enter

5. **El script ejecutará automáticamente:**
   - ✅ Creará el paciente en Firestore
   - ✅ Generará el token de consentimiento
   - ✅ Enviará el SMS al Virtual Phone
   - ✅ Inicializará la verificación de consentimiento

6. **Revisa la salida en la consola:**
   - Verás el Patient ID generado
   - Verás el Consent Token
   - Verás el Consent URL
   - El Patient ID se guardará en `window.testPatientId` para acceso rápido

### Variables Globales Disponibles:

Después de ejecutar el script, puedes usar:
- `window.testPatientId` - ID del paciente creado
- `window.testConsentToken` - Token de consentimiento
- `window.testConsentUrl` - URL completa del portal de consentimiento

---

## Método 2: Crear Índice de Firestore (Primero)

Antes de probar el flujo completo, necesitas crear el índice de Firestore que falta.

### Opción A: Usar el Enlace Directo del Error

1. **Copia el enlace del error en la consola:**
   ```
   https://console.firebase.google.com/v1/r/project/aiduxcare-v2-uat-dev/firestore/indexes?create_composite=...
   ```

2. **Pégalo en el navegador y haz clic en "Create Index"**

### Opción B: Crear Manualmente en Firebase Console

1. **Ve a Firebase Console:**
   ```
   https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/firestore/indexes
   ```

2. **Haz clic en "Create Index"**

3. **Configura el índice:**
   - **Collection ID:** `sessions`
   - **Fields to index:**
     - `patientId` - Ascending
     - `userId` - Ascending
     - `timestamp` - Descending

4. **Haz clic en "Create"**

5. **Espera a que el índice se cree** (puede tomar unos minutos)

---

## Método 3: Usar la UI de la Aplicación

Si prefieres usar la interfaz gráfica:

1. **Inicia la aplicación:**
   ```bash
   npm run dev
   ```

2. **Navega a Command Center:**
   ```
   http://localhost:5173/command-center
   ```

3. **Haz clic en "Registrar Nuevo Paciente"**

4. **Completa el formulario:**
   - **Nombre:** Test
   - **Apellido:** Patient Virtual Phone
   - **Teléfono:** +18777804236 (Virtual Phone de Twilio)
   - **Email:** test@example.com (opcional)

5. **Haz clic en "Registrar Paciente"**

6. **Serás redirigido automáticamente a:**
   ```
   /consent-verification/{patientId}
   ```

7. **El sistema enviará automáticamente el SMS** al Virtual Phone

---

## Verificar que Todo Funciona

### 1. Verificar SMS en Virtual Phone

1. **Ve a Twilio Console:**
   ```
   https://console.twilio.com/us1/develop/sms/try-it-out/send-an-sms
   ```

2. **Deberías ver el SMS con el enlace de consentimiento**

### 2. Verificar Datos en Firestore

1. **Ve a Firebase Console:**
   ```
   https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/firestore/data
   ```

2. **Verifica las siguientes colecciones:**
   - ✅ `patients` - Debe tener el paciente creado
   - ✅ `patient_consent_tokens` - Debe tener el token generado
   - ✅ `consent_verifications` - Debe tener el estado de verificación
   - ✅ `pending_sms` - Debe tener el registro del SMS enviado

### 3. Probar el Flujo Completo

1. **Haz clic en el enlace del SMS** (o usa `window.testConsentUrl`)

2. **Completa el formulario de consentimiento:**
   - Lee todos los derechos del paciente
   - Marca todas las casillas de confirmación
   - Elige "Ongoing consent" o "Session-only"
   - Escribe tu nombre completo en la firma digital

3. **Haz clic en "Submit Informed Consent"**

4. **Deberías ver la página de confirmación**

5. **Navega al workflow:**
   ```
   http://localhost:5173/workflow?patientId={patientId}
   ```

6. **El sistema debería verificar el consentimiento automáticamente**

---

## Solución de Problemas

### Error: "The query requires an index"

**Solución:** Crea el índice usando el Método 2 arriba.

### Error: "Twilio credentials not configured"

**Solución:** Verifica que `.env.local` tenga:
```
VITE_TWILIO_ACCOUNT_SID=AC...
VITE_TWILIO_AUTH_TOKEN=...
VITE_TWILIO_PHONE_NUMBER=+1...
```

### Error: "Firebase not initialized"

**Solución:** Asegúrate de que la aplicación esté corriendo (`npm run dev`) y que estés en una página de la aplicación cuando ejecutes el script.

### SMS no llega al Virtual Phone

**Solución:**
1. Verifica que el Virtual Phone esté activo en Twilio Console
2. Verifica que las credenciales de Twilio sean correctas
3. Revisa la colección `pending_sms` en Firestore para ver el estado del envío

---

## Datos de Prueba

- **Patient Name:** Test Patient Virtual Phone
- **Patient Phone:** +18777804236 (Virtual Phone de Twilio)
- **Patient Email:** test@example.com
- **Clinic Name:** AiduxCare Clinic
- **Physiotherapist:** Dr. Smith

---

## Próximos Pasos

Una vez que el paciente esté creado y el SMS enviado:

1. ✅ Verifica el SMS en Virtual Phone
2. ✅ Haz clic en el enlace de consentimiento
3. ✅ Completa el formulario de consentimiento
4. ✅ Verifica la trazabilidad legal en Firestore
5. ✅ Prueba el flujo completo hasta el workflow

---

**Última actualización:** Noviembre 2025

