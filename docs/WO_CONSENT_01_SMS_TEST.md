# WO-CONSENT-01 – Test de sendConsentSMS y receiveSMS

**Estado:** 🟡 **PENDIENTE**

**Fecha:** 2025-12-07

**Owner:** Equipo Implementador (backend / Cloud Functions)

---

## 🎯 Objetivo

Demostrar que:
- `sendConsentSMS` funciona y habla con Vonage
- `receiveSMS` registra algo coherente en Firestore / logs
- Flujo básico de consentimiento funciona end-to-end

---

## 📋 Entregables

### 1. Script de prueba

**Archivo:** `functions/scripts/test-sendConsentSMS.js`

**Funcionalidad:**
- Llama directamente a la función `sendConsentSMS`
- Usa un número dummy real de prueba
- Imprime el `messageId` / `requestId` que devuelva Vonage
- Verifica que SMS se envía correctamente

### 2. Documentación del flujo

**Archivo:** `docs/pilot/CONSENT_FLOW_MINIMAL.md`

**Contenido:**
- Explica el flujo que SÍ funciona ahora
- Explica qué cosas todavía NO están (p.ej. UI bonita, tracking avanzado, etc.)
- Incluye screenshots o ejemplos si es posible

---

## 🔧 Implementación

### Estructura del script

```javascript
'use strict';

const admin = require('firebase-admin');
// TODO: Importar función sendConsentSMS

async function main() {
  // 1. Inicializar Firebase Admin
  // 2. Construir payload de SMS
  // 3. Llamar a sendConsentSMS
  // 4. Verificar respuesta de Vonage
  // 5. Verificar que se registra en Firestore/logs
  // 6. Mostrar resumen
}

main();
```

### Payload mínimo

```javascript
const payload = {
  patientId: 'TEST-PATIENT-001',
  phoneNumber: '+1234567890', // Número de prueba real
  consentType: 'treatment',
  language: 'en',
};
```

### Verificaciones

1. **SMS enviado:**
   - Respuesta de Vonage con `messageId` o `requestId`
   - Status code 200/201

2. **Registro en Firestore/logs:**
   - Entrada en colección `consentLogs` o similar
   - Campos: `patientId`, `phoneNumber`, `sentAt`, `status`

3. **SMS recibido (opcional):**
   - Si se puede simular recepción, verificar que `receiveSMS` funciona
   - Verificar que se procesa correctamente

---

## ✅ Definition of Done (DoD)

- [ ] Script `test-sendConsentSMS.js` existe y ejecuta sin errores
- [ ] Script llama a `sendConsentSMS` correctamente
- [ ] Respuesta de Vonage incluye `messageId` o `requestId`
- [ ] Log en consola muestra ID de Vonage
- [ ] Logs de Cloud Functions (`sendConsentSMS`) no muestran errores 500
- [ ] Documento `CONSENT_FLOW_MINIMAL.md` existe y explica:
  - [ ] Flujo que funciona
  - [ ] Limitaciones conocidas
  - [ ] Próximos pasos

---

## 🚨 Troubleshooting

### Error: "Vonage API key invalid"
- Verificar credenciales de Vonage en variables de entorno
- Verificar que cuenta de Vonage está activa

### Error: "Phone number invalid"
- Verificar formato del número (E.164)
- Verificar que número está en formato correcto

### Error: "SMS not received"
- Verificar que número de prueba es válido
- Verificar que `receiveSMS` está configurado correctamente
- Verificar webhook de Vonage está configurado

---

**Última actualización:** 2025-12-07  
**Estado:** 🟡 **PENDIENTE** - Requiere implementación

