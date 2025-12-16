# 📱 Configuración de Número Vonage para Enviar y Recibir

## ✅ Estado Actual

- **Número configurado:** `+14168496475`
- **Uso actual:** Solo para **enviar** SMS (from_number)
- **Estado:** Activo y funcionando

## 🔧 Para Usar el Mismo Número para Recibir SMS

### Opción 1: Configurar Webhooks en Vonage Dashboard (Recomendado)

1. **Ve a Vonage Dashboard:**
   - https://dashboard.nexmo.com/
   - Settings → API Settings → SMS Settings

2. **Configura Webhooks:**
   - **Inbound SMS webhooks:** `https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/receiveSMS`
   - **Delivery receipts (DLR) webhooks:** `https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/smsDeliveryReceipt`
   - **Webhook format:** GET o POST (según tu preferencia)

3. **Crea Cloud Function para recibir SMS:**
   - Necesitarás crear una función `receiveSMS` en `functions/index.js`
   - Esta función procesará los SMS entrantes

### Opción 2: Solo para Testing (Más Simple)

Si solo necesitas **probar** que el número funciona para recibir:

1. **Envía un SMS de prueba** desde otro teléfono al número `+14168496475`
2. **Verifica en Vonage Dashboard:**
   - Logs → SMS
   - Deberías ver el SMS entrante registrado

## 📝 Nota Importante

- El número `+14168496475` **ya puede recibir SMS** automáticamente
- Lo que falta es la **infraestructura** para procesar esos SMS entrantes
- Si solo necesitas **enviar** SMS (como en el flujo de consentimiento actual), no necesitas configurar webhooks

## 🎯 ¿Qué Necesitas?

- **Solo enviar SMS:** ✅ Ya está configurado y funcionando
- **Recibir y procesar SMS:** Necesitas configurar webhooks + crear Cloud Function

¿Quieres que configure los webhooks y cree la función para recibir SMS?

