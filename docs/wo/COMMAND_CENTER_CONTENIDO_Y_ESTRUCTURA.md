# Command Center — Contenido y estructura para el fisio

**Objetivo:** Que la página sea realmente un "centro de mando": útil para organizar el flujo de pacientes, sin quedar vacía. Conversación sobre qué mostrar y la idea de bloques que se rellenan al seleccionar un paciente.

---

## 1. Estructura actual (resumen)

| Bloque | Sin paciente | Con paciente |
|--------|----------------|--------------|
| **Today's Patients** | Empty state + CTA "Start in-clinic session now" (o lista del día cuando haya agenda) | Igual + posible highlight del seleccionado |
| **Work with Patients** | Un CTA: "Start in-clinic session" | Título "Work with [Nombre]" + Patient History + acciones (Initial, Follow-up, Ongoing, More) |
| **Work Queue** | Resumen: pending notes, missing consents, drafts | Igual (global) |

Cuando no hay paciente seleccionado, la zona central (Work with Patients) es solo el CTA; cuando hay paciente, aparece todo el contexto. Eso puede hacer que la página se sienta vacía o que "todo aparezca de golpe" al elegir alguien.

---

## 2. Idea: bloques fijos que se rellenan al elegir paciente

**Propuesta:** Mantener siempre la **misma estructura visual** en la zona central: varios bloques (cards/columnas) que existen siempre, pero cuyo **contenido** depende de si hay paciente o no.

- **Sin paciente:** Cada bloque muestra un **placeholder** (título + texto tipo "Select a patient to see…" o ícono/ilustración suave).
- **Con paciente:** Esos mismos bloques se **rellenan** con datos reales (resumen del paciente, última sesión, plan actual, pendientes de ese paciente, acciones).

Ventajas:
- La página no "salta" de vacía a llena; el fisio ve siempre el mismo layout.
- Queda claro qué tipo de información tendrá cuando elija un paciente.
- Se puede usar el mismo diseño en móvil/tablet (columnas que colapsan).

---

## 3. Bloques que podrían existir (propuesta para conversar)

No hace falta implementar todo de entrada; se puede priorizar.

| Bloque | Sin paciente | Con paciente | Notas |
|--------|----------------|--------------|--------|
| **Patient** | "Patient" + "Select a patient to see details" | Foto/initials, nombre, contacto (tel/email), última visita, chip "Initial" / "Follow-up" si aplica | Tarjeta de identidad rápida. |
| **Last session / Summary** | "Last session" + placeholder | Fecha última sesión, tipo (Initial/Follow-up), 1–2 líneas de resumen o "Chief complaint" / "Plan" del baseline | Contexto para retomar. |
| **Current focus / Plan** | "Current focus" + placeholder | Plan actual o "Next focus" (del baseline o última nota), en 1–2 líneas | Para organizar qué hacer hoy con este paciente. |
| **Pending for this patient** | "Pending" + placeholder | Pendientes de *este* paciente: nota sin cerrar, consentimiento faltante, etc. | No solo cola global, sino por paciente. |
| **Actions** | "Actions" + CTA "Start in-clinic session" | Botones: Initial Assessment, Follow-up, Ongoing (si aplica), View History, More | Lo que ya tienes, pero dentro de un bloque con nombre claro. |

Otras ideas opcionales:
- **Quick stats (global):** "Today: X patients · Y completed · Z pending notes" (cuando tengamos agenda).
- **Recent patients:** Lista corta (3–5) de "últimos vistos" con clic → seleccionar paciente y rellenar los bloques.
- **Work Queue:** Mantenerlo como bloque global debajo; si hay paciente seleccionado, se podría destacar "N items for this patient" si aplica.

---

## 4. Orden sugerido en la página (de arriba a abajo)

1. **Today's Patients** (agenda del día cuando exista; si no, empty state + CTA).
2. **Work with Patients** como **zona de bloques fijos**:
   - Fila 1: **Patient** (identidad) | **Last session / Summary** (contexto).
   - Fila 2: **Current focus / Plan** | **Pending for this patient**.
   - Fila 3: **Actions** (ancho completo o repartido).
   - Sin paciente: mismos bloques con placeholders y un CTA destacado en Actions ("Start in-clinic session").
3. **Work Queue** (cola global).
4. (Opcional) **Recent patients** o **Quick stats** al final.

Así el Command Center tiene siempre "campos" visibles; al seleccionar un paciente, esos campos se rellenan y la página gana sentido sin cambiar de estructura.

---

## 5. Preguntas para afinar

- ¿Qué bloques te parecen imprescindibles para el día a día (Patient, Last session, Current focus, Pending, Actions)?
- ¿Prefieres 2 columnas en desktop (Patient + Last session arriba, etc.) o 1 columna más larga?
- ¿"Recent patients" (últimos 3–5) lo quieres como lista clicable que rellena los bloques, o lo dejamos para más adelante?
- Cuando llegue la agenda: ¿Today's Patients debe ser solo lista de citas del día o también un mini-calendario / vista semana?

Cuando definamos qué bloques y en qué orden, se puede bajar a wireframes o a cambios concretos en `WorkWithPatientsPanel` (y un posible nuevo componente de "patient context blocks").
