# 📍 Cómo Verificar SMS Recibidos en Firestore

## 🔍 Ubicación en Firebase Console

### Paso 1: Acceder a Firestore

1. Ve a: **https://console.firebase.google.com/project/aiduxcare-v2-uat-dev**
2. En el menú lateral izquierdo, haz clic en **"Firestore Database"**
3. Si es la primera vez, puede pedirte crear la base de datos (solo haz clic en "Create database")

### Paso 2: Buscar la Colección

La colección `inbound_sms` **se crea automáticamente** cuando llega el primer SMS.

**Si aún no has recibido ningún SMS:**
- La colección no existirá todavía
- Necesitas enviar un SMS primero para que se cree

**Si ya enviaste un SMS:**
- Busca en la lista de colecciones a la izquierda
- Deberías ver `inbound_sms` en la lista
- Haz clic en ella para ver los documentos

## 📋 Colecciones Relacionadas

También puedes verificar estas colecciones:

1. **`inbound_sms`** - SMS recibidos en el número `+14168496475`
2. **`sms_delivery_receipts`** - Confirmaciones de entrega de SMS enviados
3. **`pending_sms`** - SMS que están siendo enviados (auditoría)
4. **`patient_consent_tokens`** - Tokens de consentimiento generados

## 🔍 Alternativa: Verificar en Logs de Functions

Si no encuentras la colección, puedes verificar los logs de las funciones:

### Paso 1: Acceder a Functions Logs

1. En Firebase Console, haz clic en **"Functions"** en el menú lateral
2. Haz clic en **"Logs"** (o busca la función `receiveSMS`)
3. Busca logs con `[SMS Receive]` o `receiveSMS`

### Paso 2: Ver Logs en Tiempo Real

1. En Functions → Logs
2. Filtra por función: `receiveSMS`
3. Deberías ver logs como:
   ```
   [SMS Receive] Inbound SMS received: {
     from: '+34XXXXXXXXX',
     to: '+14168496475',
     text: 'TEST',
     messageId: '...'
   }
   ```

## 🧪 Prueba Paso a Paso

### 1. Enviar SMS de Prueba

Desde tu teléfono español, envía:
```
+14168496475
```
Mensaje: `TEST`

### 2. Esperar 5-10 segundos

Los webhooks pueden tardar unos segundos en procesarse.

### 3. Verificar en Firestore

1. Ve a Firestore Database
2. Busca la colección `inbound_sms`
3. Si no existe, espera unos segundos más y recarga la página
4. Haz clic en la colección para ver los documentos

### 4. Verificar en Logs

1. Ve a Functions → Logs
2. Busca `receiveSMS` o `[SMS Receive]`
3. Deberías ver el log del SMS recibido

## ⚠️ Si No Aparece la Colección

### Posibles Razones:

1. **El SMS aún no llegó** - Espera 10-15 segundos y recarga
2. **Los webhooks no están configurados** - Verifica en Vonage Dashboard
3. **La función falló** - Revisa los logs de Functions para ver errores
4. **El número no está activo** - Verifica en Vonage Dashboard → Numbers

### Verificar Webhooks:

1. Ve a Vonage Dashboard → Settings → API Settings → SMS Settings
2. Verifica que las URLs estén guardadas correctamente
3. Verifica que el formato sea GET

## 📝 Estructura del Documento

Cuando llegue un SMS, verás un documento así:

```json
{
  "from": "+34XXXXXXXXX",
  "to": "+14168496475",
  "text": "TEST",
  "messageId": "0A00000012345678",
  "timestamp": "2025-11-17T22:53:50Z",
  "receivedAt": "2025-11-17T22:53:51Z",
  "processed": false
}
```

## 🔗 Enlaces Directos

- **Firestore Console:** https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/firestore
- **Functions Logs:** https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/functions/logs
- **Vonage Dashboard:** https://dashboard.nexmo.com/

