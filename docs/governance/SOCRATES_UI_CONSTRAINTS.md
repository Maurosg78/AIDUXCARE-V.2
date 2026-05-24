# Sócrates — Restricciones de Interfaz de Usuario

**Versión:** 1.0
**Fecha:** 2026-05-24
**Autor:** Mauricio Sobarzo, Nº colegiado 9657 COFCV
**Estado:** Activo. Aplica a todo diseño y código de Sócrates Modo 1.5 y Modo 2.
**Autoridad:** ENGINEERING.md §1.10 + Decisiones Tribunal Regulatorio Mayo 2026

---

> Todo diseño de pantalla de Sócrates debe pasar el test de este documento
> antes de implementación. No después. El código que viola estas restricciones
> no llega a `stable`.

---

## El test de autorización de UI

Antes de implementar cualquier pantalla de Sócrates, el CTO responde esta pregunta:

**"¿Puede un regulador AEMPS, Health Canada, o un abogado especialista en MDR
concluir razonablemente que esta pantalla está recomendando un tratamiento
específico para este paciente?"**

- Si la respuesta es **"sí"** → rediseñar antes de código
- Si la respuesta es **"posiblemente"** → rediseñar antes de código
- Si la respuesta es **"no, porque..."** → documentar el "porque" y proceder

---

## Sección 1 — Prohibiciones absolutas

Ninguna excepción sin actualización previa del `SAMD_CLASSIFICATION_MEMO.md`.

### 1.1 Lenguaje de ranking de tratamientos

```
PROHIBIDO:
✗ "Top 3 tratamientos para este paciente"
✗ "Tratamiento más recomendado"
✗ "Primera línea para este caso"
✗ "Mejor opción según evidencia"
✗ "Recomendado para [nombre de paciente]"
✗ Cualquier porcentaje de recomendación ("92% relevante para este caso")
✗ Cualquier score de recomendación sin metodología clínicamente validada y publicada
✗ Estrellas, ratings, o cualquier símbolo de evaluación aplicado a tratamientos
```

### 1.2 Ordering opaco

```
PROHIBIDO:
✗ Lista ordenada de tratamientos sin criterio visible de ordenamiento
✗ Números de posición (1, 2, 3) sin contexto de qué significa esa posición
✗ Barra de relevancia, gauge, termómetro, o cualquier visualización de
  "qué tan aplicable es" sin criterio explícito y verificable
✗ Ordenamiento que cambia entre sesiones sin que el sistema explique por qué cambió
```

### 1.3 Lenguaje que implica certeza clínica

```
PROHIBIDO:
✗ "Este paciente necesita..."
✗ "Se recomienda..."
✗ "El tratamiento indicado es..."
✗ "Según este caso, aplicar..."
✗ "Debe considerar..."
✗ "Es necesario..."
✗ Cualquier forma del imperativo clínico ("derive", "aplique", "prescriba")
```

### 1.4 Inferencias presentadas como hechos

```
PROHIBIDO:
✗ "El paciente muestra signos de [condición]"
✗ "Se detecta patrón de [estado psicosocial]"
✗ "El paciente presenta [hallazgo]" cuando el origen es inferencia IA
✗ Cualquier observación generada por IA que no tenga el label explícito
  de "observación no confirmada" o equivalente
✗ Mezclar en el mismo nivel visual hechos documentados e inferencias IA
```

### 1.5 Presentación de evidencia sin fuente verificable

```
PROHIBIDO:
✗ Resumen de evidencia sin referencia completa visible
✗ "Según la evidencia disponible..." sin citar qué evidencia
✗ Mostrar recomendación de tratamiento sin acceso al abstract o DOI del estudio
✗ Evidence card que no muestre: año, diseño del estudio, limitaciones declaradas
```

---

## Sección 2 — Formulación canónica permitida

### 2.1 Evidence cards con criterio explícito

```
PERMITIDO:
✓ "Evidencia encontrada para [diagnóstico documentado]"
✓ Cada card muestra: título, autores, año, journal, diseño del estudio,
  score PEDro si aplica, evaluación GRADE, limitaciones declaradas
✓ El criterio de ordenamiento es visible: "Ordenado por calidad metodológica
  (PEDro) + coincidencia con perfil documentado del paciente"
✓ Botón "¿Por qué aparece aquí?" que despliega:
  - Características del estudio que coinciden con el caso
  - Características que no coinciden (limitaciones de aplicación)
✓ Botón para acceder al abstract o DOI original
```

### 2.2 Transparencia de matching

```
PERMITIDO:
✓ "Este estudio incluye población de [rango edad] — el paciente tiene [edad documentada]"
✓ "El diagnóstico primario del estudio coincide con [diagnóstico en SOAP]"
✓ "El estudio excluye pacientes con [condición] — verificar si aplica"
✓ "Limitaciones de este estudio: [campo limitations del TypeScript]"
✓ "Este estudio tiene [N] participantes — considerar el tamaño de muestra"
```

### 2.3 Lenguaje socrático

```
PERMITIDO:
✓ "¿Quieres revisar la evidencia disponible para [diagnóstico]?"
✓ "Encontré [N] estudios aprobados para este diagnóstico. ¿Los reviso contigo?"
✓ "Este estudio tiene limitaciones en [área]. ¿Te es útil igualmente?"
✓ "Hay [N] publicaciones en la biblioteca para esta condición. [Revisar / Cerrar]"
✓ "[Noto que X ha ocurrido en 3 sesiones]. ¿Quieres que lo recuerde para la próxima?"
```

### 2.4 Preguntas socráticas (Modo 0 y Modo 2)

```
PERMITIDO:
✓ "Noto que [hecho documentado trazable]. ¿Quieres que recuerde ahondar en esto
  en la próxima sesión?"
✓ Acciones de respuesta: [Explorar ahora | Guardar para la próxima | No es relevante]
✗ NO mostrar preguntas socráticas sin poder responder "¿por qué me preguntas esto?"
  con trazabilidad a datos documentados en el sistema
```

### 2.5 Control activo del fisioterapeuta

```
PERMITIDO (y obligatorio en diseño):
✓ Re-ordenar la lista de evidence cards por criterio alternativo
  (fecha, PEDro score, tipo de estudio, tamaño de muestra)
✓ Descartar una evidence card de la sesión actual
✓ Marcar como "revisado" o "no aplica a este caso"
✓ Guardar una evidence card para revisar en otro momento
✓ Desactivar el Estrato 2 (señales psicosociales) para un paciente o globalmente
✓ Ignorar o posponer cualquier pregunta socrática sin penalización
```

---

## Sección 3 — Distinción visual obligatoria

La interfaz debe hacer visualmente distinguibles, en todo momento:

| Tipo de contenido | Cómo se muestra |
|---|---|
| Hecho documentado por el fisio | Sin label especial — es el registro clínico base |
| Transcripción / audio | Label: "De la sesión" |
| Inferencia IA no confirmada | Label visible: "Observación no confirmada" o equivalente |
| Evidencia bibliográfica | Label: fuente + año + diseño + PEDro/GRADE |
| Pregunta socrática | Formulación interrogativa + opción de rechazo siempre visible |

Nunca mezclar en el mismo nivel visual contenido de tipos distintos sin su label.

---

## Sección 4 — Proceso de aprobación de diseño

Todo wireframe o mockup de Sócrates Modo 1.5/2 pasa por este proceso antes de código:

1. Diseño inicial (cualquier herramienta)
2. CTO revisa contra Sección 1 (prohibiciones) y Sección 3 (distinción visual)
3. CTO documenta en el PR del diseño: "Revisado contra SOCRATES_UI_CONSTRAINTS.md v[X]
   — sin violaciones" o "Violaciones identificadas: [lista] — corregidas en [referencia]"
4. Solo si está documentada la revisión, el diseño avanza a implementación

---

## Historial de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-05-24 | Versión inicial completa. Prohibiciones absolutas y formulación canónica. |

---

*Documento interno de diseño y gobernanza. No contiene datos de pacientes.*
*Fuentes: MDCG 2019-11 · Health Canada CDS exclusion criteria · Decisiones Tribunal
Regulatorio AiduxCare Mayo 2026 · ENGINEERING.md §1.10*
