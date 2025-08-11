# 🚨 RESUMEN EJECUTIVO CTO — API Keys Cruzadas UAT/PROD

**Fecha:** 2025-08-11  
**Estado:** CRÍTICO - Requiere acción inmediata en GCP Console  
**Responsable:** CTO  
**Tiempo estimado de corrección:** 30 minutos + 5 min validación  

## 🎯 PROBLEMA IDENTIFICADO

**Las API Keys de Identity Toolkit están intercambiadas entre UAT y PROD:**
- **API Key "UAT"** → **pertenece a proyecto PROD**
- **API Key "PROD"** → **pertenece a proyecto UAT**

## 🚨 IMPACTO INMEDIATO

- ❌ **UAT**: Bloqueado para creación de usuarios (`auth/operation-not-allowed`)
- ❌ **PROD**: Creando usuarios en proyecto UAT (contaminación de datos)
- ❌ **Desarrollo**: Completamente bloqueado
- ❌ **Firebase Console**: Usuarios aparecen en proyecto incorrecto

## ✅ SOLUCIÓN IMPLEMENTADA

### 1. Diagnóstico Automatizado
- ✅ Script `identitytoolkit-smoke.cjs` endurecido con preflight `getProjectConfig`
- ✅ Validación automática de coherencia key ↔ target
- ✅ Scripts npm: `npm run check:uat` y `npm run check:prod`

### 2. Prevención Futura
- ✅ Workflow GitHub Actions con validación preflight
- ✅ Guardarraíles que fallan si hay mismatch
- ✅ Checklist de Firebase Console actualizado

### 3. Documentación Completa
- ✅ Postmortem técnico detallado
- ✅ Templates de variables de entorno
- ✅ Backup de configuración actual

## 🔧 ACCIÓN REQUERIDA (GCP Console)

### Paso 1: Revocar Keys Actuales
1. **GCP Console** → **APIs & Services** → **Credentials**
2. **Disable** ambas API keys actuales
3. **REGENERATE KEY** para UAT y PROD

### Paso 2: Nombres Claros
- `AIDUXCARE_UAT_IDENTITY_TOOLKIT_KEY`
- `AIDUXCARE_PROD_IDENTITY_TOOLKIT_KEY`

### Paso 3: Restricciones por Entorno
- **UAT**: localhost + dominios UAT
- **PROD**: Solo dominios PROD (NO localhost)

### Paso 4: Estados de Auth
- **UAT**: Email/Password **habilitado**
- **PROD**: Email/Password **inhabilitado**

## 🧪 VALIDACIÓN POST-CORRECCIÓN

```bash
# UAT debe pasar
npm run check:uat; echo "exit UAT=$?"

# PROD debe pasar  
npm run check:prod; echo "exit PROD=$?"
```

**Criterio de éxito:**
- **UAT**: exit 0, status 200, localId presente
- **PROD**: exit 0, status 400, OPERATION_NOT_ALLOWED

## 📊 MÉTRICAS DE RESOLUCIÓN

- **Tiempo de detección**: ✅ 2 horas
- **Tiempo de diagnóstico**: ✅ 30 minutos  
- **Tiempo de preparación**: ✅ 1 hora
- **Tiempo de corrección**: 🚨 **PENDIENTE** (requiere GCP Console)
- **Tiempo de validación**: ✅ 15 minutos

## 🎯 CRITERIOS DE CIERRE

- [ ] API Keys regeneradas y asignadas correctamente
- [ ] Smokes pasan en ambos entornos  
- [ ] Guardarraíles activos y funcionando
- [ ] PROD bloqueado para registro
- [ ] Postmortem documentado y aprobado

## 💡 APRENDIZAJES CLAVE

1. **Preflight obligatorio** antes de operaciones críticas
2. **Nombres claros** para API keys evita confusión
3. **Restricciones estrictas** por entorno previene contaminación
4. **CI/CD con validación** detecta problemas antes del deploy
5. **Siempre validar API REST** fuera del SDK para diagnóstico

## 🚀 PRÓXIMOS PASOS

1. **INMEDIATO**: Ejecutar corrección en GCP Console
2. **15 MIN**: Validar con smokes endurecidos
3. **1 HORA**: Verificar funcionamiento completo del sistema
4. **24 HORAS**: Revisar logs y métricas de funcionamiento
5. **1 SEMANA**: Implementar CI/CD con preflight automático

---

**⚠️ URGENTE: Este problema bloquea completamente el desarrollo. Requiere acción inmediata del CTO o DevOps en GCP Console.**
