# Orientación backlog: P2 (Today's list → Firestore) y P3 (&apos; en TodayPatientsPanel)

**Contexto:** WO-INTERRUPTED-001 cerrado (84f76c1). CTO solicitó orientación para las próximas prioridades.

---

## P2 — Today's patient list: migrar de localStorage a Firestore

### Objetivo
La lista "Today's patients" (quick list por fecha) persiste solo en **localStorage**. Debe migrarse a **Firestore** para que sobreviva hard-refresh o borrado de datos del navegador, hasta que el usuario elimine ítems o complete la sesión.

### Estado actual
- **Clave:** `commandCenter_todayList_${userId}_${toLocalDateKey(date)}` (ej. `commandCenter_todayList_uid_2026-03-08`).
- **Dónde:** `CommandCenterPageSprint3.tsx`:
  - **Lectura:** `useEffect` que hace `localStorage.getItem(key)` y `JSON.parse`, luego merge con `inProgressSessions.data` y marca "done" desde `getAndClearSessionCompleted()`.
  - **Escritura:** `useEffect` que hace `localStorage.setItem(key, JSON.stringify(todayQuickList))` cuando cambia `todayQuickList` (con `skipNextSaveRef` para no guardar en el mismo tick del load).
- **Modelo:** `TodayQuickItem[]` — `{ patientId, patientName, sessionType, status?: 'pending' | 'done' | 'incomplete' }`.
- **Complemento:** `todayListSessionStorage.ts` usa **sessionStorage** solo para "session completed" (marcar ítem como done al volver del workflow); eso puede seguir en sessionStorage o pasarse también a Firestore según diseño.

### Enfoque recomendado

1. **Colección Firestore**
   - Opción A: subcolección por usuario y fecha, ej. `users/{userId}/todayLists/{dateKey}` (documento por fecha, campo `items: TodayQuickItem[]`).
   - Opción B: colección global `todayLists` con doc id `{userId}_{dateKey}` y mismo payload.
   - Elegir una y ser consistente con el resto del proyecto (ej. si ya hay `users/{uid}/...` para preferencias, usar A).

2. **Servicio**
   - Crear (o extender) un servicio, ej. `todayListService.ts`:
     - `getTodayList(userId: string, date: Date): Promise<TodayQuickItem[]>`
     - `saveTodayList(userId: string, date: Date, items: TodayQuickItem[]): Promise<void>`
   - Usar `getDoc`/`setDoc` con merge para no pisar otros campos si en el futuro se añaden más.

3. **CommandCenterPageSprint3**
   - Sustituir la **lectura** de localStorage por una llamada a `getTodayList(userId, selectedDate)` (con estado de loading si se desea).
   - Sustituir la **escritura** en el `useEffect` que persiste por `saveTodayList(userId, selectedDate, todayQuickList)` (debounce opcional para no escribir en cada keystroke si en el futuro hay más edición).
   - Mantener la lógica de merge con `inProgressSessions.data` y de "session completed" (se puede seguir leyendo `getAndClearSessionCompleted()` desde sessionStorage y aplicando sobre la lista ya cargada desde Firestore).

4. **Migración one-time (opcional)**
   - Al cargar, si Firestore no tiene datos para esa fecha, hacer una lectura de localStorage con la clave antigua; si hay datos, guardarlos en Firestore y (opcional) borrar de localStorage para no duplicar.

5. **Reglas de seguridad**
   - Asegurar que el usuario solo pueda leer/escribir sus propios `todayLists` (por `userId` en path o en el documento).

### Archivos a tocar
- Nuevo (o existente): `src/services/todayListService.ts` (o bajo `features/command-center/`).
- `src/features/command-center/CommandCenterPageSprint3.tsx`: reemplazar get/set localStorage por el servicio.
- Firestore: reglas para la nueva colección/documento.

### Criterios de aceptación
- Lista "Today's patients" se carga desde Firestore al abrir Command Center.
- Añadir/quitar/marcar done actualiza Firestore.
- Hard-refresh o "Clear site data" no borra la lista (sigue en Firestore).
- El usuario puede seguir eliminando ítems o completando sesiones como hoy; la lista solo se limpia cuando el usuario lo hace explícitamente o cuando se define política de expiración (ej. por fecha).

---

## P3 (minor) — &apos; literal en TodayPatientsPanel

### Objetivo
Comprobar si queda algún `&apos;` (o `&quot;`) renderizando como texto literal en `TodayPatientsPanel.tsx` tras el fix anterior.

### Estado actual
- Búsqueda en `TodayPatientsPanel.tsx`: **no** se encontraron ocurrencias de `&apos;` ni `&quot;` en el archivo.
- El fix previo ya sustituyó en ese componente cadenas como `it's`, `won't`, comillas tipográficas, etc.

### Acción
- **Verificación rápida:** `rg "&apos;|&quot;" src/features/command-center/components/TodayPatientsPanel.tsx` (o revisar manualmente strings que vengan de API/DB y se rendericen en el panel).
- Si aparece algún literal (p. ej. en `patientName` que venga de Firestore ya escapado), normalizar antes de mostrar: por ejemplo `patientName.replace(/&apos;/g, "'").replace(/&quot;/g, '"')` en el render, o corregir en origen.
- Si no hay ninguno, cerrar P3 como "verificado, sin cambios".

---

## Resumen

| Prioridad | Tarea | Esfuerzo estimado | Dependencias |
|-----------|--------|-------------------|--------------|
| P2 | Today's list → Firestore (servicio + CommandCenter + reglas + migración opcional) | 1–2 días | Firestore, auth (userId) |
| P3 | Verificar y corregir &apos; en TodayPatientsPanel si queda alguno | < 1 h | Ninguna |

Documento de cierre formal WO-INTERRUPTED-001 y due diligence: `docs/reports/INFORME-RESUME-TRANSCRIPT-2026-03.md`.
