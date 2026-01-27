# Modelo Clínico del Plan de Episodio (Canónico)

## 1. Propósito

Este documento define el **modelo clínico canónico** que regula cómo interactúan los **Episodios**, los **Planes** y las **notas SOAP** dentro de la plataforma AiDuxCare.

Es **agnóstico a la implementación**. No describe bases de datos, APIs, componentes de UI ni proveedores de IA. Define el **contrato clínico** que todas las capas técnicas deben respetar.

Los objetivos del modelo son:

* Reflejar la práctica real de la fisioterapia
* Reducir la carga cognitiva del profesional
* Garantizar trazabilidad y defensibilidad regulatoria
* Prevenir errores estructurales antes de llegar a producción

---

## 2. Principios No Negociables

1. **El Episodio es la unidad de cuidado.**
2. **El Plan pertenece al Episodio, no a notas SOAP individuales.**
3. **Las notas SOAP son actos clínicos asociados a una sesión.**
4. **Las sesiones de seguimiento ejecutan un Plan existente; no lo redefinen.**
5. **Solo el sistema, durante Initial Assessments y Reassessments, puede crear o actualizar el Plan activo generado por la plataforma.**
6. **El profesional sanitario licenciado es siempre la autoridad final.** Todo contenido generado por el sistema es editable y cada cambio manual debe quedar plenamente trazado.
7. **La reducción de carga cognitiva del clínico es un objetivo de producto de primer nivel.**
8. **La auditabilidad es una característica de seguridad clínica, no un añadido posterior.**

---

## 3. Tipos de Sesión y Expectativas Clínicas

La plataforma reconoce cuatro tipos canónicos de sesión. Cada uno tiene una intención clínica distinta y una relación específica con el Plan del Episodio.

| Tipo de Sesión              | S | O | A | P | Rol del Plan del Episodio | Rol del SOAP  | Valor Cognitivo        |
| --------------------------- | - | - | - | - | ------------------------- | ------------- | ---------------------- |
| **Evaluación Inicial**      | ✓ | ✓ | ✓ | ✓ | **CREA v1**               | Fundacional   | Define el roadmap      |
| **Seguimiento (Follow-up)** | ✓ | ⚠ | ⚠ | ✗ | **EJECUTA vN**            | Operacional   | Reduce carga cognitiva |
| **Reevaluación**            | ✓ | ✓ | ✓ | ✓ | **ACTUALIZA vN → vN+1**   | Recalibración | Ajusta el rumbo        |
| **Hospitalaria / Delegada** | ✓ | ⚠ | ✗ | ✗ | **REFERENCIA (externo)**  | Trazabilidad  | Documenta la ejecución |

**Leyenda**:

* ✓ = Obligatorio y completo
* ⚠ = Funcional / observacional, no necesariamente formal
* ✗ = No se genera en este tipo de sesión

---

## 4. Modelo del Plan de Episodio (Conceptual)

El **Plan del Episodio** representa la intención clínica longitudinal de un episodio de atención. Externaliza el razonamiento del profesional para que no tenga que ser recreado en cada sesión.

El Plan:

* Se **crea** durante la Evaluación Inicial
* Se **ejecuta** durante los seguimientos
* Se **actualiza o reemplaza** durante las Reevaluaciones
* Se **referencia** (pero no se posee) en contextos hospitalarios

### 4.1 Modelo Conceptual Mínimo

```ts
interface EpisodePlan {
  // Identidad
  episodeId: string;
  version: number;

  // Núcleo clínico
  diagnosticoFuncional: string;

  objetivos: {
    cortoPlazo: string[];
    largoPlazo: string[];
    criterioAlta: string;
  };

  // Roadmap terapéutico
  fases: {
    nombre: string;
    duracionEsperada: string;
    focoClinico: string[];
    criterioProgresion: string;
  }[];

  // Ciclo de vida
  estado: 'activo' | 'completado' | 'discontinuado';

  // Auditoría
  creadoEn: Date;
  creadoPorSessionId: string;
  revisadoEn?: Date;
  modificadoPorSessionId?: string;
}
```

Este modelo define **qué debe existir**, no cómo se almacena o presenta.

---

## 5. Reglas del Ciclo de Vida del Plan

1. **Creación**

   * Solo una Evaluación Inicial puede crear la primera versión del Plan del Episodio generado por el sistema.

2. **Ejecución**

   * Las sesiones de seguimiento deben referenciar el Plan activo.
   * Pueden registrar tolerancia, adherencia y micro-ajustes, pero no redefinir objetivos ni fases.

3. **Actualización**

   * Solo una Reevaluación puede actualizar o reemplazar el Plan activo.
   * Cada actualización genera una nueva versión.
   * Las versiones previas se archivan y permanecen inmutables.

4. **Referencia**

   * En contextos hospitalarios o delegados, la sesión puede referenciar un Plan externo o institucional.
   * Estas sesiones no crean ni modifican el Plan del Episodio.

5. **Inmutabilidad y trazabilidad**

   * Las versiones históricas del Plan nunca se modifican.
   * Toda modificación manual realizada por el profesional debe quedar registrada con trazabilidad completa.

---

## 6. Ejemplos Clínicos

### 6.1 Evaluación Inicial (Sesión 1)

**Intención clínica:** Establecer el contrato clínico del episodio.

* El SOAP incluye S/O/A/P completos
* El Plan define diagnóstico funcional, objetivos, fases y criterio de alta
* Episode.activePlan = v1

**Resultado:**

> El profesional no necesita volver a decidir *de qué trata el episodio* en sesiones posteriores.

---

### 6.2 Seguimiento (Sesiones 2–5)

**Intención clínica:** Ejecutar el Plan.

* El SOAP se centra en:

  * Evolución subjetiva desde la última sesión
  * Observaciones funcionales
* El Assessment puede ser implícito o heredado
* No se genera un Plan nuevo

**Responsabilidad del sistema:**

> Mostrar claramente la **fase activa y el foco de la sesión** para reducir la carga cognitiva.

---

### 6.3 Reevaluación (Mitad del episodio)

**Intención clínica:** Recalibrar la atención.

* El SOAP incluye reevaluación completa
* Las medidas objetivas se comparan con el baseline
* El Assessment se actualiza
* El Plan se modifica o reemplaza → nueva versión

**Resultado:**

> El roadmap del episodio se ajusta formalmente y se re-ancla.

---

### 6.4 Sesión Hospitalaria / Delegada

**Intención clínica:** Documentar la ejecución dentro de un plan de cuidados mayor.

* El SOAP documenta estado del paciente y respuesta a la sesión
* El Plan se referencia, no se posee
* El foco es la trazabilidad y la comunicación interdisciplinaria

---

## 7. Alcance y No-Objetivos

Este documento **no** define:

* Esquemas de base de datos
* Contratos de API
* Diseños de interfaz
* Facturación o consumo de tokens
* Diseño de prompts de IA
* Implementaciones de guards o validaciones

Todos esos elementos deben **conformarse a este modelo**, no redefinirlo.

---

## 8. Por Qué Este Modelo Importa

Al separar el **estado del Episodio** de la **documentación por sesión**, el sistema:

* Refleja el razonamiento clínico real
* Reduce esfuerzo innecesario del profesional
* Previene notas estructuralmente inválidas
* Habilita automatización segura
* Mantiene defensibilidad frente a reguladores y auditores

Este modelo es la base sobre la cual se construyen los guards context-aware, la UX clínica, los analytics y las funcionalidades de compliance.

---

**Estado:** Canónico – Versión 1.0
