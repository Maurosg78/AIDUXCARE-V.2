# Informe CTO — Sesión estratégica y técnica 2026-05-27

**Estado:** Para distribución interna
**Tiempo de sesión:** ~4 horas
**Módulo de estudio:** 1 de 3 (salud digital / FHIR / interoperabilidad)

---

## Resumen ejecutivo

Sesión de alto rendimiento. Salieron decisiones estratégicas, trabajo técnico implementado, y el primer usuario real activado. Este informe registra todo para que el CTO pueda distribuir trabajo y cerrar ADR-010.

---

## 1. Entregables completados

### 1.1 Documentación estratégica

| Documento | Versión | Ubicación |
|---|---|---|
| INTEROPERABILITY_ARCHITECTURE.md | v1.2 | `docs/governance/` |
| INFORME_CTO_INTEROPERABILIDAD_FHIR | v1.0 | `docs/cto-briefings/` |
| ADR-010 en ENGINEERING.md | Actualizado | `ENGINEERING.md §2.2` |

**INTEROPERABILITY_ARCHITECTURE.md v1.2** incorpora:
- Propuesta de valor con paisaje competitivo verificado (Jane, Noterro, Cliniko, WebPT, Healthie, EMRFlow, SPRY)
- Posicionamiento: capa clínica inteligente, no EMR de fisio
- Los cuatro outputs clínicos que ningún PMS devuelve hoy estructurados
- Mecanismo SMART on FHIR patient-authorized para consumir de EMRs sin acuerdo comercial previo
- Soberanía de datos: tres zonas (publicada, write-back, interior protegido)
- Roadmap de tres versiones de integración
- Dictado multilingüe como diferenciador de adopción

**ADR-010** actualizado con:
- SMART on FHIR inbound (scopes, mecanismo, marco legal)
- Soberanía de datos — tres zonas
- Dictado multilingüe — normalización al idioma legal del mercado
- Referencia actualizada a v1.2

### 1.2 Código implementado — soporte portugués

**6 archivos modificados. TypeScript limpio.**

| Archivo | Cambio |
|---|---|
| `src/services/OpenAIWhisperService.ts` | `"pt"` añadido a `WhisperSupportedLanguage` y `ALLOWED_LANGUAGES`. Prompt menciona acentos portugueses europeos. |
| `src/core/prompts/marketLocales.ts` | Locale PT implementado (era stub). `headerInstructions` completo en pt-PT con marco legal RGPD / Lei de Bases da Saúde, Ordem dos Fisioterapeutas. |
| `src/components/workflow/TranscriptArea.tsx` | "Português" añadido al selector de idioma (ES pilot y CA). |
| `src/pages/ProfessionalWorkflowPage.tsx` | "Português (PT)" añadido al selector de idioma. |
| `src/hooks/useTranscript.ts` | `'pt' → 'pt-PT'` en Web Speech API fallback. |
| `src/components/workflow/AdditionalClinicalContextInput.tsx` | `'pt' → 'pt-PT'` en `getDictationSpeechLang`. |

**Comportamiento resultante:** El fisioterapeuta selecciona "Português" en el selector. Whisper transcribe con pista `pt` (mayor precisión). Claude/Vertex genera el SOAP en español (es-ES) porque el locale del mercado lo fuerza — independientemente del idioma de entrada.

### 1.3 Primer usuario real activado

Email de invitación enviado a primera fisioterapeuta (colega, Portugal, trabaja en España). Acceso de autoregistro habilitado. Sin pago por ahora — a cambio de feedback honesto sobre flujo real de consulta.

---

## 2. Decisiones estratégicas registradas

### 2.1 Modelo de negocio clarificado

- **Corto plazo (2026-2027):** SaaS directo a fisioterapeuta privado. €100-150/mes. Valor: tiempo ahorrado + calidad documental + memoria longitudinal acumulada.
- **Mediano plazo (2027-2028):** Herramienta de calidad clínica para departamentos. El SOAP con outcomes documentados genera evidencia de calidad para quien deriva.
- **Largo plazo (2028+):** Intercambio de datos estructurados con hospitales. Solo cuando haya evidencia clínica acumulada que lo justifique.

**El moat no es FHIR — es la inteligencia longitudinal que Sócrates acumula sesión a sesión y que hace que cambiar de plataforma cueste demasiado.**

### 2.2 Dictado multilingüe como diferenciador de adopción

España tiene >70.000 fisioterapeutas colegiados, proporción significativa de origen latinoamericano, portugués, rumano, árabe. El pitch:

> *"Dicta en el idioma en que piensas. AiduxCare escribe la ficha en el idioma legal del país donde ejerces."*

Cada idioma nuevo son 30 minutos de trabajo (añadir código en 4 archivos). Whisper soporta 99 idiomas. El SOAP siempre sale en el idioma del locale activo.

### 2.3 Sócrates no es organizador de datos del EMR

Aclaración crítica para comunicaciones externas: los grandes EMRs (Epic, Oracle, Dedalus) están construyendo IA para organizar datos que ya tienen. **Sócrates genera datos clínicos que el EMR nunca tuvo.** La consulta de fisio es una caja negra de 45 minutos para el EMR — AiduxCare genera lo que ocurrió dentro de esa caja como recursos FHIR estructurados.

### 2.4 Soberanía de datos — regla de decisión

> El partner recibe hechos clínicos del paciente, nunca el proceso que los generó.

AiduxCare es controlador de datos del episodio fisioterapéutico, no procesador del EMR del hospital. Esto debe estar en los términos de servicio antes de cualquier integración.

### 2.5 Compliance mínimo para piloto España

Paquete legal mínimo para vender legalmente a €19.90/mes:
- Opinión de calificación regulatoria (no dispositivo médico): €1.500-€4.000
- DPA con cada fisioterapeuta: €500-€2.000
- DPIA: €800-€3.000
- Política de privacidad + términos: €500-€1.000
- **Total: €3.300-€10.000 one-time**

El posicionamiento que mantiene el producto fuera del ámbito de dispositivo médico (€150K+ de certificación) es no-negociable: AiduxCare es herramienta de documentación. Sócrates organiza lo que el fisioterapeuta decidió — no diagnostica ni recomienda tratamiento.

---

## 3. Trabajo pendiente — distribución

### P0 — Esta semana

| Tarea | Responsable | Notas |
|---|---|---|
| Monitorear onboarding de primera usuaria | CEO/CTO | Resolver cualquier traba en el flujo de registro o consentimiento |
| Commit del soporte portugués | CTO | 6 archivos modificados, TypeScript limpio |

### P1 — Próximas 2 semanas

| Tarea | Responsable | Notas |
|---|---|---|
| Conectar detección automática del mercado PT | CTO | `getActiveLocale()` ya tiene hostname detection para `.pt.` — añadir env var `VITE_ENABLE_PT_PILOT` análogo al ES |
| Añadir rumano (`ro`) al pipeline de dictado | CTO | 30 min — mismo patrón que portugués |
| Añadir árabe (`ar`) al pipeline de dictado | CTO | 30 min — verificar soporte RTL en UI si es necesario |
| Obtener feedback estructurado de primera usuaria | CEO | Preguntas específicas: ¿consentimiento funciona en consulta real? ¿calidad SOAP suficiente para firmar? ¿qué falla? |

### P2 — Antes del piloto formal

| Tarea | Responsable | Notas |
|---|---|---|
| Contratar consultor regulatory affairs España | CEO | Opinión de calificación no-dispositivo-médico. Presupuesto: €1.500-€4.000 |
| DPA template con fisioterapeutas | CEO + abogado | AEPD tiene template público como base |
| DPIA | CEO + consultor privacidad | Obligatorio antes de procesar datos de pacientes en producción |
| SCCs con Anthropic y Google/Firebase | CTO | Revisar si los contratos actuales incluyen SCCs para transferencias fuera del EEA |

### P3 — Módulos 2 y 3 del curso (pendientes de contenido)

| Pregunta abierta | Relevancia |
|---|---|
| Regulación SaMD bajo MDR 2017/745 — clasificación exacta de AiduxCare | Determina si €5K o €150K de compliance |
| Proceso de certificación de apps en ecosistema Dedalus Spain | Partnership para Versión 3 del roadmap |
| Endpoints FHIR R4 de Ontario Health — proceso de acceso actual | Piloto Ontario |
| Clasificación EU AI Act — AiduxCare bajo Art. 6(3) | Documento de derogación antes de agosto 2026 |
| SNS Spain — programas de partnership para startups de salud digital | Vía de entrada a hospitales públicos |

---

## 4. Lo que NO se hace todavía

- SMART on FHIR outbound (write-back al EMR): Versión 3, requiere cliente enterprise concreto
- Integración real con ningún EMR: ninguna
- Certificación SaMD: no en scope hasta tener evidencia clínica del piloto
- Sócrates Modo 1.5 o superior: gate regulatorio bloqueado

---

*Informe generado al cierre de sesión. Referencia: `docs/governance/INTEROPERABILITY_ARCHITECTURE.md` v1.2, `ENGINEERING.md` ADR-010 actualizado.*
