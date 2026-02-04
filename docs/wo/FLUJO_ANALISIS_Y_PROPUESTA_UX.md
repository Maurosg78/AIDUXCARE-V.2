# Análisis del flujo Command Center y propuesta de diseño más coherente

**Objetivo:** Reducir fricción y errores del usuario (incl. uso con asistentes) mediante un flujo único, predecible y fácil de explicar.

---

## 1. Flujo actual (resumen)

| Paso | Dónde | Qué pasa |
|------|--------|----------|
| 1 | Login | Usuario entra a la app. |
| 2 | Command Center | Arriba: "Today's Patients" (empty: "Start in-clinic session now"). Abajo: "Work with Patients" con 3 tarjetas si no hay paciente. |
| 3 | "Start in-clinic session now" | Scroll al panel + **abre modal** "Seleccionar o crear paciente". |
| 4 | Modal | Usuario **elige paciente existente** o "Create New Patient". |
| 5a | Si eligió existente | Modal se cierra, queda **paciente seleccionado** en el panel. Usuario debe **bajar la vista** y hacer clic en **una de las 3 acciones**: Start Initial Assessment, Start Follow-up u Ongoing first time. |
| 5b | Si eligió Create New | Se cierra modal y abre **Create Patient**; al guardar puede ir a workflow o quedar paciente seleccionado (según tipo). |
| 6 | Panel sin paciente | **Tres tarjetas con comportamientos distintos:** Tarjeta 1 = botón que abre Create Patient. Tarjeta 2 = búsqueda **inline** + lista de pacientes. Tarjeta 3 = botón que abre modal (elegir o crear) y luego formulario Ongoing. |

---

## 2. Problemas detectados (por qué genera errores)

1. **Dos mentalidades en una sola pantalla**  
   - "Quiero empezar ya" → CTA → modal.  
   - "Quiero hacer un Initial / un Follow-up / un Ongoing" → tarjetas.  
   El mismo objetivo (empezar una sesión) se resuelve con **dos flujos distintos** y **tres patrones de interacción** (botón→formulario, búsqueda inline, botón→modal→formulario). Difícil de recordar y de explicar (p. ej. a ChatGPT o a un nuevo usuario).

2. **Después del modal no hay “siguiente paso” obvio**  
   Si el usuario abre "Start in-clinic session now" y elige un paciente, el modal se cierra y abajo aparecen 3 botones. La relación "acabo de elegir a este paciente → ahora elijo tipo de sesión" no está explícita en un solo lugar; depende de que mire el panel correcto.

3. **Las 3 tarjetas no son “3 alternativas del mismo nivel”**  
   - Tarjeta 1: solo "crear paciente" (no preguntas tipo de sesión después en el mismo flujo).  
   - Tarjeta 2: búsqueda en la misma tarjeta (patrón distinto al resto).  
   - Tarjeta 3: modal + intake (otro patrón).  
   Para el usuario final, "elegir una de las 3 alternativas" sería más claro si las 3 fueran **el mismo tipo de elección** (p. ej. siempre "tipo de sesión") y luego, según la elección, el sistema pide paciente (elegir o crear) o intake.

4. **WO-UX-01: ≤3 acciones**  
   Hoy: CTA (1) + seleccionar paciente en modal (2) + clic en Initial/Follow-up/Ongoing (3) = 3. Se cumple, pero el paso 3 está **fuera del modal**, lo que puede confundir cuando hay mucho contenido en pantalla.

---

## 3. Principio de diseño propuesto

- **Un solo funnel conceptual:** "Empezar sesión" = **1) Paciente** (elegir o crear) + **2) Tipo de sesión** (Initial / Follow-up / Ongoing first time) + **3) Ir** (workflow o intake y luego workflow).  
- **Misma lógica para “existe” y “no existe”:**  
  - Si existe → elegir paciente → elegir tipo → ir.  
  - Si no existe → crear paciente (con tipo ya elegido o elegido después) → si Ongoing, intake → ir.  
  Así "las 3 alternativas" son **los 3 tipos de sesión**, no 3 flujos distintos en la UI.

---

## 4. Propuesta A: Modal en dos pasos (sin tocar tarjetas)

**Idea:** El CTA "Start in-clinic session now" abre un **mismo modal en 2 pasos**.

- **Paso 1:** "Who is the patient?" → Búsqueda / lista de pacientes + opción "Create new patient". (Igual que hoy.)
- **Paso 2:** "What type of session?" → Tres botones: **Initial Assessment** | **Follow-up** | **Ongoing, first time in AiDuxCare**.

Comportamiento:

- Si en paso 1 eligió **paciente existente** → paso 2 muestra los 3 tipos; al elegir uno se cierra el modal y se va a workflow (o a Ongoing intake si eligió Ongoing).
- Si en paso 1 eligió **Create new patient** → se abre Create Patient; al guardar se vuelve al modal en **paso 2** con ese paciente ya “seleccionado” y se muestran los 3 tipos. Si el usuario ya eligió tipo al crear (p. ej. "Ongoing first time"), se puede pre-seleccionar ese tipo en paso 2 o ir directo a intake/workflow.

Ventajas: Un solo flujo para "empezar ya"; ≤3 acciones (CTA + paciente + tipo); las "3 alternativas" quedan explícitas en un solo lugar. Las tarjetas del panel pueden mantenerse como **atajos** (quien primero piensa "voy a hacer un Initial" puede bajar y usar la tarjeta 1).

---

## 5. Propuesta B: Tarjetas como “elige tipo primero”

**Idea:** Las 3 tarjetas significan **solo** "qué tipo de sesión quiero": Initial | Follow-up | Ongoing.

- **Tarjeta 1 – Initial:** Clic → "Select or create patient" (mismo modal paso 1). Si selecciona existente → "Start Initial Assessment" para ese paciente (o aviso si ya tiene baseline). Si crea nuevo → Create Patient (Initial) → workflow.
- **Tarjeta 2 – Follow-up:** Clic → mismo modal "Select patient" (solo existentes con baseline, o todos y validar en workflow). Elegir paciente → "Start Follow-up" → workflow.
- **Tarjeta 3 – Ongoing:** Clic → modal select/create → si existe, abrir intake; si crea, Create Patient (Ongoing) → intake → workflow.

Así las 3 tarjetas son **la misma decisión** (tipo de sesión); después el sistema pide paciente (y si aplica, intake). El CTA "Start in-clinic session now" podría abrir el mismo modal en 2 pasos (Propuesta A), de modo que "no sé aún el tipo" y "ya sé el tipo" convergen en la misma lógica.

---

## 6. Propuesta C: Un solo wizard (todo en modal)

**Idea:** Un único flujo en modal (o pantalla intermedia).

1. **Paso 1:** "What do you want to do?" → **Start with an existing patient** | **Add a new patient**.
2. **Si existing:** Búsqueda / lista → elegir paciente → "Session type?" → Initial | Follow-up | Ongoing first time → Ir.
3. **Si new:** "Session type for this new patient?" → Initial | Follow-up | Ongoing first time → Create Patient (con tipo) → si Ongoing, Intake → Ir.

Ventaja: Una sola historia para documentar y para que un asistente (p. ej. ChatGPT) explique. Desventaja: más cambios en UI y posiblemente más pasos para quien ya sabe "solo quiero Follow-up" (por eso las tarjetas como atajos en B siguen siendo útiles).

---

## 7. Resumen para conversar

| Tema | Pregunta / opción |
|------|--------------------|
| **Unificación** | ¿Prefieren que "Start in-clinic session now" lleve a un modal en 2 pasos (paciente → tipo) como en Propuesta A, para que “si existe solo se agenda” sea: elegir paciente → elegir tipo → ir, todo en el mismo sitio? |
| **Tarjetas** | ¿Las 3 tarjetas deben ser solo "elige tipo de sesión" y después siempre el mismo paso "seleccionar o crear paciente" (Propuesta B), o está bien mantener tarjeta 2 con búsqueda inline como atajo? |
| **"3 alternativas"** | ¿Confirmamos que las 3 alternativas son **Initial Assessment**, **Follow-up** y **Ongoing first time**, y que el diseño debe hacer explícita esa elección en un solo lugar (p. ej. paso 2 del modal)? |
| **Alcance** | ¿Avanzamos primero solo con Propuesta A (modal 2 pasos sin cambiar tarjetas) para reducir errores con mínimo cambio, o queremos ya alinear tarjetas a “solo tipo” (Propuesta B)? |

Con esto se puede revisar el flujograma actual y ajustarlo a la opción que elijan (A, B o C) y luego bajar a cambios concretos en pantallas y copy.
