# 🚀 RUNBOOK FINAL — Descruce de API Keys UAT/PROD

**Fecha:** 2025-08-11  
**Estado:** PREPARADO - Esperando regeneración de keys en GCP Console  
**Responsable:** CTO/DevOps  

## 📋 PREREQUISITOS

✅ **Completado:**
- Script endurecido `identitytoolkit-smoke.cjs` con preflight
- Scripts npm configurados
- Templates de variables de entorno
- Checklist de Firebase Console
- Workflows CI/CD preparados
- Backup de configuración actual

🚨 **PENDIENTE:**
- Regenerar API keys en GCP Console
- Aplicar restricciones por entorno
- Configurar estados de Authentication

## 🔧 ACCIÓN EN GCP CONSOLE

### 1. Revocar Keys Actuales
1. **GCP Console** → **APIs & Services** → **Credentials**
2. **Disable** ambas API keys actuales:
   - `AIzaSyC1coa0W0LEsj_g-dzferIdmAEVvEep40I` (key "UAT")
   - `AIzaSyDMDl3Vj_0WSMhOtz6IbGiTXaWOtABeGyk` (key "PROD")

### 2. Regenerar Keys Nuevas
1. **REGENERATE KEY** para UAT → `AIDUXCARE_UAT_IDENTITY_TOOLKIT_KEY`
2. **REGENERATE KEY** para PROD → `AIDUXCARE_PROD_IDENTITY_TOOLKIT_KEY`

### 3. Aplicar Restricciones
1. **API restrictions**: Solo **Identity Toolkit API**
2. **Application restrictions**:
   - **UAT**: `http://localhost:*`, `http://127.0.0.1:*`, `https://*.aiduxcare-mvp-uat.web.app`, `https://*.aiduxcare-mvp-uat.firebaseapp.com`
   - **PROD**: `https://*.aiduxcare-mvp-prod.web.app`, `https://*.aiduxcare-mvp-prod.firebaseapp.com` (**NO localhost**)

### 4. Estados de Authentication
1. **UAT**: Email/Password **habilitado**
2. **PROD**: Email/Password **inhabilitado** (mantener bloqueado)

## 🧪 EJECUCIÓN DEL RUNBOOK

### Paso 1: Activar Nueva Configuración UAT
```bash
# Backup de configuración actual
mv .env.local .env.local.pre-fix.$(date +%Y%m%d_%H%M%S)

# Activar nueva configuración
mv .env.local.new .env.local

# Editar .env.local y colocar la NUEVA key UAT
# VITE_FIREBASE_API_KEY=<NUEVA_KEY_UAT_AIDUXCARE_UAT_IDENTITY_TOOLKIT_KEY>
```

### Paso 2: Verificar UAT (Preflight + Signup Esperado)
```bash
# Cargar variables de entorno
export $(grep -v '^#' .env.local | xargs)

# Ejecutar smoke test UAT
node scripts/identitytoolkit-smoke.cjs UAT; echo "exit UAT=$?"

# Criterio de éxito: exit 0, status 200, localId presente
```

### Paso 3: Verificar PROD (Preflight + Bloqueo Esperado)
```bash
# Exportar key PROD temporalmente
export VITE_FIREBASE_API_KEY="<NUEVA_KEY_PROD_AIDUXCARE_PROD_IDENTITY_TOOLKIT_KEY>"

# Ejecutar smoke test PROD
node scripts/identitytoolkit-smoke.cjs PROD; echo "exit PROD=$?"

# Criterio de éxito: exit 0, status 400, OPERATION_NOT_ALLOWED
```

### Paso 4: Guardar Evidencias
```bash
# UAT
npm run check:uat | tee reports/smoke-uat.txt

# PROD
npm run check:prod | tee reports/smoke-prod.txt
```

### Paso 5: Quality Gates
```bash
# TypeScript
npx tsc --noEmit | tee reports/tsc.txt

# ESLint
npm run lint | tee reports/eslint.txt

# Build
npm run build | tee reports/build.txt
```

## 🎯 CRITERIOS DE ÉXITO

### **UAT:**
- ✅ `preflight.projectId` contiene "uat" o dominios UAT
- ✅ `status: 200` con `localId` presente
- ✅ `exit 0`

### **PROD:**
- ✅ `preflight.projectId` contiene "prod" o dominios PROD
- ✅ `status: 400` con `OPERATION_NOT_ALLOWED`
- ✅ `exit 0`

### **Sistema:**
- ✅ CI dual en verde
- ✅ Checklist marcado
- ✅ Postmortem actualizado
- ✅ Build limpio

## 🚨 TROUBLESHOOTING

### Si UAT falla:
1. Verificar que la key UAT esté en proyecto correcto
2. Confirmar Email/Password habilitado en Firebase Console
3. Verificar dominios autorizados incluyen localhost

### Si PROD falla:
1. Verificar que la key PROD esté en proyecto correcto
2. Confirmar Email/Password inhabilitado en Firebase Console
3. Verificar que NO incluya localhost en dominios autorizados

### Si preflight falla:
1. Verificar que la API key sea válida
2. Confirmar que Identity Toolkit API esté habilitada
3. Verificar permisos de la key

## 📊 MÉTRICAS ESPERADAS

- **Tiempo de regeneración**: 5-10 minutos
- **Tiempo de configuración**: 10-15 minutos
- **Tiempo de validación**: 5-10 minutos
- **Tiempo total**: 20-35 minutos

## 🔗 REFERENCIAS

- [Checklist Firebase Console](reports/firebase-uat-checklist.md)
- [Postmortem](docs/reports/postmortem-keys-crossed.md)
- [Script endurecido](scripts/identitytoolkit-smoke.cjs)
- [Workflow CI Dual](.github/workflows/preflight-firebase-dual.yml)

---

**⚠️ IMPORTANTE: Este runbook solo se ejecuta DESPUÉS de regenerar las API keys en GCP Console.**
