# 🔗 Pasos para Configurar Webhooks en Vonage Dashboard

## ✅ Estado Actual

- ✅ Función `receiveSMS` desplegada
- ✅ Función `smsDeliveryReceipt` desplegada
- ⏳ Pendiente: Configurar webhooks en Vonage Dashboard

## 📋 Pasos Detallados

### Paso 1: Acceder a Vonage Dashboard

1. Ve a: **https://dashboard.nexmo.com/**
2. Inicia sesión con tu cuenta
3. Verifica que estés en el proyecto correcto

### Paso 2: Navegar a SMS Settings

1. En el menú lateral izquierdo, haz clic en **"Settings"**
2. Luego haz clic en **"API Settings"**
3. En la página de API Settings, busca la sección **"SMS settings"**

### Paso 3: Configurar Inbound SMS Webhook

1. En la sección **"Inbound SMS webhooks"**, verás un campo de texto
2. Pega esta URL exacta:
   ```
   https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/receiveSMS
   ```
3. En el dropdown **"Webhook format"**, selecciona **"GET"** (recomendado)
4. Haz clic en **"Save"** o el botón de guardar

### Paso 4: Configurar Delivery Receipts Webhook

1. En la sección **"Delivery receipts (DLR) webhooks"**, verás un campo de texto
2. Pega esta URL exacta:
   ```
   https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/smsDeliveryReceipt
   ```
3. Haz clic en **"Save"** o el botón de guardar

### Paso 5: Verificar Configuración

1. Recarga la página de API Settings
2. Verifica que ambas URLs estén guardadas correctamente
3. Asegúrate de que el formato sea **GET** para Inbound SMS

## 🧪 Probar el Flujo

### Test 1: Enviar SMS desde la App

1. Crea un paciente de prueba en Command Center
2. Abre el workflow con ese paciente
3. Se enviará un SMS con el link de consentimiento
4. Haz clic en el link → debería abrir el portal de consentimiento

### Test 2: Recibir SMS en el Número

1. Desde otro teléfono, envía un SMS al número `+14168496475`
2. Verifica en Firebase Console → Firestore → `inbound_sms` que el SMS se guardó
3. Verifica en Firebase Console → Functions → Logs que la función `receiveSMS` se ejecutó

### Test 3: Verificar Delivery Receipts

1. Cuando se envíe un SMS desde la app, espera unos segundos
2. Verifica en Firestore → `sms_delivery_receipts` que se guardó el receipt
3. Esto confirma que el SMS fue entregado exitosamente

## ✅ URLs de las Funciones

- **receiveSMS:** `https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/receiveSMS`
- **smsDeliveryReceipt:** `https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/smsDeliveryReceipt`

## 🔍 Verificación en Firebase Console

Después de configurar los webhooks, puedes verificar:

1. **Firestore Collections:**
   - `inbound_sms` - SMS recibidos
   - `sms_delivery_receipts` - Confirmaciones de entrega

2. **Functions Logs:**
   - Busca logs con `[SMS Receive]` para SMS entrantes
   - Busca logs con `[SMS Delivery]` para confirmaciones

## ⚠️ Troubleshooting

### Si no recibes SMS:

1. Verifica que los webhooks estén guardados en Vonage Dashboard
2. Verifica que las URLs sean exactamente las mostradas arriba (sin espacios)
3. Verifica que el número `+14168496475` esté activo en Vonage → Numbers

### Si los webhooks no funcionan:

1. Verifica en Vonage Dashboard → Logs → SMS que los webhooks se están llamando
2. Verifica en Firebase Functions → Logs que las funciones se ejecutan
3. Asegúrate de que las funciones retornen `200 OK` (ya está implementado)

## 📝 Notas

- Los webhooks deben ser URLs públicas (no localhost)
- El formato GET es más simple y recomendado
- Las funciones siempre retornan `200 OK` para evitar reintentos de Vonage
- Los SMS se guardan automáticamente en Firestore para auditoría

