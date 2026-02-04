# Secuencia lógica — Command Center (tres tarjetas)

## Objetivo

Que el fisioterapeuta decida **rápido** qué hacer: nueva evaluación, siguiente visita de alguien ya en tratamiento, o paciente en tratamiento pero **primera vez en AiDuxCare**.

---

## Dónde estoy

- **Arriba:** bloque "Today's Patients" → "Start in-clinic session now" = **empezar una sesión ya** (elegir o crear paciente; todas las posibilidades).
- **Abajo:** bloque "Work with Patients" con **tres tarjetas** cuando aún no hay paciente elegido.

---

## Las tres tarjetas (sin paciente seleccionado)

| Tarjeta | Cuándo usarla | Qué pasa al hacer clic |
|--------|----------------|-------------------------|
| **1. Start Initial Assessment** | Paciente **nuevo**, primera vez que lo ves (evaluación completa). | Abre formulario **Create New Patient**. Eliges "Initial Assessment" → creas paciente → entras al workflow de **evaluación inicial** (SOAP completo). |
| **2. Start Follow-up** | Paciente **ya en AiDux**, siguiente visita (ya tiene historial y baseline). | Buscas por apellido en la misma tarjeta, eliges paciente → entras al workflow de **follow-up** (con baseline cargado). |
| **3. Ongoing patient, first time in AiDuxCare** | Paciente **en tratamiento contigo** pero es la **primera vez** que lo documentas en AiDux (viene de papel u otro sistema). | Seleccionas paciente existente **o** creas uno nuevo con "Ongoing first time in AiDux". Luego completas el **formulario de intake** (baseline: motivo, plan, etc.) → se crea baseline → entras al workflow de **follow-up** ya hidratado. |

---

## Secuencia recomendada (la más lógica)

1. **Arriba:** Si quieres "empezar sesión ya" sin pensar en el tipo → clic en **"Start in-clinic session now"**.  
   Se abre el selector: **elegir paciente ya registrado** o **Create New Patient**.  
   Después de elegir o crear, abajo aparecen las mismas tres opciones (Initial / Follow-up / Ongoing) para ese paciente.

2. **Abajo (sin paciente):** Si primero quieres decidir **qué tipo de sesión** es:
   - **Initial Assessment** → solo crear nuevo + evaluación inicial.
   - **Follow-up** → solo buscar paciente ya en AiDux y seguir.
   - **Ongoing (first time in AiDux)** → elegir o crear paciente y luego llenar intake para baseline.

3. **Abajo (con paciente elegido):** Siempre ves las **tres opciones** para ese paciente (Initial, Follow-up, Ongoing) + Patient History. El flujo ya no pide "elegir tipo" otra vez; solo eliges la acción.

---

## Resumen en una frase

- **Arriba:** "Quiero empezar una sesión ya" → elijo o creo paciente → luego elijo tipo abajo.
- **Tarjeta 1:** "Paciente nuevo, evaluación completa" → crear paciente → workflow inicial.
- **Tarjeta 2:** "Paciente que ya está en AiDux, siguiente visita" → buscar → workflow follow-up.
- **Tarjeta 3:** "Paciente en tratamiento, primera vez en AiDux" → elegir o crear → intake (baseline) → workflow follow-up.

Así tienes **tres decisiones claras** y una **secuencia lógica** sin ambigüedad.
