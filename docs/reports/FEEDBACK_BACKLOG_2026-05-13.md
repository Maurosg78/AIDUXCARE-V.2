# Feedback Backlog — 2026-05-13

**Export usado:** `scripts/exports/pending_aiduxcare-v2-uat-dev_2026-05-13T11-56-06.json`
**Pendientes:** 7
**Fuente:** Firestore `user_feedback`

## Pendientes

| Prioridad | ID | Tema | Lectura CTO |
|---|---|---|---|
| P0 | `tZ7UZevoEDWZe71bAyHh` | Email HEP perdido | Restaurar envío/visibilidad de terapia del día en follow-up. |
| P1 | `Q6SoxCsy8q254Gr9aAMF` | Información Vertex valiosa se pierde | Absorbido por épica Sócrates / memoria longitudinal. No guardar inferencias IA como verdad clínica. |
| P1 | `nzmUXDng3E3wK98WOH52` | Pruebas recomendadas inadecuadas | Requiere control de contexto clínico y umbrales antes de recomendar tests. |
| P1 | `V8yIlD0gnU0HO5Bi4OQf` | Preparar paciente ongoing sin iniciar sesión | Mejora Command Center: preparar trabajo sin abrir sesión clínica. |
| P1 | `3Igq6r9Ix7kcY5qVcZpo` | Acciones clínicas visibles en historial | Mejorar acceso a continuidad y acciones relevantes sin navegar sesiones previas. |
| P2 | `M2ZGxfV1dEthDQsjm4qj` | Botón SOAP flotante | Mejora de navegación para usuarios nuevos. |
| P2 | `Y9KqNkY0H6Smk3ZtaDnR` | Certificados mejorados | Mejorar redacción, uso de datos del fisio y formato imprimible. |

## Relación con Sócrates

Tres pendientes se conectan directamente con la nueva dirección de producto:

- `Q6SoxCsy8q254Gr9aAMF`: define el problema de pérdida de señales clínicas útiles fuera del SOAP.
- `nzmUXDng3E3wK98WOH52`: muestra el riesgo de recomendaciones sin contexto suficiente.
- `3Igq6r9Ix7kcY5qVcZpo`: pide continuidad clínica visible sin fricción.

La respuesta arquitectónica no debe ser "más prompt". Debe ser:

```text
ClinicalContextLedger -> Threshold rules -> Socratic candidate -> Human decision
```

## Orden sugerido

1. Cerrar `tZ7UZevoEDWZe71bAyHh` si el fix de HEP queda validado y desplegado.
2. Iniciar épica Sócrates con tipos y ledger, sin UI ni prompt nuevo.
3. Atacar `nzmUXDng3E3wK98WOH52` desde reglas de contexto, no desde ajustes aislados del prompt.
4. Mejorar continuidad visible en historial/Command Center.
5. Resolver mejoras UX de SOAP flotante y certificados.
