# 🧾 WO-DEMOSTAB-02 — Fix Firebase Web App / Analytics Config (Console)

**Owner:** CTO  
**Executor:** Infra / Firebase Admin  
**Priority:** 🔴 CRÍTICO  
**Bloquea:** Demo Niagara + FASE 0  
**Entorno:** `aiduxcare-v2-uat-dev`  
**Branch:** `feature/clinical-analysis-clean-jan2026`

---

## 🎯 Objetivo

Eliminar **definitivamente** los errores:
- `analytics/config-fetch-failed`
- `installations/request-failed`

mediante **configuración correcta en Firebase Console**.

---

## 🔍 Paso 1 — Verificación actual (CLI)

### Verificar Web Apps existentes

```bash
# Listar todas las Web Apps del proyecto
firebase apps:list --project aiduxcare-v2-uat-dev

# Buscar específicamente el App ID problemático
firebase apps:list --project aiduxcare-v2-uat-dev | grep "prod-uatsim-2e34b1"
```

### Verificar configuración de Analytics

```bash
# Ver detalles de una Web App específica (si existe)
firebase apps:sdkconfig WEB --project aiduxcare-v2-uat-dev --app <APP_ID>
```

---

## 🔧 Paso 2 — Resolver según caso detectado

### Caso A — ❌ App NO existe

**Crear nueva Web App:**

```bash
# Crear nueva Web App
firebase apps:create WEB \
  --project aiduxcare-v2-uat-dev \
  --display-name "AiDuxCare UAT Web App"

# Obtener el App ID generado
firebase apps:list --project aiduxcare-v2-uat-dev

# Obtener configuración completa (incluye measurementId si Analytics está habilitado)
firebase apps:sdkconfig WEB --project aiduxcare-v2-uat-dev --app <NUEVO_APP_ID>
```

**Luego actualizar variables de entorno:**
- `VITE_FIREBASE_APP_ID` = nuevo App ID
- `VITE_FIREBASE_MEASUREMENT_ID` = measurementId del output

---

### Caso B — ⚠️ App existe, Analytics deshabilitado

**Habilitar Google Analytics (requiere Firebase Console UI):**

1. Ir a: https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/settings/general
2. Buscar la Web App con App ID: `1:935285025887:web:prod-uatsim-2e34b1`
3. Click en "Add Analytics" o "Enable Google Analytics"
4. Seleccionar o crear propiedad de Google Analytics
5. Verificar que se genera Measurement ID

**Verificar después:**

```bash
# Verificar que Analytics está habilitado
firebase apps:sdkconfig WEB --project aiduxcare-v2-uat-dev --app 1:935285025887:web:prod-uatsim-2e34b1
```

El output debe incluir `measurementId`.

---

### Caso C — ⚠️ Measurement ID distinto

**Opción 1: Actualizar código con Measurement ID correcto**

```bash
# Obtener Measurement ID actual de Firebase Console
firebase apps:sdkconfig WEB --project aiduxcare-v2-uat-dev --app 1:935285025887:web:prod-uatsim-2e34b1

# Actualizar .env.local o variables de entorno con el measurementId correcto
# VITE_FIREBASE_MEASUREMENT_ID=<measurementId_del_output>
```

**Opción 2: Recrear Web App (si Measurement ID no coincide)**

```bash
# Eliminar Web App existente (CUIDADO: esto elimina la app)
# firebase apps:delete WEB --project aiduxcare-v2-uat-dev --app <APP_ID>

# Crear nueva Web App
firebase apps:create WEB \
  --project aiduxcare-v2-uat-dev \
  --display-name "AiDuxCare UAT Web App (Recreated)"
```

---

## ✅ Paso 3 — Verificación obligatoria

### Script de verificación rápida

```bash
#!/bin/bash
# verify-firebase-config.sh

PROJECT_ID="aiduxcare-v2-uat-dev"
APP_ID="1:935285025887:web:prod-uatsim-2e34b1"

echo "🔍 Verificando configuración de Firebase..."
echo ""

# Verificar que el App ID existe
echo "1️⃣ Verificando que App ID existe..."
firebase apps:list --project $PROJECT_ID | grep -q "$APP_ID"
if [ $? -eq 0 ]; then
  echo "   ✅ App ID existe"
else
  echo "   ❌ App ID NO existe - crear nueva Web App"
  exit 1
fi

# Verificar configuración completa
echo ""
echo "2️⃣ Obteniendo configuración completa..."
CONFIG=$(firebase apps:sdkconfig WEB --project $PROJECT_ID --app "$APP_ID" 2>&1)

if echo "$CONFIG" | grep -q "measurementId"; then
  echo "   ✅ Analytics está habilitado (measurementId presente)"
  MEASUREMENT_ID=$(echo "$CONFIG" | grep -oP 'measurementId["\s]*:\s*["\']([^"\']+)["\']' | cut -d'"' -f2 | cut -d"'" -f2)
  echo "   📊 Measurement ID: $MEASUREMENT_ID"
else
  echo "   ❌ Analytics NO está habilitado - habilitar en Firebase Console"
  exit 1
fi

echo ""
echo "✅ Verificación completada"
echo "📋 Próximo paso: Verificar en navegador que no hay errores 400"
```

### Verificación en navegador (obligatoria)

1. Abrir app en **ventana incógnito**
2. Abrir DevTools (Console + Network)
3. Hacer refresh manual
4. Verificar:
   - ❌ 0 errores 400
   - ❌ 0 errores Firebase
   - ✅ Solo logs OK / WARN no críticos

---

## ✅ DoD (Definition of Done)

Este WO se considera **COMPLETADO** solo si:

- ✅ App ID existe en Firebase Console
- ✅ Analytics está habilitado para esa Web App
- ✅ Measurement ID coincide con `VITE_FIREBASE_MEASUREMENT_ID`
- ✅ Consola del navegador **totalmente limpia** (0 errores 400)
- ✅ NO aparece:
  - `analytics/config-fetch-failed`
  - `installations/request-failed`
- ✅ FASE 0 → **PASS**

---

## 🛑 Regla firme

> **No hacemos demo mientras esto no esté corregido en Firebase Console.**

---

## 📋 Checklist de ejecución

- [ ] Ejecutar `firebase apps:list` para verificar App ID
- [ ] Si no existe: crear nueva Web App
- [ ] Si existe pero sin Analytics: habilitar en Console
- [ ] Si Measurement ID distinto: alinear (código o Console)
- [ ] Ejecutar script de verificación
- [ ] Probar en navegador (incógnito)
- [ ] Confirmar consola limpia (0 errores 400)
- [ ] Marcar FASE 0 como PASS

---

## 🔗 Referencias

- Firebase Console: https://console.firebase.google.com/project/aiduxcare-v2-uat-dev
- Firebase CLI Docs: https://firebase.google.com/docs/cli
- Analytics Setup: https://firebase.google.com/docs/analytics/get-started
