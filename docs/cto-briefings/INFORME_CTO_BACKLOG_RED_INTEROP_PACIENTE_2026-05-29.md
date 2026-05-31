# Informe CTO — Backlog: Red de interoperabilidad inter-aplicativo con consentimiento del paciente

**Fecha:** 2026-05-29
**Estado:** BACKLOG — pendiente de investigación de viabilidad
**Iniciativa:** Propuesta conceptual de Mauricio Sobarzo
**Origen:** sesión estratégica 2026-05-29

---

## Resumen ejecutivo

Se registra como backlog una idea estratégica de largo alcance: construir una infraestructura que permita, con consentimiento explícito del paciente, que profesionales usando AiduxCare soliciten informes y actualizaciones de tratamientos previos almacenados en otras plataformas clínicas (ej. Jane.app, Cliniko, otras instancias de AiduxCare). Con el tiempo, AiduxCare se convertiría en un nodo de una red de datos clínicos federada donde el paciente controla qué ve quién.

Este informe no propone implementación. Propone investigar si tiene sentido técnico, regulatorio y estratégico.

---

## 1. La idea

### Caso de uso central

Un fisioterapeuta en AiduxCare recibe un paciente nuevo que fue tratado durante 6 meses en otra clínica que usa Jane.app. En lugar de pedir al paciente que recuerde o traiga un informe en papel:

1. El paciente autoriza desde AiduxCare la transferencia de sus datos
2. AiduxCare envía una solicitud estandarizada a Jane.app (u otra plataforma)
3. Los informes de tratamientos previos se importan
4. Sócrates los procesa como contexto longitudinal para la sesión actual

### Visión a largo plazo

Cualquier clínica o profesional que use AiduxCare puede consultar el historial de un paciente si ese paciente lo autoriza, independientemente de qué plataforma generó esos datos. AiduxCare pasa de ser una herramienta individual a ser un nodo de red.

---

## 2. Por qué esto puede ser estratégico

El moat actual de AiduxCare (tal como se definió en ADR-010 y INTEROPERABILITY_ARCHITECTURE.md v1.2) es la inteligencia longitudinal que Sócrates acumula sesión a sesión. Esa inteligencia hoy empieza desde cero con cada paciente nuevo.

Si AiduxCare puede importar historial previo de otras plataformas desde el primer contacto, Sócrates llega a la primera sesión con contexto — lo cual:
- Aumenta el valor percibido inmediato para el profesional
- Hace que el diferenciador longitudinal se active antes
- Crea un argumento de adopción que otras plataformas no pueden replicar sin FHIR nativo

---

## 3. Preguntas de viabilidad a investigar

### Técnica

| Pregunta | Impacto |
|---|---|
| ¿Jane.app expone una API FHIR pública? | Determina si hay integración sin acuerdo comercial |
| ¿SMART on FHIR cubre el caso inbound cross-plataforma? | Ya está en ADR-010 para EMRs — ¿aplica a PMS? |
| ¿La arquitectura de consentimiento actual admite consentimientos cross-platform? | Requeriría extensión del modelo de consentimiento |
| ¿Red AiduxCare-to-AiduxCare primero? | Más simple — mismo sistema, mismo modelo de datos |

### Regulatoria

| Jurisdicción | Marco | Punto crítico |
|---|---|---|
| Canadá | PHIPA | Portabilidad de datos clínicos entre proveedores |
| España | Ley 41/2002 | Acceso y cesión del historial clínico |
| UE | GDPR + EHDS | European Health Data Space — régimen de datos secundarios |

EHDS entró en vigor en 2025, pero su aplicación es progresiva. Elementos clave para uso primario no entran en efecto hasta marzo de 2029 (European Commission, EHDS timeline). Puede convertirse en marco habilitante, pero no debe asumirse como base operativa inmediata sin revisión legal y técnica específica.

### Negocio

- ¿Jane.app o Cliniko tienen un programa de partnerships o API pública?
- ¿Hay un modelo de revenue sharing si AiduxCare facilita la portabilidad?
- ¿El paciente percibe esto como valor o como riesgo de privacidad?

---

## 4. Secuencia lógica de investigación

**Fase 0 (sin código):** Investigación de factibilidad — 1-2 semanas de desk research.

1. Auditar si Jane.app, Cliniko, Noterro tienen APIs públicas o partnership APIs; FHIR R4 si existe, adaptador propietario si no
2. Revisar si SMART on FHIR patient-authorized (ya en ADR-010) cubre este caso
3. Leer el reglamento EHDS para entender si AiduxCare puede actuar como "punto de acceso autorizado"
4. Evaluar si el modelo de consentimiento de `src/core/consent/` es extensible a consentimientos cross-platform

Nota: Jane Developer Platform expone endpoints propios (no necesariamente FHIR R4 público). Cliniko tiene API REST/JSON pública sin evidencia de FHIR R4. El camino realista para integración de primera fase es:

```text
API propietaria → normalización interna → ClinicalContextLedger
```

No asumir SMART/FHIR directo. Investigar antes de comprometer arquitectura.

**Fase 1 (si la investigación es positiva):** Proof of concept AiduxCare-to-AiduxCare.

**Fase 2:** Integración con plataformas de terceros que soporten FHIR.

---

## 5. Relación con roadmap existente

Este backlog es coherente con las decisiones ya registradas:

- **ADR-010** define SMART on FHIR inbound como mecanismo para consumir de EMRs. Este caso extiende ese mecanismo a PMS y a otras instancias de AiduxCare.
- **INTEROPERABILITY_ARCHITECTURE.md v1.2** posiciona la capa 3 ("largo plazo: intercambio de datos estructurados") para 2028+. Esta idea vive en esa capa.
- **Sócrates** es el consumidor natural de estos datos — el contexto importado alimenta directamente la deliberación clínica.

No hay conflicto con ninguna decisión activa. Es un hito más ambicioso que lo planeado, no una contradicción.

---

## 6. Estado y dónde está guardado

**Estado actual:** BACKLOG — no asignado, sin fecha, sin sprint.

**Ubicación de este informe:**
```
docs/cto-briefings/INFORME_CTO_BACKLOG_RED_INTEROP_PACIENTE_2026-05-29.md
```

Cuando se quiera retomar, el punto de entrada es la Fase 0 de investigación descrita en la sección 4.

---

*Informe generado en sesión 2026-05-29. No requiere acción inmediata.*
