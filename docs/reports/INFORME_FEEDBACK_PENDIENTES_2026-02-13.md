# Informe de feedback pendiente — AiDuxCare Pilot

**Fecha del informe:** 13 de febrero de 2026  
**Export usado:** `user_feedback_aiduxcare-v2-uat-dev_2026-02-13T08-26-07.json`  
**Total ítems pendientes:** 6  

---

## Resumen por severidad

| Severidad | Cantidad |
|-----------|----------|
| Crítico   | 0        |
| Alto      | 0        |
| Medio     | 3        |
| Bajo      | 3        |

## Resumen por tipo

| Tipo       | Cantidad |
|------------|----------|
| Bug        | 2        |
| Sugerencia | 4        |

---

## Ítems pendientes (ordenados por prioridad)

### 1. Medio — Sugerencia | Prioridad: 4.0

- **ID:** `g0gkw7PAR97VB5dOFAkt`
- **URL:** https://pilot.aiduxcare.com/workflow?type=initial&patientId=UAq8lyrtl3LnlkXsgohE
- **Tags:** ui-confusion, onboarding, analysis-step

**Descripción:**

> Despues del command center no tengo idea de que paciente estoy tratando, en todo el workflow se hace mención al paciente en tratamiento y esto confunde

---

### 2. Medio — Bug | Prioridad: 2.7

- **ID:** `g4IwSp2J864mviKnd4Ar`
- **URL:** https://pilot.aiduxcare.com/command-center
- **Tags:** onboarding

**Descripción:**

> hay que eliminar los opcionales de el formulario de ongoing todos son necesarios para crear el baseline

---

### 3. Medio — Bug | Prioridad: 2.7

- **ID:** `0i0Tl9se80Lp541AIJAL`
- **URL:** https://pilot.aiduxcare.com/command-center
- **Tags:** onboarding

**Descripción:**

> volver a crear el spinner de carga para espera de baseline

---

### 4. Bajo — Sugerencia | Prioridad: 2.3

- **ID:** `hq7ezKxBeF469uVTThUu`
- **URL:** https://pilot.aiduxcare.com/workflow?type=initial&patientId=2XJ7xmyZpYwKO5L19zBa
- **Tags:** ui-confusion, onboarding, analysis-step

**Descripción:**

> si uno quisiera salirse de la aplicación en cualquier momento, no se puede el unico log out esta en command center, podemos poner un pequeño boton arriba a la derecha

---

### 5. Bajo — Sugerencia | Prioridad: 2.3

- **ID:** `OEJwWDJOg3b3vVyq5zLS`
- **URL:** https://pilot.aiduxcare.com/workflow?type=initial&patientId=2XJ7xmyZpYwKO5L19zBa
- **Tags:** ui-confusion, onboarding, analysis-step

**Descripción:**

> sería bueno incorporar el titulo del profesional PT. Mauricio Sobarzo, es un area de trabajo formal y debemos tratarlos como tal (luego ocupamos el acrónimo del los profesionales respectivos)

---

### 6. Bajo — Sugerencia | Prioridad: 0.8

- **ID:** `JfCq4oAQDOPfvrVsqyHL`
- **URL:** https://pilot.aiduxcare.com/command-center
- **Tags:** ui-confusion, onboarding

**Descripción:**

> la barra que selecciona pacientes cuesta seleccionarlo el area activa es pequeña y suele devolverse al buscador una vez uno apreta el boton, como si se apretara fuera del area linkeada

---

## Acciones recomendadas

| Prioridad | Acción sugerida |
|-----------|-----------------|
| 1 | Mejorar visibilidad del paciente actual en el workflow (header, breadcrumb) |
| 2 | Revisar campos opcionales en formulario OngoingPatientIntakeModal |
| 3 | Restaurar o implementar spinner de carga al crear baseline |
| 4 | Evaluar botón de logout global en header (visible en workflow) |
| 5 | Mostrar título profesional (PT. Nombre) en área de trabajo |
| 6 | Aumentar área clickeable de la barra de selección de pacientes |

---

*Generado automáticamente. Para actualizar: `node scripts/export-user-feedback.cjs --csv --unresolved-only`*
