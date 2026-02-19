# Estrategia de trabajo — Feedback pendiente (CTO)

**Objetivo:** Resolver feedback del piloto de forma sistemática y priorizada.  
**Audiencia:** CTO, equipo de desarrollo.  
**Actualizado:** 2026-02-17

---

## 1. Rescate de datos (exportar pendientes)

Para obtener los feedback marcados como **pendientes** en Firestore:

```bash
# Desde la raíz del proyecto
node scripts/export-user-feedback.cjs --unresolved-only --report --csv
```

**Salidas:**
- `scripts/exports/user_feedback_<proyecto>_<fecha>.json` — datos crudos
- `scripts/exports/user_feedback_<proyecto>_<fecha>.csv` — para Excel/Sheets
- `docs/reports/INFORME_FEEDBACK_PENDIENTES_<YYYYMMDD>.md` — informe para CTO

**Credenciales:** `GOOGLE_APPLICATION_CREDENTIALS` o `gcloud auth application-default login`

---

## 2. Priorización

| Severidad | Acción | Ventana |
|-----------|--------|---------|
| **Crítico** | Sprint actual | Bloquea workflow o datos |
| **Alto** | Sprint actual / próximo | Impacto significativo en UX |
| **Medio** | Próximo sprint | Mejoras importantes |
| **Bajo** | Backlog | Cuando haya capacidad |

**Orden interno:** severidad → `calculatedPriority` → fecha (más reciente primero)

---

## 3. Flujo de resolución

```
[Firestore: user_feedback] 
    → Export (script)
    → Informe CTO
    → Revisión / solución propuesta
    → WO/ticket
    → Implementación
    → Marcar resuelto (script)
```

| Paso | Acción | Herramienta |
|------|--------|-------------|
| 1 | Exportar pendientes | `node scripts/export-user-feedback.cjs --unresolved-only --report` |
| 2 | Revisar ítem | App `/feedback-review` (requiere admin) |
| 3 | Anotar solución propuesta | Firestore o informe markdown |
| 4 | Crear WO/ticket | Repo (branch) o Jira |
| 5 | Implementar fix | PR + merge |
| 6 | Marcar resuelto | `node scripts/mark-feedback-resolved.cjs <id>` |

---

## 4. Comandos de referencia

```bash
# Exportar solo pendientes + informe CTO + CSV
node scripts/export-user-feedback.cjs --unresolved-only --report --csv

# Marcar uno o varios como resuelto
node scripts/mark-feedback-resolved.cjs abc123 xyz789

# Marcar desde archivo (un ID por línea)
node scripts/mark-feedback-resolved.cjs --file scripts/exports/feedback-ids-to-resolve.txt
```

---

## 5. Rutina recomendada

- **Semanal:** Ejecutar export + informe, revisar con CTO
- **Post-fix:** Marcar resuelto en Firestore vía script
- **Mensual:** Revisar backlog de severidad baja

---

## 6. Colección Firestore

- **Colección:** `user_feedback`
- **Campo resolución:** `resolved` (boolean), `resolvedAt`, `resolvedBy`, `solutionProposal`
- **Reglas:** Solo usuarios con claim `admin: true` pueden leer/actualizar
