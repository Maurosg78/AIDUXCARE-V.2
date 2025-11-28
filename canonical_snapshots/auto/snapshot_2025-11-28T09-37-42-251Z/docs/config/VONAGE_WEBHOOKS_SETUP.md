# 📱 Configuración de Webhooks de Vonage para Recibir SMS

## 🎯 Objetivo

Configurar webhooks en Vonage Dashboard para que el número `+14168496475` pueda recibir SMS y procesarlos automáticamente.

## ✅ Funciones Creadas

Se han creado dos Cloud Functions:

1. **`receiveSMS`** - Recibe SMS entrantes
   - URL: `https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/receiveSMS`
   - Guarda los SMS en Firestore (`inbound_sms` collection)

2. **`smsDeliveryReceipt`** - Recibe confirmaciones de entrega
   - URL: `https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/smsDeliveryReceipt`
   - Guarda los receipts en Firestore (`sms_delivery_receipts` collection)

## 🔧 Pasos para Configurar Webhooks en Vonage Dashboard

### Paso 1: Acceder a Configuración de SMS

1. Ve a: https://dashboard.nexmo.com/
2. Inicia sesión con tu cuenta
3. Navega a: **Settings** → **API Settings** → **SMS Settings**

### Paso 2: Configurar Inbound SMS Webhook

1. En la sección **"Inbound SMS webhooks"**, pega esta URL:
   ```
   https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/receiveSMS
   ```

2. Selecciona el formato: **GET** (recomendado) o **POST**

3. Haz clic en **"Save"**

### Paso 3: Configurar Delivery Receipts Webhook

1. En la sección **"Delivery receipts (DLR) webhooks"**, pega esta URL:
   ```
   https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/smsDeliveryReceipt
   ```

2. Haz clic en **"Save"**

### Paso 4: Verificar Configuración

1. Ve a: **Settings** → **API Settings** → **SMS Settings**
2. Verifica que ambas URLs estén guardadas correctamente
3. Asegúrate de que el formato de webhook sea **GET** (o POST si prefieres)

## 🚀 Desplegar las Funciones

Después de configurar los webhooks, despliega las nuevas funciones:

```bash
firebase deploy --only functions:receiveSMS,functions:smsDeliveryReceipt --project aiduxcare-v2-uat-dev
```

## 🧪 Probar el Flujo Completo

### 1. Enviar SMS de Prueba

1. Crea un paciente de prueba en el Command Center
2. Abre el workflow con ese paciente
3. Se enviará un SMS con el link de consentimiento

### 2. Recibir SMS de Prueba

1. Envía un SMS desde otro teléfono al número `+14168496475`
2. Verifica en Firebase Console → Firestore → `inbound_sms` que el SMS se guardó
3. Verifica en Firebase Console → Functions → Logs que la función `receiveSMS` se ejecutó

### 3. Verificar Delivery Receipts

1. Cuando se envíe un SMS, verifica en Firestore → `sms_delivery_receipts` que se guardó el receipt
2. Esto confirma que el SMS fue entregado exitosamente

## 📋 Estructura de Datos en Firestore

### Collection: `inbound_sms`

```json
{
  "from": "+16475588754",
  "to": "+14168496475",
  "text": "STOP",
  "messageId": "0A00000012345678",
  "timestamp": "2025-01-XX...",
  "receivedAt": "2025-01-XX...",
  "processed": false
}
```

### Collection: `sms_delivery_receipts`

```json
{
  "to": "+16475588754",
  "from": "+14168496475",
  "messageId": "0A00000012345678",
  "status": "delivered",
  "errCode": "0",
  "price": "0.00735000",
  "network": "CA-FIXED",
  "receivedAt": "2025-01-XX..."
}
```

## ✅ Verificación de Funcionamiento

### Logs Esperados

En Firebase Functions → Logs, deberías ver:

```
[SMS Receive] Inbound SMS received: {
  from: '+16475588754',
  to: '+14168496475',
  text: 'STOP',
  messageId: '0A00000012345678'
}
```

```
[SMS Delivery] Receipt received: {
  to: '+16475588754',
  from: '+14168496475',
  messageId: '0A00000012345678',
  status: 'delivered'
}
```

## 🔍 Troubleshooting

### Si no recibes SMS:

1. Verifica que los webhooks estén configurados correctamente en Vonage Dashboard
2. Verifica que las funciones estén desplegadas: `firebase functions:list`
3. Revisa los logs de las funciones en Firebase Console
4. Verifica que el número `+14168496475` esté activo en Vonage Dashboard → Numbers

### Si los webhooks no funcionan:

1. Verifica que las URLs sean accesibles públicamente (no localhost)
2. Verifica que las funciones retornen `200 OK`
3. Revisa los logs de Vonage Dashboard → Logs → SMS para ver errores

## 📝 Notas Importantes

- Los webhooks deben ser URLs públicas (no localhost)
- Las funciones retornan `200 OK` siempre para evitar reintentos de Vonage
- Los SMS se guardan en Firestore para auditoría y procesamiento posterior
- El formato GET es más simple y recomendado para webhooks de Vonage

