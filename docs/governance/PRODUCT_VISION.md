# PRODUCT_VISION.md — AiduxCare Clinical Intelligence Inc.

**Versión:** 1.0
**Fecha:** 2026-05-20
**Autor:** Mauricio Sobarzo (CEO/Founder)
**Gobernanza:** Este documento es la visión fundacional de producto.
Se actualiza cuando la visión evoluciona, no cuando cambia el código.
Toda decisión técnica en ENGINEERING.md debe ser compatible con los
principios aquí definidos.

---

> "AiduxCare acompaña al profesional con contexto clínico completo
> para documentar mejor, razonar con más claridad y decidir con mayor
> tranquilidad, sin reemplazar nunca su juicio clínico."

---

## 1. Propuesta de valor

AiduxCare es el compañero con más información y contexto al que puedes
acudir cuando tienes cuestionamientos respecto de la mejor elección
clínica. No te dice qué hacer — solo te muestra la foto completa.

Acompañamos al clínico con el contexto completo de cada paciente,
para que pueda decidir con más claridad, seguridad y tranquilidad.

---

## 2. Visión del profesional de salud

AiduxCare existe para liberar al fisioterapeuta — no para que vea más
pacientes, sino para que dé atención de mejor calidad.

Un fisio con AiduxCare tiene:
- Capacidad de cuestionar si lo que está haciendo es lo correcto,
  mediante Sócrates como compañero clínico
- Documentación que justifica su criterio clínico ante cualquier
  auditoría o reclamación
- Reducción de ambigüedad documental ante auditoría: si no aplicó
  el mejor tratamiento disponible, no es porque no le importara —
  es porque estaba fuera de su scope de conocimiento en ese momento,
  y eso queda documentado

El profesional de salud no puede multiplicarse después de la consulta.
AiduxCare es lo que queda cuando el fisio ya no está presente.

---

## 3. Visión del paciente

El paciente sigue existiendo después de la consulta. AiduxCare le
devuelve su historia clínica en su propio idioma.

Un paciente con AiduxCare tiene:
- Comprensión real de qué se le hizo, por qué, y cómo evolucionó
- Su historia clínica disponible para compartir con cualquier
  profesional de salud, sin tener que explicar desde cero
- Empoderamiento para entender su tratamiento — no para cuestionar
  al profesional, sino para ser un participante informado de su
  propia recuperación

El paciente no debería tener que explicar en términos que no conoce
lo que le hicieron, cuándo y por qué. AiduxCare le devuelve esa
historia en su propio idioma.

---

## 4. App del paciente — dirección estratégica

AiduxCare incluirá en el futuro una aplicación del lado del paciente,
concebida como repositorio personal de salud — no como canal de
comunicación con el fisio.

Principios no negociables en su diseño:

1. Los datos estructurados clínicos — notas SOAP, red flags,
   decisiones — viven en servidores AiduxCare con los mismos
   controles de RGPD/PHIPA que el resto del sistema.

2. Los medios crudos — videos y fotos de ejercicios — viven en el
   dispositivo del paciente. AiduxCare no retiene ni procesa
   imágenes ni videos del paciente en sus servidores.

3. El fisio usa el teléfono del paciente para grabar ejercicios
   directamente en su app, vinculados a la sesión del día.

4. El paciente puede compartir su historial con cualquier profesional
   de salud, en cualquier formato, en cualquier momento. AiduxCare
   no retiene ni controla esa información.

5. El mecanismo de retención es orgánico y honesto: el paciente
   querrá tener todo su historial en un solo lugar. La única forma
   de lograrlo es continuar con el mismo fisio o que el otro
   profesional también use AiduxCare.

Estado: dirección estratégica validada. Implementación pendiente de
completar el piloto actual. No se toca código hasta que el piloto
esté estable.

---

## 5. Interoperabilidad — decisión de arquitectura FHIR

AiduxCare aspira a ser el Personal Health Record del paciente.

Esto requiere compatibilidad con FHIR R4 como estándar de
interoperabilidad clínica. No es un compromiso de implementación
inmediata — es una decisión de arquitectura que debe tomarse antes
de que el modelo de datos de Firestore escale más.

La arquitectura actual de Firestore es compatible con FHIR si se
diseña correctamente desde ahora. Será sustancialmente más simple
si se aborda antes de que el volumen de datos clínicos crezca.

Recursos FHIR relevantes para AiduxCare:
- Patient, Encounter, Observation, CarePlan, Condition

Pendiente: spike de arquitectura para evaluar compatibilidad del
modelo de datos actual con FHIR R4 antes de Q4 2026.

---

## 6. Lo que AiduxCare no es

AiduxCare no es una herramienta de eficiencia para ver más pacientes.
AiduxCare no es un canal de comunicación entre fisio y paciente.
AiduxCare no diagnostica, no prescribe, no toma decisiones clínicas.
AiduxCare no retiene datos del paciente que no le pertenecen.
AiduxCare no compite con el juicio clínico del profesional.

AiduxCare amplifica. Evidencia. Acompaña.

---

## 7. Control de versiones de este documento

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-05-20 | Versión inicial. Sesión estratégica CEO/CTO. |
