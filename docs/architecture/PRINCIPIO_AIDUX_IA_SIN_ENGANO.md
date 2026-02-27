# PRINCIPIO AIDUX — IA SIN ENGAÑO

**Estado:** Aprobado (WO-REDFLAG-FOLLOWUP-006)  
**Alcance:** Follow-up y cualquier módulo clínico que dependa de un motor de IA externo.

---

## 1. Regla de oro

Si el modelo:

- no responde,
- responde vacío,
- rompe contrato JSON,
- hace timeout,
- o el proxy falla,

**la respuesta del sistema debe ser NULA.** No se simula contenido. No se rellenan huecos.

---

## 2. Comportamiento obligatorio

- **Backend:** Devolver forma explícita de error, por ejemplo:
  - `{ raw: '', soap: null, alerts: null, error: { type: 'AI_UNAVAILABLE', message: '...' } }`
- **UI:** Mostrar mensaje claro y trazable:
  - *"La generación automática no está disponible en este momento. No se ha producido ningún contenido por IA."*
- **No se genera:** SOAP parcial, red flags simuladas, texto por heurística, fallbacks clínicos ni plantillas automáticas.
- **Sí se permite:** Escribir manualmente, reintentar, y (en desarrollo) ver el error técnico.

---

## 3. Por qué es correcto

Un fallback clínico “inteligente” puede inducir a error, ocultar fallos sistémicos, generar falsa confianza y complicar la responsabilidad profesional. Un sistema médico serio: **si falla → lo dice. No inventa.**

---

## 4. Consecuencia de arquitectura

El producto deja de ser “IA que intenta arreglarse sola” y pasa a ser **infraestructura clínica que depende de un motor externo, pero no lo encubre.** Transparencia total = ética, profesionalidad y protección legal.
