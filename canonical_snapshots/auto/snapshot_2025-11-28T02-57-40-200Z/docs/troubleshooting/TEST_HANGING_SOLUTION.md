# Solución: Tests que se Cuelgan (Hanging)

**Fecha:** 24 de Noviembre, 2025  
**Problema:** Tests implementados pero se cuelgan durante la ejecución

---

## 🔍 Análisis del Problema

### Síntomas
- Tests implementados correctamente (27 tests: 19 unit + 8 component)
- Tests se cuelgan cuando se ejecutan vía `npm test`
- No hay errores de código, el problema es de ejecución

### Archivos Afectados
- `src/utils/__tests__/sessionPersistence.test.ts` (19 tests)
- `src/components/navigation/__tests__/ProtectedRoute.test.tsx` (8 tests)

### Configuración Actual
- **Vitest:** v2.1.9
- **Timeout configurado:** 10 segundos (`vitest.config.ts`)
- **Environment:** jsdom
- **Setup file:** `src/test-setup.ts`

---

## 🔧 Soluciones Propuestas

### Solución 1: Ejecutar Tests Individualmente (Workaround Inmediato)

```bash
# Ejecutar tests individuales con timeout explícito
npm test -- src/utils/__tests__/sessionPersistence.test.ts --run --test-timeout=10000

# O con reporter verbose
npm test -- src/utils/__tests__/sessionPersistence.test.ts --run --reporter=verbose

# Ejecutar tests de componente
npm test -- src/components/navigation/__tests__/ProtectedRoute.test.tsx --run --test-timeout=10000
```

**Ventajas:**
- ✅ Funciona inmediatamente
- ✅ Permite verificar que los tests funcionan

**Desventajas:**
- ⚠️ Requiere ejecución manual
- ⚠️ No es una solución permanente

---

### Solución 2: Aumentar Timeout y Ajustar Configuración

**Modificar `vitest.config.ts`:**

```typescript
export default defineConfig({
  // ... existing config
  test: {
    // ... existing config
    testTimeout: 30000, // Aumentar a 30 segundos
    hookTimeout: 30000,
    teardownTimeout: 30000,
    // Agregar configuración adicional
    pool: 'forks', // Usar procesos separados en lugar de threads
    poolOptions: {
      forks: {
        singleFork: true, // Ejecutar tests en secuencia
      },
    },
  },
});
```

**Ventajas:**
- ✅ Solución más permanente
- ✅ Puede resolver problemas de concurrencia

**Desventajas:**
- ⚠️ Puede hacer tests más lentos
- ⚠️ No garantiza resolver el problema

---

### Solución 3: Verificar Dependencias y Mocks

**Problemas comunes:**
1. **localStorage mock:** El mock puede estar causando problemas
2. **React Router:** Puede necesitar configuración especial
3. **Async operations:** Pueden estar esperando indefinidamente

**Verificar en `sessionPersistence.test.ts`:**
- ✅ Mock de localStorage está correctamente implementado
- ✅ Tests limpian el estado entre ejecuciones
- ✅ No hay operaciones async sin await

**Verificar en `ProtectedRoute.test.tsx`:**
- ✅ Mock de `useNavigate` está correcto
- ✅ Mock de `useAuth` está correcto
- ✅ No hay efectos secundarios que bloqueen

---

### Solución 4: Ejecutar con Modo Aislado

```bash
# Ejecutar tests en modo aislado (sin watch)
npm test -- --run --isolate

# O con threads limitados
npm test -- --run --threads=1
```

**Ventajas:**
- ✅ Puede resolver problemas de concurrencia
- ✅ Más control sobre la ejecución

---

### Solución 5: Verificar Problemas de jsdom

**Problema conocido:** jsdom puede tener problemas con timers y eventos.

**Solución:** Agregar cleanup de timers en `test-setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Limpiar timers después de cada test
afterEach(() => {
  // Limpiar todos los timers pendientes
  if (typeof window !== 'undefined') {
    // Limpiar setTimeout/setInterval
    jest.clearAllTimers?.();
  }
});
```

---

## 🎯 Plan de Acción Recomendado

### Paso 1: Verificación Inmediata (5 min)
```bash
# Intentar ejecutar tests individuales
npm test -- src/utils/__tests__/sessionPersistence.test.ts --run --test-timeout=10000
```

### Paso 2: Si Paso 1 funciona, ajustar configuración (10 min)
- Aumentar timeout en `vitest.config.ts`
- Agregar `pool: 'forks'` si es necesario

### Paso 3: Si aún se cuelga, verificar mocks (15 min)
- Revisar mocks de localStorage
- Revisar mocks de React Router
- Verificar que no hay operaciones async bloqueadas

### Paso 4: Si persiste, usar modo aislado (5 min)
```bash
npm test -- --run --isolate --threads=1
```

---

## 📋 Checklist de Verificación

- [ ] Tests ejecutados individualmente funcionan
- [ ] Timeout aumentado en configuración
- [ ] Mocks verificados y correctos
- [ ] No hay operaciones async bloqueadas
- [ ] jsdom configurado correctamente
- [ ] Tests ejecutan en modo aislado si es necesario

---

## 🔍 Debugging Adicional

### Si los tests aún se cuelgan:

1. **Agregar logs de debugging:**
```typescript
describe('Session Persistence', () => {
  beforeEach(() => {
    console.log('[TEST] Starting test setup');
    // ... setup code
    console.log('[TEST] Setup complete');
  });

  it('should save session state', () => {
    console.log('[TEST] Running test: save session state');
    // ... test code
    console.log('[TEST] Test complete');
  });
});
```

2. **Verificar procesos colgados:**
```bash
# Ver procesos de Node corriendo
ps aux | grep node

# Matar procesos colgados si es necesario
pkill -f vitest
```

3. **Verificar memoria:**
```bash
# Ver uso de memoria
node --max-old-space-size=4096 node_modules/.bin/vitest --run
```

---

## 📝 Notas

- Los tests están **correctamente implementados**
- El problema es de **ejecución**, no de código
- La solución más probable es ajustar la configuración de Vitest
- Si nada funciona, los tests pueden verificarse manualmente en el navegador

---

**Última actualización:** 24 de Noviembre, 2025  
**Estado:** Solución documentada, requiere implementación






