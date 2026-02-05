# Flujo de feedback diario: rescate, urgencia/impacto y solución

Objetivo: rescatar cada día el feedback que entregan los usuarios (por ejemplo más de 5), categorizarlo por **urgencia e impacto** en el aplicativo, exponer el **problema** en pantalla para revisión y anotar la **solución** para que tú la implementes o la pases a implementar.

---

## 1. Rescate diario

- **Export (recomendado):** cada mañana o al cierre del día ejecuta:
  ```bash
  node scripts/export-user-feedback.cjs --csv --unresolved-only
  ```
  Así obtienes solo los pendientes en `scripts/exports/` (JSON + CSV).

- **En la app:** como admin, entra a **Feedback pendiente** (link en el header del Command Center) o a `/feedback-review`. Ahí ves en tiempo real todo el feedback **no resuelto**, ordenado por urgencia/impacto.

---

## 2. Categorización por urgencia e impacto

En Firestore y en la pantalla de revisión ya se usa:

- **Severidad:** critical, high, medium, low (lo elige quien envía el feedback).
- **Prioridad calculada:** `calculatedPriority` (1–10) según severidad, tipo (bug/suggestion), paso del workflow y contexto (ver `feedbackService.calculatePriority`).
- **Tags automáticos:** `autoTags` (ej. workflow-blocking, onboarding, analysis-step).

En **Feedback pendiente** la lista está ordenada por esa prioridad (mayor primero), y cada ítem muestra severidad, tipo y prioridad numérica para que identifiques rápido lo más urgente y de mayor impacto.

---

## 3. Exponer el problema en pantalla

En **Revisión de feedback** (`/feedback-review`):

- Se muestra para cada ítem:
  - **Problema / descripción:** el texto que envió el usuario (y contexto si es un error).
  - **URL** donde ocurrió.
  - **Severidad, tipo, prioridad** y tags.
  - **Solución propuesta:** campo editable donde tú (o el equipo) anotan la solución o los pasos para implementar.

Así el problema queda **expuesto en pantalla** para revisión y la solución queda anotada en el mismo lugar.

---

## 4. Flujo de solución e implementación

1. **Revisas** la lista en `/feedback-review` (ordenada por urgencia/impacto).
2. **Lees** el problema y el contexto (URL, tags).
3. **Decides** la solución (o la encuentras/documentas).
4. **Anotas** la solución en el campo "Solución propuesta" y guardas (queda guardada en Firestore en ese documento de feedback).
5. **Implementas** la solución (o la pasas a alguien que la implemente).
6. Cuando está resuelto en el producto, en la misma pantalla usas **"Marcar resuelto"** para ese ítem.

Todo lo que no sea de hoy puedes marcarlo como resuelto en bloque con el script (ver más abajo).

---

## 5. Marcar como resueltos todo lo que no sea de hoy

Para dejar solo el feedback de “hoy” como pendiente:

```bash
# 1) Export reciente (para tener IDs actuales)
node scripts/export-user-feedback.cjs

# 2) Generar lista de IDs que NO son de hoy (y marcarlos como resueltos)
node scripts/analyze-feedback-resolved.cjs scripts/exports/user_feedback_XXX.json --today 2026-02-05 --mark-all-not-today

# 3) Aplicar en Firestore
node scripts/mark-feedback-resolved.cjs --file scripts/exports/feedback-ids-to-mark-resolved.txt
```

Sustituye la fecha por la de “hoy” y el `XXX` por el nombre del archivo generado en el paso 1.

---

## 6. Resumen

| Paso | Dónde | Qué hacer |
|------|--------|-----------|
| Rescate diario | Export script o app | Export `--unresolved-only` o abrir **Feedback pendiente** |
| Urgencia/impacto | Pantalla `/feedback-review` | Lista ordenada por prioridad; severidad y tags visibles |
| Exponer problema | Pantalla `/feedback-review` | Descripción, URL y contexto por ítem |
| Solución | Pantalla `/feedback-review` | Campo "Solución propuesta" por ítem; guardar |
| Implementación | Fuera de la app | Tú implementas (o delegas) según la solución anotada |
| Cerrar ítem | Pantalla o script | "Marcar resuelto" en la app, o script para lotes |

La pantalla de revisión está en **/feedback-review** (y en el link "Feedback pendiente" del header del Command Center para usuarios con claim admin).
