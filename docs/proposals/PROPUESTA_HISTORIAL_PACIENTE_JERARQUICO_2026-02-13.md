# Propuesta: Historial del paciente jerárquico y evaluación final

**Fecha:** 13 de febrero de 2026  
**Estado:** Pendiente de aprobación CTO y CEO  
**Contexto:** Feedback 53jMoePB + feedback reciente (13 feb) + práctica clínica en Ontario

---

## 1. Problema actual

### 1.1 Initial assessments sin relación

En la práctica canadiense, un paciente puede volver a consulta por **otra patología** (nuevo episodio). Cada episodio requiere su propia evaluación inicial. Hoy el historial muestra una lista plana de visitas (initial, follow-up, initial, follow-up…) sin agrupar por episodio, lo que genera:

- Confusión sobre qué follow-ups pertenecen a qué initial
- Dificultad para rastrear la evolución por episodio
- El símbolo "?" o "–" no refleja bien múltiples episodios

### 1.2 Evaluación final (discharge) en Canadá

En Ontario existe la **evaluación final** (discharge evaluation), equivalente en estructura a la inicial pero con propósito de cierre:

- Cierra el episodio de tratamiento
- Requiere informes de alta (discharge reports)
- Debería ofrecer generación de informes específicos junto al SOAP

Hoy AiDuxCare no modela explícitamente la evaluación final ni los informes de alta.

---

## 2. Propuesta de solución

### 2.1 Historial jerárquico: Initial como padre, Follow-ups como hijos

**Estructura propuesta:**

```
Episodio 1 (Initial Assessment — Patología A)
├── 1.1 Follow-up
├── 1.2 Follow-up
└── 1.3 Follow-up

Episodio 2 (Initial Assessment — Patología B)
├── 2.1 Follow-up
└── 2.2 Follow-up

Episodio 3 (Initial Assessment — Patología C)
└── (en curso)
```

**Beneficios:**

- Cada initial define un episodio
- Los follow-ups se muestran como sub-ítems (1.1, 1.2, 2.1, 2.2)
- Claridad sobre qué visitas pertenecen a qué episodio
- Facilita auditoría y reportes por episodio

### 2.2 Evaluación final (discharge) y informes de alta

**Modelo propuesto:**

- **Evaluación final** = tipo de visita que cierra un episodio
- Estructura similar a la initial (SOAP completo)
- Junto al SOAP, ofrecer:
  - Informe de alta (discharge report)
  - Formatos según requisitos Ontario (CPO, aseguradoras, etc.)

**Ubicación en el historial:**

```
Episodio 1
├── 1.1 Follow-up
├── 1.2 Follow-up
├── 1.3 Follow-up
└── 1.4 Final Evaluation (Discharge) — [Informes de alta]
```

---

## 3. Alcance técnico estimado

| Componente | Descripción | Esfuerzo est. |
|------------|-------------|---------------|
| **Modelo de datos** | Episodio como entidad; visitas vinculadas a episodio; tipo "discharge" | 2–3 días |
| **UI historial** | Vista jerárquica (initial → follow-ups anidados) | 2–3 días |
| **Numeración** | Lógica 1.1, 1.2, 2.1, 2.2 según episodio | 1 día |
| **Evaluación final** | Nuevo tipo de visita; flujo similar a initial | 2–3 días |
| **Informes de alta** | Templates y generación de discharge reports | 3–5 días |
| **Migración datos** | Asignar episodios a visitas existentes (heurística) | 1–2 días |

**Total estimado:** 11–17 días de desarrollo.

---

## 4. Dependencias y riesgos

| Dependencia | Impacto |
|-------------|---------|
| Definición de "episodio" en el modelo actual | Sin episodio explícito, la jerarquía requiere inferencia (p. ej. por baselineId, fechas) |
| Formatos de informes de alta en Ontario | Requiere validación con CPO/aseguradoras |
| Prioridad vs. otras mejoras (MaRS, piloto) | Puede posponerse post-pitch |

---

## 5. Fases sugeridas

### Fase 1 (MVP — post-MaRS)
- Historial jerárquico en UI (agrupación visual por episodio inferido)
- Numeración 1.1, 1.2 sin cambiar modelo de datos

### Fase 2
- Episodio como entidad en modelo de datos
- Evaluación final como tipo de visita

### Fase 3
- Informes de alta (discharge reports)
- Integración con formatos Ontario

---

## 6. Decisión solicitada

**Para CTO:**
- ¿Es viable la jerarquía con el modelo de datos actual o requiere cambios de schema?
- ¿Qué fase priorizar en el roadmap post-MaRS?

**Para CEO:**
- ¿Alinea con la estrategia de producto para Ontario?
- ¿Timing: pre-piloto, post-MaRS o post-funding?

---

## Anexo: Feedback de usuarios (historial y contexto paciente)

**Export usado:** `user_feedback_aiduxcare-v2-uat-dev_2026-02-13T14-40-24.json`  
**Total:** 81 ítems | Resueltos: 78 | Pendientes: 3

Feedback del formulario flotante que refuerza la necesidad del historial jerárquico y mejoras de contexto:

### Relacionado directamente con historial jerárquico

| ID | Severidad | Tipo | Descripción |
|----|-----------|------|-------------|
| `53jMoePBudigRHUcnrvM` | Media | Sugerencia | *"Si el paciente ya tiene un ongoing creado, no es necesario marcar en su historia el initial assessment como '?'; simplemente un guión u otro símbolo en verde para que se sepa que no es bloqueante. Sería importante resolver cómo se marcan y diferencian los distintos initial assessment para pacientes que vuelven a la consulta por otra patología."* — **URL:** `/patients/.../history` |
| `Zuw7dUjc9dEN8CQPGGkH` | Alta | Bug | *"Este paciente que acabo de ver, sus notas se han guardado correctamente; pero si abro un nuevo follow porque se ha sentido mal y me quiere volver a ver durante la tarde del mismo día, no me carga el último follow. Por tanto no está sirviendo como baseline del nuevo follow: tiene cargada la versión de la primera visita, no hidrata de la visita inmediatamente previa."* — **URL:** `/patients/.../history` |

### Relacionado con contexto del paciente en el workflow

| ID | Severidad | Tipo | Descripción |
|----|-----------|------|-------------|
| `g0gkw7PAR97VB5dOFAkt` | Media | Sugerencia | *"Después del command center no tengo idea de qué paciente estoy tratando; en todo el workflow se hace mención al paciente en tratamiento y esto confunde."* |
| `axQJUa4WPeTMszMSy8pW` | Media | Sugerencia | *"Necesitamos un lugar desde donde elegir a los pacientes para leer su historial."* |

### Otros feedback recientes (13 feb 2026)

| ID | Severidad | Tipo | Descripción |
|----|-----------|------|-------------|
| `hq7ezKxBeF469uVTThUu` | Baja | Sugerencia | Logout solo en command center; proponer botón arriba a la derecha |
| `g4IwSp2J864mviKnd4Ar` | Media | Bug | Formulario ongoing: eliminar opcionales, todos necesarios para baseline |
| `OEJwWDJOg3b3vVyq5zLS` | Baja | Sugerencia | Incorporar título profesional (PT., Dr., Chiropractor, etc.) |
| `JfCq4oAQDOPfvrVsqyHL` | Baja | Sugerencia | Área activa del selector de pacientes pequeña, se devuelve al buscador |
| `0i0Tl9se80Lp541AIJAL` | Media | Bug | Volver a crear spinner de carga para espera de baseline |

---

**Documento preparado para:** Revisión y aprobación  
**Próximo paso:** Reunión de decisión CTO + CEO
