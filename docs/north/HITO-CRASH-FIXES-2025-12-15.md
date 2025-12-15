# Hito: Crash Fixes + Analytics Dedupe (2025-12-15)

**Market:** CA  
**Language:** en-CA  
**Base:** `canon/aidux-baseline-2025-12-15`  
**Status:** ✅ Completado

---

## Resumen

Tres fixes críticos aplicados para eliminar crashes y ruido en desarrollo:

1. ✅ **TranscriptArea**: sin crash por `.value` (timer cleanup + lectura safe)
2. ✅ **De-identification audit**: best-effort (no-op si no hay audit; no rompe el flujo)
3. ✅ **Analytics**: dedupe efectivo (ya no duplica `pilot_session_started` ni `workflow_session_started` en dev)

---

## 1. TranscriptArea: Sin crash por `.value`

### Problema
`handlePaste` leía `event.currentTarget.value` dentro de un `setTimeout`, causando crashes cuando el componente se desmontaba o el evento quedaba inválido.

### Solución
- **Captura temprana**: `textarea` capturado antes del `setTimeout`
- **Timer cleanup**: `useEffect` limpia timeout en unmount
- **Lectura segura**: función `readTranscriptSafe` con optional chaining (`textarea?.value ?? ""`)

### Archivos modificados
- `src/components/workflow/TranscriptArea.tsx`

### Cambios clave
```typescript
// Safe read function for textarea value
const readTranscriptSafe = useCallback((textarea: HTMLTextAreaElement | null): string => {
  return textarea?.value ?? "";
}, []);

// Handle paste events
const handlePaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
  isPastingRef.current = true;
  
  // Capture textarea reference before setTimeout (avoids event pooling issues)
  const textarea = event.currentTarget;
  
  // Clear any existing timeout
  if (timerRef.current) {
    window.clearTimeout(timerRef.current);
  }
  
  // Let the default paste behavior happen, then update state
  timerRef.current = window.setTimeout(() => {
    const newValue = readTranscriptSafe(textarea);
    
    // Only update if we got a valid value
    if (newValue !== "") {
      setLocalTranscript(newValue);
      debouncedSetTranscript(newValue);
    }
    isPastingRef.current = false;
  }, 0);
}, [debouncedSetTranscript, readTranscriptSafe]);
```

---

## 2. De-identification Audit: Best-effort (no-op si no hay audit)

### Problema
`logDeidentification` fallaba si `FirestoreAuditLogger` no estaba disponible, rompiendo el flujo principal de de-identificación.

### Solución
- **Cache del import dinámico**: evita imports repetidos
- **Optional chaining**: `auditModule?.default?.log` con early return
- **Manejo no bloqueante**: errores capturados sin `throw`

### Archivos modificados
- `src/services/dataDeidentificationService.ts`

### Cambios clave
```typescript
// Cache the dynamic import to avoid repeated imports
let auditModulePromise: Promise<any> | null = null;

export async function logDeidentification(...): Promise<void> {
  try {
    // Cache the dynamic import to avoid repeated imports
    if (!auditModulePromise) {
      auditModulePromise = import('../core/audit/FirestoreAuditLogger').catch(() => null);
    }
    const auditModule = await auditModulePromise;
    
    if (!auditModule?.default?.log) {
      // Audit logger not available, skip silently (non-blocking)
      return;
    }
    
    await auditModule.default.log({...});
  } catch (error) {
    // Fail silently in case of audit logging issues (don't break main flow)
    console.warn('[audit] logDeidentification failed (non-blocking):', error);
    // IMPORTANT: no throw
  }
}
```

---

## 3. Analytics: Dedupe efectivo (StrictMode fix)

### Problema
React 18 StrictMode ejecutaba `useEffect` dos veces en dev, causando duplicación de eventos:
- `pilot_session_started` aparecía 2 veces
- `workflow_session_started` aparecía 2 veces

### Solución
- **Helper `trackOnce`**: idempotente tracking con `useRef<Set<string>>`
- **Protección doble**: `useEffect` completo + evento interno
- **Keys únicas**: basadas en `patientId`, `visitType`, `workflowType`

### Archivos modificados
- `src/pages/ProfessionalWorkflowPage.tsx`

### Cambios clave
```typescript
// ✅ STRICTMODE FIX: Idempotent tracking to prevent duplicate events in dev
const trackedOnceRef = useRef<Set<string>>(new Set());
const trackOnce = useCallback((key: string, fn: () => void | Promise<void>) => {
  if (trackedOnceRef.current.has(key)) return;
  trackedOnceRef.current.add(key); // Mark as tracked BEFORE executing (synchronous)
  fn(); // Execute async function (fire and forget)
}, []);

// En el useEffect:
trackOnce(`pilot_session_started_effect:${sessionTrackingKey}`, () => {
  // ... lógica de tracking
  trackOnce(`pilot_session_started:${patientId}:${trackingVisitType}`, () => {
    AnalyticsService.trackEvent('pilot_session_started', {...});
  });
});

// Para workflow_session_started:
trackOnce(`workflow_session_started:${patientId}:${workflowTypeForTracking}:${route.type}`, () => {
  trackWorkflowSessionStart(...);
});
```

---

## Validación

### Antes
- ❌ Crashes en `TranscriptArea` al pegar texto
- ❌ Warnings de audit undefined rompiendo flujo
- ❌ Eventos de analytics duplicados en dev

### Después
- ✅ Sin crashes en `TranscriptArea`
- ✅ Audit logging no bloquea el flujo
- ✅ Eventos de analytics aparecen una sola vez

### Logs de validación
```
✅ [ANALYTICS] Evento registrado: pilot_session_started (1 vez)
✅ [ANALYTICS] Evento registrado: workflow_session_started (1 vez)
✅ Sin crashes en consola
✅ Sin warnings de audit undefined
```

---

## Impacto

### Técnico
- **Resiliencia**: componentes más robustos ante edge cases
- **Performance**: cache de imports dinámicos reduce overhead
- **Debugging**: logs limpios en dev (sin duplicados)

### Producto
- **UX**: sin interrupciones por crashes
- **Confiabilidad**: flujo de de-identificación no se rompe
- **Métricas**: tracking preciso sin duplicados

---

## Notas

- Los logs de `useEffect` siguen duplicados en dev (normal en StrictMode)
- No son side-effects críticos, solo logs de debug
- En producción (sin StrictMode) no hay duplicación

---

## Archivos modificados

```
src/components/workflow/TranscriptArea.tsx
src/services/dataDeidentificationService.ts
src/pages/ProfessionalWorkflowPage.tsx
```

---

## Referencias

- React 18 StrictMode: https://react.dev/reference/react/StrictMode
- Event pooling (deprecated): https://legacy.reactjs.org/docs/legacy-event-pooling.html

---

**Fecha:** 2025-12-15  
**Autor:** Implementación (Dev A)  
**Base branch:** `canon/aidux-baseline-2025-12-15`

