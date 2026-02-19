# Informe de feedback pendiente — AiDuxCare Pilot

**Fecha del informe:** 2026-02-17  
**Export usado:** `user_feedback_aiduxcare-v2-uat-dev_2026-02-17T12-33-27.json`  
**Proyecto:** aiduxcare-v2-uat-dev  
**Estado:** ⏳ Pendientes por resolver

---

## Resumen

| Severidad | Cantidad | Estado |
|-----------|----------|--------|
| Crítico   | 0 | — |
| Alto      | 0 | — |
| Medio     | 6 | 🟡 Por resolver |
| Bajo      | 0 | — |

**Total:** 6 ítems pendientes

---

## Ítems (ordenados por prioridad)

### 1. Medio — Sugerencia | ⏳ Pendiente

- **ID:** `yYYPcCr6boMRsvx1fCuM`
- **Descripción:** "las 5 posibilidades de Treatment modalities que tenemos hasta hoy debieran sumarse a in clinic treatment, los pacientes no tienen esas maquinas en casa"
- **URL:** /workflow?type=initial&patientId=tSiNqF9pWsOY5Mbc3KmW
- **Prioridad calculada:** 4
- **Tags:** ui-confusion, onboarding
- **Fecha:** —

**Solución propuesta (para CTO):** _[pendiente]_

---

### 2. Medio — Sugerencia | ⏳ Pendiente

- **ID:** `pb2twF9E4SotkWMKUQVA`
- **Descripción:** "sería muy bueno una descripción del test en el área de evaluación física, aunque sea pequeña pero orientativa en ingles CA"
- **URL:** /workflow?type=initial&patientId=NcXUM6UFQnSbQtmcoonm
- **Prioridad calculada:** 4
- **Tags:** ui-confusion, onboarding, evaluation-step
- **Fecha:** —

**Solución propuesta (para CTO):** _[pendiente]_

---

### 3. Medio — Sugerencia | ⏳ Pendiente

- **ID:** `Tu2TTTMZAL68X4AtR3gv`
- **Descripción:** "no es necesario regenerar el SOAP si el fisio justifica su terapia, solo debe quedar constancia de este (en advertencias de redflags SOAP)"
- **URL:** /workflow?type=initial&patientId=NcXUM6UFQnSbQtmcoonm
- **Prioridad calculada:** 4
- **Tags:** ui-confusion, onboarding
- **Fecha:** —

**Solución propuesta (para CTO):** _[pendiente]_

---

### 4. Medio — Pregunta | ⏳ Pendiente

- **ID:** `RPYKJoZTmCzHgYJMf0hQ`
- **Descripción:** "El texto minimo a leer en consetntimiento informado es solo si nos da permiso para grabar? porque el enviado por sms es harto más extenso"
- **URL:** /workflow?type=initial&patientId=NcXUM6UFQnSbQtmcoonm
- **Prioridad calculada:** 3.8
- **Tags:** ui-confusion, onboarding, analysis-step
- **Fecha:** —

**Solución propuesta (para CTO):** _[pendiente]_

---

### 5. Medio — Sugerencia | ⏳ Pendiente

- **ID:** `FhLKmK5xn64NX8nYbiut`
- **Descripción:** "Ongoing podría dar la posibilidad de hacer capturas de pantalla (que no se guarden) pero que nos permita rapidamente organizar la info desde las capturas y no ir cuadro por cuadro rellenando"
- **URL:** /command-center
- **Prioridad calculada:** 2.5
- **Tags:** ui-confusion, onboarding
- **Fecha:** —

**Solución propuesta (para CTO):** _[pendiente]_

---

### 6. Medio — Sugerencia | ⏳ Pendiente

- **ID:** `37IDkw4PY3CiKQChRoPC`
- **Descripción:** "la advertencia de redflag debiera quedar registrada en antes de hacer evaluación fisica y si acepta ahpi no debiera aparecer en la generación de SOAP, en el area de redflags debiera haber un checkbox …"
- **URL:** /workflow?type=initial&patientId=tSiNqF9pWsOY5Mbc3KmW
- **Prioridad calculada:** 4
- **Tags:** ui-confusion, onboarding
- **Fecha:** —

**Solución propuesta (para CTO):** _[pendiente]_

---

## Estrategia de trabajo (para CTO)

### Priorización
1. **Crítico/Alto** → Sprint actual (bloquean workflow o experiencia)
2. **Medio** → Próximo sprint (mejoras importantes)
3. **Bajo** → Backlog (cuando haya capacidad)

### Flujo de resolución
| Paso | Acción | Herramienta |
|------|--------|-------------|
| 1 | Revisar ítem | App `/feedback-review` (admin) |
| 2 | Anotar solución propuesta | Firestore o este informe |
| 3 | Crear WO/ticket | Repo o Jira |
| 4 | Implementar fix | Branch + PR |
| 5 | Marcar resuelto | `node scripts/mark-feedback-resolved.cjs <id>` |

### Comandos útiles
```bash
# Exportar pendientes + generar este informe
node scripts/export-user-feedback.cjs --unresolved-only --report --csv

# Marcar como resuelto (uno o varios)
node scripts/mark-feedback-resolved.cjs <id1> <id2>
```

---

## Próximos pasos

1. Revisar cada ítem en la app: `/feedback-review` (requiere admin)
2. Anotar solución propuesta en el informe o en Firestore
3. Crear WOs/tickets para implementación
4. Marcar como resuelto cuando se implemente: `node scripts/mark-feedback-resolved.cjs <id>`

---

*Generado por scripts/export-user-feedback.cjs --unresolved-only --report*
