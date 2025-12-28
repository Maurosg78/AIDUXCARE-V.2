# Análisis de Tests con Runner Estable (test:lowmem:file)

**Fecha:** 2025-12-23  
**Runner:** `pnpm test:lowmem:file` (baseline estable con `--pool=forks`)  
**Contexto:** Análisis corregido usando el carril estable, no el run masivo anterior

---

## 📊 Resumen Ejecutivo

### Estado del Baseline Estable
✅ **Runner funciona correctamente** - `test:lowmem:file` termina sin colgarse  
✅ **No hay ETIMEDOUT** - Problema resuelto con el filtro correcto  
⚠️ **21 test files ejecutados** - 1 archivo real + 20 snapshots en `canonical_snapshots/`

---

## 🔍 Análisis de los 21 Test Files

### Composición Real

**1 archivo de test real:**
- `src/components/navigation/__tests__/ProtectedRoute.test.tsx` ✅ (pasa)

**20 archivos de snapshots (fallan):**
- `canonical_snapshots/auto/snapshot_2025-11-28T01-59-53-321Z/src/components/navigation/__tests__/ProtectedRoute.test.tsx`
- `canonical_snapshots/auto/snapshot_2025-11-27T14-03-17-331Z/src/components/navigation/__tests__/ProtectedRoute.test.tsx`
- `canonical_snapshots/auto/snapshot_2025-11-28T02-18-49-834Z/src/components/navigation/__tests__/ProtectedRoute.test.tsx`
- ... (17 más en `canonical_snapshots/auto/`)
- `canonical_snapshots/quick/quick_20251125_233213/src/components/navigation/__tests__/ProtectedRoute.test.tsx`
- `canonical_snapshots/quick/quick_20251125_233649/src/components/navigation/__tests__/ProtectedRoute.test.tsx`

### Causa Raíz

Vitest está encontrando archivos de test dentro del directorio `canonical_snapshots/` porque:
1. Estos directorios contienen copias de archivos de test (probablemente para snapshot testing o versionado)
2. Vitest los detecta como test files válidos porque coinciden con el patrón `**/*.test.tsx`
3. El filtro `--` no excluye estos archivos automáticamente

### Impacto

- **No es bloqueante** - El test real (`ProtectedRoute.test.tsx`) pasa correctamente
- **Ruido en output** - Los 20 snapshots fallan pero no afectan la funcionalidad
- **Puede afectar bisect fino** - Si queremos aislar exactamente 1 archivo, necesitamos excluir `canonical_snapshots/`

---

## 🔴 BLOQUEANTE (Crítico)

### 1. Unhandled Rejection en `retryWrapper.test.ts` ✅ RESUELTO
```
Error: persistent error
❯ src/core/audio-pipeline/__tests__/retryWrapper.test.ts:49:19
```

**Estado:** ✅ Resuelto  
**Solución:** Usar `vi.useRealTimers()` para este test específico en lugar de fake timers  
**Resultado:** Test pasa sin unhandled rejection

---

## 🟡 NO BLOQUEANTE (Importante pero no crítico)

### 1. Snapshots en `canonical_snapshots/` se ejecutan como tests ✅ RESUELTO

**Problema:** 20 archivos de snapshots se ejecutaban cuando solo queríamos 1 test file  
**Solución aplicada:** Excluir `canonical_snapshots/**` en `vitest.lowmem.config.ts`:

```typescript
test: {
  exclude: ['**/canonical_snapshots/**', '**/node_modules/**'],
  // ...
}
```

**Resultado:** ✅ `pnpm test:lowmem:file src/components/navigation/__tests__/ProtectedRoute.test.tsx` ahora ejecuta **1 test file** (no 21)

---

## ✅ Lo que SÍ funciona

1. **Baseline estable** - `test:lowmem:file` termina correctamente
2. **Test objetivo pasa** - `ProtectedRoute.test.tsx` ejecuta y pasa
3. **No hay hangs** - El runner termina sin colgarse
4. **Filtro funciona** - Solo ejecuta archivos relacionados (aunque incluye snapshots)

---

## 🎯 Recomendaciones Prioritizadas

### P0 — Mantener el carril estable como único runner
✅ **Completado** - `test:lowmem:file` es el baseline estable

### P1 — Arreglar Unhandled Rejection ✅ COMPLETADO
✅ **Resuelto** - Usando `vi.useRealTimers()` para el test específico que causaba problemas

### P2 — Excluir `canonical_snapshots/` del glob de tests ✅ COMPLETADO
✅ **Resuelto** - Agregado `exclude: ['**/canonical_snapshots/**', '**/node_modules/**']` a `vitest.lowmem.config.ts`

**DoD alcanzado:** `pnpm test:lowmem:file src/components/navigation/__tests__/ProtectedRoute.test.tsx` ejecuta **1 test file** (no 21)

---

## 📝 Notas Técnicas

### Por qué los snapshots se ejecutan

Vitest usa un glob pattern por defecto que incluye `**/*.test.{ts,tsx}`. Los archivos en `canonical_snapshots/` coinciden con este patrón, por lo que se ejecutan.

### Solución recomendada

Excluir explícitamente `canonical_snapshots/` en la configuración de test, ya sea en:
- `vitest.lowmem.config.ts` (para el baseline estable)
- `vitest.config.ts` (para todos los tests)

---

## ✅ Conclusión

**Estado actual:** 
- ✅ Baseline estable funciona
- ✅ Test objetivo pasa
- ✅ Unhandled rejection resuelto
- ✅ Snapshots excluidos - solo 1 test file se ejecuta

**Próximo paso:** 
✅ **Carril estable listo** - Proceder con bisect del Hilo 1 usando `test:lowmem:file` con confianza

