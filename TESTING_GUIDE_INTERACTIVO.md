# 🧪 GUÍA DE TESTING INTERACTIVO
## Fecha: 2026-01-21 | Deploy: ✅ Completado

---

## 🎯 OBJETIVO

Verificar que todos los fixes aplicados funcionan correctamente en producción:
1. ✅ Login sin duplicados
2. ✅ Redirect correcto (sin flash)
3. ✅ Transcripción funciona (Functions disponible)
4. ✅ Validación en inglés
5. ✅ Profile loading feedback

---

## 📋 PREPARACIÓN (2 minutos)

### Paso 1: Abrir la aplicación
1. Abre: **https://aiduxcare-v2-uat-dev.web.app/login**
2. Abre **DevTools** (F12 o Cmd+Option+I)
3. Ve a la pestaña **Console**

### Paso 2: Limpiar consola
1. Click derecho en la consola
2. Selecciona "Clear console" o presiona `Cmd+K` (Mac) / `Ctrl+L` (Windows)

---

## ✅ TEST 1: LOGIN Y REDIRECT (5 minutos)

### Paso 1: Hacer Login
1. Ingresa tu email: `maurosg.2023@gmail.com`
2. Ingresa tu password
3. Click en **"Sign In"**

### Paso 2: Observar Logs en Consola

**✅ DEBE aparecer (en orden):**
```
[INFO] [LOGIN] Attempting sign-in {email: 'maurosg.2023@gmail.com'}
[INFO] Login exitoso: maurosg.2023@gmail.com
[INFO] [PROFILE] Profile loaded from Firestore {...}
[INFO] [LOGIN] Profile complete (WO-13 criteria), redirecting to command-center
```

**❌ NO debe aparecer:**
- `[LOGIN] Profile not loaded yet` (cuando profile existe)
- `[LOGIN] Attempting sign-in` (duplicado - segunda vez)
- `[LOGIN] Profile still loading, deferring redirect decision`

### Paso 3: Verificar UI

**✅ DEBE pasar:**
- Banner azul "Loading your profile..." aparece brevemente (si el perfil tarda)
- Banner desaparece cuando el perfil carga
- Redirect directo a `/command-center`
- NO aparece flash de onboarding

**❌ NO debe pasar:**
- Cuelgue indefinido en login
- Flash visible de onboarding antes de command-center
- Múltiples redirects

### ✅ CHECKLIST TEST 1:
- [ ] Login funciona sin duplicados
- [ ] Redirect directo a command-center
- [ ] NO hay flash de onboarding
- [ ] Logs correctos en consola
- [ ] Banner de carga aparece/desaparece correctamente

---

## ✅ TEST 2: VALIDACIÓN EN INGLÉS (3 minutos)

### Paso 1: Probar Validación
1. **NO llenes** el formulario de login
2. Click directo en **"Sign In"** (sin llenar campos)

### Paso 2: Verificar Mensajes

**✅ DEBE aparecer:**
- Mensaje en inglés: **"Please enter your email address"**
- O mensaje en inglés: **"Please enter your password"**

**❌ NO debe aparecer:**
- Mensajes en español del navegador
- Mensajes como "Rellena este campo" o "Este campo es obligatorio"

### ✅ CHECKLIST TEST 2:
- [ ] Mensajes de validación en inglés
- [ ] NO aparecen mensajes en español del navegador

---

## ✅ TEST 3: TRANSCRIPCIÓN DE AUDIO (5 minutos)

### Paso 1: Iniciar Sesión Clínica
1. En command-center, busca o crea un paciente
2. Click en **"Start Clinical Session"** o similar
3. Selecciona **"Initial Assessment"**

### Paso 2: Grabar Audio
1. Busca el botón de **grabar** (micrófono)
2. Click para iniciar grabación
3. Habla por **30-60 segundos** (puede ser cualquier cosa)
4. Click para **detener** la grabación

### Paso 3: Observar Logs en Consola

**✅ DEBE aparecer:**
```
[FirebaseWhisper] Starting transcription via Cloud Function...
[FirebaseWhisper] App state verified: {appExists: true, ...}
[FirebaseWhisper] Functions instance created: {functionsExists: true, region: 'northamerica-northeast1'}
[FirebaseWhisper] ✅ Transcription successful: {textLength: ..., language: ...}
```

**❌ NO debe aparecer:**
- `Service functions is not available`
- `Firebase Functions service is not available after retries`
- `Firebase Functions is not initialized`
- Errores de transcripción

### Paso 4: Verificar Resultado

**✅ DEBE pasar:**
- La transcripción aparece en el campo de texto
- El texto transcrito es legible
- No hay errores visibles en la UI

**❌ NO debe pasar:**
- Error visible en la UI
- Mensaje de error sobre Functions
- Transcripción vacía o fallida

### ✅ CHECKLIST TEST 3:
- [ ] Transcripción funciona correctamente
- [ ] NO aparece "Service functions is not available"
- [ ] Logs muestran Functions inicializado correctamente
- [ ] Texto transcrito aparece en la UI

---

## ✅ TEST 4: PROFILE LOADING FEEDBACK (2 minutos)

### Paso 1: Observar Durante Login
1. Si el perfil tarda en cargar, observa la UI
2. Debe aparecer banner azul: **"Loading your profile..."**

### Paso 2: Verificar Comportamiento

**✅ DEBE pasar:**
- Banner aparece cuando profile está cargando
- Banner desaparece cuando profile termina de cargar
- No hay cuelgues indefinidos

**❌ NO debe pasar:**
- Banner aparece pero nunca desaparece
- Cuelgue indefinido sin feedback

### ✅ CHECKLIST TEST 4:
- [ ] Banner de carga aparece cuando es necesario
- [ ] Banner desaparece cuando profile carga
- [ ] No hay cuelgues indefinidos

---

## 📊 RESUMEN DE RESULTADOS

### Marca lo que funciona:

**TEST 1 - Login y Redirect:**
- [ ] ✅ PASS - Login funciona sin duplicados
- [ ] ✅ PASS - Redirect correcto sin flash
- [ ] ❌ FAIL - Problema: _______________

**TEST 2 - Validación:**
- [ ] ✅ PASS - Mensajes en inglés
- [ ] ❌ FAIL - Problema: _______________

**TEST 3 - Transcripción:**
- [ ] ✅ PASS - Transcripción funciona
- [ ] ✅ PASS - Functions disponible
- [ ] ❌ FAIL - Problema: _______________

**TEST 4 - Profile Loading:**
- [ ] ✅ PASS - Feedback visual funciona
- [ ] ❌ FAIL - Problema: _______________

---

## 🚨 SI ALGO FALLA

### Captura de Evidencia:
1. **Screenshot** de la UI
2. **Logs completos** de la consola (copia todo)
3. **Descripción** del problema

### Reportar:
- Qué test falló
- Qué esperabas vs qué pasó
- Logs de consola
- Screenshots si aplica

---

## ✅ SI TODO FUNCIONA

### Próximo Paso: Limpieza de Functions

Si todos los tests pasan, ejecuta:

```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean
./scripts/cleanup-duplicate-functions.sh
```

Esto eliminará las 4 functions duplicadas en `us-central1` (100% seguro).

---

## 📝 NOTAS PARA EL TESTING

- **Tiempo total estimado:** 15 minutos
- **URL:** https://aiduxcare-v2-uat-dev.web.app
- **Navegador recomendado:** Chrome o Firefox con DevTools abierto
- **Si algo falla:** NO ejecutes la limpieza de functions hasta resolverlo

---

**¡Vamos paso a paso!** Empieza con el TEST 1 y avísame qué ves en los logs. 🚀
