# 🔍 Firebase Diagnostic Report — WO-DEMOSTAB-02

**Fecha:** 2026-01-19  
**Proyecto:** `aiduxcare-v2-uat-dev`  
**Ejecutor:** Cursor CLI

---

## ✅ Verificaciones completadas

### 1. Proyecto Firebase
- ✅ Proyecto `aiduxcare-v2-uat-dev` existe
- ✅ Project Number: `935285025887`
- ✅ Acceso confirmado

### 2. Web Apps existentes

**App encontrada:**
- **Display Name:** AiDuxCare V2 UAT Web
- **App ID:** `1:935285025887:web:192bab3e9ef5aef2ee3fea`
- **Platform:** WEB

### 3. Configuración de la App real

```json
{
  "projectId": "aiduxcare-v2-uat-dev",
  "appId": "1:935285025887:web:192bab3e9ef5aef2ee3fea",
  "storageBucket": "aiduxcare-v2-uat-dev.firebasestorage.app",
  "apiKey": "AIzaSyDfZP98XKzx71vA4ctX9HlUWI1tp0W9EKQ",
  "authDomain": "aiduxcare-v2-uat-dev.firebaseapp.com",
  "messagingSenderId": "935285025887",
  "projectNumber": "935285025887",
  "version": "2"
}
```

**⚠️ IMPORTANTE:** La configuración **NO incluye `measurementId`**, lo que indica que:
- Analytics **NO está habilitado** para esta Web App, O
- Analytics está habilitado pero el SDK config no lo incluye (requiere verificación en Console)

---

## ❌ Problema identificado

### App ID mismatch

| Ubicación | App ID |
|-----------|--------|
| **Código (actual)** | `1:935285025887:web:prod-uatsim-2e34b1` |
| **Firebase Console (real)** | `1:935285025887:web:192bab3e9ef5aef2ee3fea` |

**El App ID en el código NO existe en Firebase Console.**

---

## 🔧 Solución requerida

### Opción A: Actualizar código con App ID real (RECOMENDADO)

1. Actualizar variable de entorno:
   ```bash
   VITE_FIREBASE_APP_ID=1:935285025887:web:192bab3e9ef5aef2ee3fea
   ```

2. Verificar en Firebase Console que Analytics esté habilitado:
   - Ir a: https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/settings/general
   - Buscar Web App: "AiDuxCare V2 UAT Web"
   - Verificar que Analytics esté habilitado
   - Si no está habilitado, habilitarlo y obtener el Measurement ID

3. Si Analytics está habilitado, obtener Measurement ID y actualizar:
   ```bash
   VITE_FIREBASE_MEASUREMENT_ID=<measurementId_de_console>
   ```

### Opción B: Crear nueva Web App con App ID esperado

1. Crear nueva Web App en Firebase Console con nombre que genere App ID similar
2. O usar el App ID real que ya existe

---

## 📋 Próximos pasos

1. **Verificar en Firebase Console UI:**
   - Ir a: https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/settings/general
   - Buscar Web App: "AiDuxCare V2 UAT Web"
   - Verificar estado de Analytics

2. **Si Analytics NO está habilitado:**
   - Habilitar Google Analytics para esta Web App
   - Obtener Measurement ID generado

3. **Actualizar variables de entorno:**
   ```bash
   VITE_FIREBASE_APP_ID=1:935285025887:web:192bab3e9ef5aef2ee3fea
   VITE_FIREBASE_MEASUREMENT_ID=<obtenido_de_console>
   ```

4. **Probar en navegador:**
   - Abrir app en incógnito
   - Verificar que no hay errores 400
   - Confirmar FASE 0 PASS

---

## ✅ DoD Checklist

- [ ] App ID actualizado en código: `1:935285025887:web:192bab3e9ef5aef2ee3fea`
- [ ] Analytics habilitado en Firebase Console
- [ ] Measurement ID obtenido y configurado
- [ ] Consola del navegador limpia (0 errores 400)
- [ ] FASE 0 → PASS
