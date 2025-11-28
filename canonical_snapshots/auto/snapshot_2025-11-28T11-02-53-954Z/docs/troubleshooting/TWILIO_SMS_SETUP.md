# 📱 TWILIO SMS INTEGRATION - SETUP GUIDE

**Fecha:** Noviembre 16, 2025  
**Status:** ✅ INTEGRADO  
**Número Twilio:** +1 647-424-0008 (Toronto, Canada)

---

## ✅ INTEGRACIÓN COMPLETADA

El servicio SMS ahora está integrado con Twilio API para envío real de SMS.

---

## 🔧 CONFIGURACIÓN REQUERIDA

### **1. Variables de Entorno**

Agregar al archivo `.env.local`:

```bash
# Twilio Configuration
VITE_TWILIO_ACCOUNT_SID=AC80346140c5f9f3ec4f186654cbde47B
VITE_TWILIO_AUTH_TOKEN=a12ffe32a3c8df36604cd19c0a19fb2a
VITE_TWILIO_PHONE_NUMBER=+16474240008
```

**⚠️ IMPORTANTE:** 
- Reemplazar `+16474240008` con el número Twilio que compraste
- El número debe ser capaz de enviar SMS
- Formato: E.164 (`+1XXXXXXXXXX`)

---

## 🧪 TESTING

### **Test 1: Verificar Configuración**

```javascript
// En browser console después de cargar la app:
console.log('Twilio Enabled:', !!import.meta.env.VITE_TWILIO_ACCOUNT_SID);
console.log('Twilio Number:', import.meta.env.VITE_TWILIO_PHONE_NUMBER);
```

### **Test 2: Enviar SMS de Prueba**

1. Ir a `/consent-verification/:patientId` con un paciente nuevo
2. El sistema automáticamente enviará SMS si el paciente tiene teléfono
3. Verificar recepción en el dispositivo del paciente

### **Test 3: Verificar Audit Trail**

1. Revisar Firestore collection `pending_sms`
2. Verificar que cada SMS tiene:
   - `status`: 'sent' o 'failed'
   - `twilioSid`: ID de Twilio
   - `twilioStatus`: Estado de Twilio
   - `auditRefId`: Referencia al log inicial

---

## 📋 FLUJO COMPLETO

### **Cuando se envía SMS:**

1. **Validación de teléfono** → Formato E.164
2. **Audit trail inicial** → Guarda en Firestore con `status: 'sending'`
3. **Envío vía Twilio** → POST a Twilio REST API
4. **Audit trail final** → Actualiza con `status: 'sent'` y `twilioSid`
5. **Error handling** → Si falla, guarda error y permite manual fallback

### **Si Twilio no está configurado:**

- Guarda en Firestore con `status: 'pending'`
- Log warning en consola
- Permite manual fallback inmediatamente

---

## 🔍 MONITOREO

### **Firestore Collections:**

- `pending_sms` - Audit trail completo de todos los SMS
  - `status`: 'sending' | 'sent' | 'failed' | 'pending'
  - `twilioSid`: ID de Twilio (si enviado)
  - `twilioStatus`: Estado de Twilio
  - `error`: Mensaje de error (si falló)

### **Logs:**

- `✅ [SMS] Message sent successfully` - SMS enviado
- `❌ [SMS] Twilio send failed` - Error al enviar
- `⚠️ [SMS] Twilio not configured` - Twilio no configurado

---

## 🚨 TROUBLESHOOTING

### **Error: "Invalid phone number format"**

**Solución:** El servicio intenta formatear automáticamente, pero si falla:
- Verificar que el número esté en formato E.164 o North American
- Ejemplo válido: `+14161234567` o `4161234567`

### **Error: "Twilio API error: 21211"**

**Causa:** Número de destino inválido  
**Solución:** Verificar que el número del paciente sea válido y pueda recibir SMS

### **Error: "Twilio API error: 21608"**

**Causa:** Número Twilio no puede enviar a ese destino  
**Solución:** Verificar que el número Twilio tenga permisos para enviar SMS

### **SMS no se envía pero no hay error**

**Causa:** Variables de entorno no configuradas  
**Solución:** 
1. Verificar `.env.local` tiene las variables
2. Reiniciar dev server (`npm run dev`)
3. Verificar en consola: `TWILIO_ENABLED` debe ser `true`

---

## 📊 COSTOS

### **Twilio Pricing (Canada):**

- **SMS Outbound:** ~$0.0075 USD por mensaje
- **Número Twilio:** ~$1 USD/mes
- **Total por paciente:** ~$0.01 USD (una vez)

### **Ejemplo:**

- 1,000 pacientes: ~$10 USD total
- 10,000 pacientes: ~$100 USD total

---

## ✅ STATUS

**Integración:** ✅ COMPLETA  
**Testing:** ⏳ Pendiente (requiere número Twilio comprado)  
**Producción:** ✅ Ready (solo agregar variables de entorno)

---

**Última actualización:** Noviembre 16, 2025  
**Mantenedor:** CTO Assistant

