# INFORME DE ERRORES - PR #280
**Fecha:** 2026-01-02  
**PR:** #280 - `fix: SOAP action parameter + config improvements`  
**Rama:** `fix/soap-action-only-2026-01-02`  
**Estado:** ❌ **6 CHECKS FALLANDO**

---

## 📊 RESUMEN EJECUTIVO

### Estado General
- **PR:** Abierto
- **Checks Exitosos:** 3/9
- **Checks Fallidos:** 6/9
- **Checks Skipped:** 1/9

### Checks Exitosos ✅
1. ✅ **build** - Build completado exitosamente (8s)
2. ✅ **check-no-soap-logs** - Sin logs de SOAP (6s)
3. ✅ **protect** - Archivos de infra protegidos (6s)

### Checks Fallidos ❌
1. ❌ **TypeScript typecheck** - FAILURE (21s)
2. ❌ **e2e** - FAILURE (19s)
3. ❌ **gate** - FAILURE (13s)
4. ❌ **size** - FAILURE (13s)
5. ❌ **validate** (Data Validation Zod) - FAILURE (20s)
6. ❌ **validate** (Data Validation Zod) - FAILURE (16s)

---

## 🔍 ANÁLISIS DETALLADO DE ERRORES

### ERROR PRINCIPAL: `pnpm-lock.yaml` Desactualizado

**Causa Raíz:** Todos los 6 checks fallan por la misma razón: el archivo `pnpm-lock.yaml` está desincronizado con `package.json`.

**Evidencia:**
```
ERR_PNPM_OUTDATED_LOCKFILE
Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with <ROOT>/package.json
```

**Razón del Desajuste:**
- Se agregó `happy-dom@^20.0.11` como dev dependency usando `npm install`
- El proyecto usa **pnpm** como gestor de paquetes (no npm)
- El `pnpm-lock.yaml` no fue actualizado con la nueva dependencia
- CI usa `pnpm install --frozen-lockfile` que falla si hay desajustes

**Diferencia Detectada:**
- **Lockfile tiene:** Orden alfabético diferente de dependencias
- **package.json tiene:** `happy-dom` agregado en devDependencies
- **Especificación faltante en lockfile:** `"happy-dom":"^20.0.11"`

---

## 📋 ERRORES POR CHECK

### 1. TypeScript Typecheck ❌
**Run ID:** 20655668349  
**Duración:** 21s  
**Error:**
```
ERR_PNPM_OUTDATED_LOCKFILE
Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date
```
**Impacto:** No se puede ejecutar typecheck porque falla la instalación de dependencias.

---

### 2. E2E Smoke Tests ❌
**Run ID:** 20655668350  
**Duración:** 19s  
**Error:**
```
ERR_PNPM_OUTDATED_LOCKFILE
Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date
```
**Impacto:** No se pueden ejecutar tests E2E porque falla la instalación de dependencias.

---

### 3. Canonical Gate ❌
**Run ID:** 20655668341  
**Duración:** 13s  
**Error:**
```
ERR_PNPM_OUTDATED_LOCKFILE
Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date
```
**Impacto:** No se puede ejecutar el gate check porque falla la instalación de dependencias.

---

### 4. Bundle Size Budget ❌
**Run ID:** 20655668358  
**Duración:** 13s  
**Error:**
```
ERR_PNPM_OUTDATED_LOCKFILE
Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date
```
**Impacto:** No se puede verificar el tamaño del bundle porque falla la instalación de dependencias.

---

### 5. Data Validation (Zod) - Check 1 ❌
**Run ID:** 20655668346  
**Duración:** 20s  
**Error:**
```
ERR_PNPM_OUTDATED_LOCKFILE
Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date
```
**Impacto:** No se puede ejecutar validación de datos porque falla la instalación de dependencias.

---

### 6. Data Validation (Zod) - Check 2 ❌
**Run ID:** 20655667940  
**Duración:** 16s  
**Error:**
```
ERR_PNPM_OUTDATED_LOCKFILE
Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date
```
**Impacto:** No se puede ejecutar validación de datos porque falla la instalación de dependencias.

---

## 🎯 CAUSA RAÍZ IDENTIFICADA

### Problema Técnico
1. **Gestor de Paquetes Incorrecto:**
   - Se usó `npm install happy-dom --save-dev`
   - El proyecto requiere `pnpm` como gestor de paquetes
   - Esto causó que `package.json` se actualizara pero `pnpm-lock.yaml` no

2. **Lockfile No Commiteado:**
   - El `pnpm-lock.yaml` no fue actualizado ni commiteado
   - CI espera que el lockfile esté sincronizado con `package.json`

3. **CI Estricto:**
   - CI usa `--frozen-lockfile` que no permite desajustes
   - Esto es una buena práctica pero requiere lockfile actualizado

---

## 📝 CAMBIOS REALIZADOS QUE CAUSARON EL ERROR

### Commit: `4480591f` - "fix: correct test mocks and update FHIR snapshots"

**Archivos Modificados:**
- ✅ `package.json` - Agregado `happy-dom@^20.0.11` en devDependencies
- ✅ `src/components/mobile/__tests__/mobileHelpers.test.ts` - Fix test
- ✅ `src/components/navigation/__tests__/ProtectedRoute.test.tsx` - Fix mock
- ✅ `src/core/fhir/__tests__/snapshots/*.snap` - Snapshots actualizados

**Problema:**
- ❌ `pnpm-lock.yaml` NO fue actualizado
- ❌ Se usó `npm` en lugar de `pnpm`

---

## ✅ SOLUCIÓN REQUERIDA

### Acción Inmediata
1. **Actualizar lockfile:**
   ```bash
   cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean
   pnpm install
   ```

2. **Commit y push del lockfile:**
   ```bash
   git add pnpm-lock.yaml
   git commit -m "chore: update pnpm-lock.yaml with happy-dom dependency"
   git push origin fix/soap-action-only-2026-01-02
   ```

### Verificación
- Los 6 checks deberían pasar después de actualizar el lockfile
- Todos los checks dependen de la instalación exitosa de dependencias

---

## 📊 IMPACTO

### Impacto Técnico
- **Alto:** Bloquea completamente el merge del PR
- **Alto:** Todos los checks de CI fallan por la misma razón
- **Bajo:** La solución es simple (actualizar lockfile)

### Impacto en Tiempo
- **Tiempo de Fix:** ~5 minutos
- **Tiempo de Re-run CI:** ~2-3 minutos
- **Total Estimado:** ~10 minutos

---

## 🔗 ENLACES ÚTILES

- **PR:** https://github.com/Maurosg78/AIDUXCARE-V.2/pull/280
- **TypeScript Check:** https://github.com/Maurosg78/AIDUXCARE-V.2/actions/runs/20655668349
- **E2E Check:** https://github.com/Maurosg78/AIDUXCARE-V.2/actions/runs/20655668350
- **Gate Check:** https://github.com/Maurosg78/AIDUXCARE-V.2/actions/runs/20655668341
- **Size Check:** https://github.com/Maurosg78/AIDUXCARE-V.2/actions/runs/20655668358
- **Validate Check 1:** https://github.com/Maurosg78/AIDUXCARE-V.2/actions/runs/20655668346
- **Validate Check 2:** https://github.com/Maurosg78/AIDUXCARE-V.2/actions/runs/20655667940

---

## 📌 RECOMENDACIONES PARA EL CTO

### Inmediatas
1. ✅ **Actualizar `pnpm-lock.yaml`** usando `pnpm install`
2. ✅ **Commit y push** del lockfile actualizado
3. ✅ **Esperar re-run de CI** para verificar que todos los checks pasen

### Preventivas
1. ⚠️ **Usar `pnpm` en lugar de `npm`** para este proyecto
2. ⚠️ **Verificar gestor de paquetes** antes de instalar dependencias
3. ⚠️ **Siempre commitear lockfile** cuando se modifica `package.json`
4. ⚠️ **Pre-commit hook** para verificar sincronización lockfile/package.json

### Buenas Prácticas
- El proyecto ya tiene CI configurado correctamente con `--frozen-lockfile`
- Esto previene problemas de dependencias inconsistentes
- Solo necesitamos asegurar que el lockfile esté actualizado localmente

---

## ✅ CONCLUSIÓN

**Veredicto:** Error de proceso (gestor de paquetes incorrecto), no error de código.

**Severidad:** Media (fácil de resolver)

**Tiempo Estimado de Resolución:** 10 minutos

**Riesgo:** Bajo (solo requiere actualizar lockfile)

---

**Generado por:** Cursor AI  
**Fecha:** 2026-01-02  
**PR:** #280



