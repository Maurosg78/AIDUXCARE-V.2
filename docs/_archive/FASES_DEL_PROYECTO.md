# Fases de Madurez de Testing y CI/CD – AiDuxCare V.2

Este documento describe las 4 fases de avance respecto al estado de los tests automáticos y la integración continua (CI/CD) en el proyecto. El objetivo es guiar al equipo para alcanzar un workflow de GitHub Actions completamente verde y confiable.

---

## Fase 1: Rojo Crítico (Descontrol de Errores)

- La mayoría de los tests fallan o ni siquiera corren.
- Existen errores de sintaxis, tipado, dependencias rotas o mocks incompletos.
- El workflow de GitHub Actions falla de forma global y no es confiable.
- No hay garantía de que el código funcione ni localmente ni en CI.

**Criterio de salida:**
- Se corrigen los errores más graves y al menos algunos tests comienzan a pasar.

---

## Fase 2: Amarillo (Recuperación Parcial)

- Una parte significativa de los tests ya pasa, pero aún hay fallos importantes.
- Los errores suelen ser de lógica, mocks desactualizados o dependencias mal configuradas.
- El workflow de GitHub Actions sigue fallando, pero ya muestra avances.
- El equipo puede identificar claramente los tests que fallan y priorizar su corrección.

**Criterio de salida:**
- La mayoría de los tests relevantes pasan y solo quedan fallos puntuales o menores.

---

## Fase 3: Naranja (Errores Menores y Limpieza)

- Casi todos los tests pasan; los fallos son menores (nombres, snapshots, detalles de mocks, etc.).
- El workflow de GitHub Actions puede fallar solo por detalles menores o warnings.
- El código es funcional y estable, pero falta pulir detalles para CI/CD perfecto.

**Criterio de salida:**
- Todos los tests pasan localmente y en CI, sin errores ni warnings críticos.

---

## Fase 4: Verde (CI/CD Perfecto)

- Todos los tests pasan localmente y en GitHub Actions.
- El workflow es completamente verde y confiable.
- Se puede hacer merge y deploy con confianza.
- El equipo puede enfocarse en nuevas features y refactorizaciones sin miedo a romper nada.

**Criterio de mantenimiento:**
- Cualquier nuevo fallo debe ser corregido antes de avanzar o hacer merge.

---

**Nota:** El objetivo es avanzar de Fase 1 a Fase 4 lo antes posible. Este documento debe actualizarse si cambian los criterios o el proceso de CI/CD del proyecto. 