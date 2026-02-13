# CUESTIONARIO ESTRATÉGICO CTO — RESPUESTAS BASADAS EN REPO

**Fecha:** 13 Feb 2026  
**Fuente:** Archivos .md y código del proyecto AiDuxCare  
**Nota:** Las preguntas marcadas con ⚠️ requieren input del founder (no están en el repo).

---

## SECCIÓN 1: RELACIÓN CON MaRS Y EXPECTATIVAS

### P1: ¿Qué tipo de reunión es esta con MaRS?
⚠️ **Requiere tu respuesta.** No hay referencias a MaRS, Misghana Kassa ni tipo de reunión en el repo.

---

### P2: ¿Has tenido conversaciones previas con Misghana Kassa?
⚠️ **Requiere tu respuesta.** No hay menciones de este contacto en el proyecto.

---

### P3: ¿Enviaste el pitch deck como solicitud propia o como respuesta a invitación/deadline?
⚠️ **Requiere tu respuesta.**

---

### P4: ¿En qué programa específico de MaRS te estás presentando?
⚠️ **Requiere tu respuesta.** No hay referencias a programas MaRS en el repo.

**Contexto del repo:** El análisis estratégico (`ANALISIS_ESTRATEGICO_MERCADO_2025.md`) posiciona AiDuxCare como:
- **Clinical Safety Platform** (anti-burnout, compliance-first)
- **Scope Expansion Ready** (diseñado para autoridades de diagnóstico por imágenes)
- **Life Sciences / Healthcare** por naturaleza del producto

---

### P5: ¿Cuál es la métrica más importante para MaRS Life Sciences?
**Desde el repo, lo que AiDuxCare puede demostrar hoy:**

| Métrica | Evidencia en repo |
|---------|-------------------|
| **Technical viability** | ✅ Sistema desplegado en pilot.aiduxcare.com; flujo consent E2E funcional; 6 WOs implementados (13 feb); bugs críticos resueltos 12 feb |
| **Market timing** | ✅ Ford scope expansion mid-2026; CPO Standards Aug 2025; burnout crisis documentada |
| **Unit economics** | ✅ TOKEN_PRICING_STRATEGY: $25-35 CAD base, ROI 13-40x en informes WSIB; Jane.app $30-45 CAD referencia |
| **Team strength** | ⚠️ Founder PT + developer documentado en varios docs; expertise regulatorio en banderas rojas |
| **Traction** | ⚠️ Usuarios piloto por confirmar en Firestore; Niagara Hub como socio piloto potencial |

---

## SECCIÓN 2: RECURSOS Y CAPACIDAD OPERACIONAL

### P6: ¿Tienes contactos directos con fisioterapeutas en Ontario?
⚠️ **Requiere tu respuesta.** No hay datos de contactos en el repo.

**Contexto:** La dirección postal del proyecto está en **Niagara Falls Innovation Hub** (4255 Queen St, Niagara Falls, ON). Hay documentación de piloto con Niagara (`INFORME_CTO_PRIORIDADES_PILOTO_NIAGARA.md`, `RESUMEN_CONSENT_DATOS_PHIPA.md` para socio piloto).

---

### P7: ¿Alguno conoce tu background técnico y estaría dispuesto a ser early adopter?
⚠️ **Requiere tu respuesta.**

---

### P8: ¿Cuántas horas puedes dedicar esta semana a soporte de usuarios piloto?
⚠️ **Requiere tu respuesta.**

---

### P9: ¿Otras obligaciones críticas esta semana?
⚠️ **Requiere tu respuesta.**

---

## SECCIÓN 3: RIESGO Y ALTERNATIVAS

### P10: Si un usuario piloto tiene experiencia negativa, ¿cómo impactaría tu estrategia?
⚠️ **Requiere tu respuesta.**

---

### P11: ¿Qué es más arriesgado?
**Desde el repo:** El análisis de debilidades (`ANALISIS_DEBILIDADES_AIDUXCARE.md`) señala:
- **Competitive moat:** Ventajas defensibles limitadas
- **Traction:** Gap de usuarios externos
- **Compliance:** Gaps documentados (consent ya implementado; HIPAA no auditado oficialmente)

El informe de banderas rojas (`INFORME_UNIFICADO_MEJORA_BANDERAS_ROJAS_FISIOTERAPIA.md`) indica moat competitivo de **24+ meses** en conocimiento especializado.

---

### P12: Plan B de funding si MaRS no avanza
**Evidencia en repo:**

| Opción | Evidencia |
|--------|-----------|
| **Niagara Hub Innovation Program** | ✅ Dirección postal: Niagara Falls Innovation Hub; `INFORME_CTO_PRIORIDADES_PILOTO_NIAGARA.md`; `RESUMEN_CONSENT_DATOS_PHIPA.md` para socio piloto |
| **Bootstrapping con clientes** | ✅ TOKEN_PRICING_STRATEGY: $25-55 CAD/mes; ROI 13-40x en WSIB |
| **Otros** | ⚠️ No documentado en repo |

---

## SECCIÓN 4: VISIÓN ESTRATÉGICA DEL PITCH

### P13: ¿Cuál es EL argumento más fuerte?
**Evidencia en docs para cada opción:**

| Argumento | Evidencia en repo |
|-----------|-------------------|
| "Usuarios reales pagando" | ⚠️ Tracción aún por validar |
| "Timing perfecto: Ford scope expansion en 6 meses" | ✅ `ANALISIS_ESTRATEGICO_MERCADO_2025.md`: Ford consultation Sept 2025 → mid-2026; CPO Aug 2025 |
| "Ventaja competitiva en compliance que Jane no puede replicar" | ✅ Jane: cross-border, sin consent built-in, agent positioning; AiDux: Canadian data, consent E2E, compliance-first |
| "Expertise único: PT + developer + regulatorio" | ✅ Banderas rojas basadas en evidencia; conocimiento CPO; arquitectura compliance |
| "Unit economics superiores a OpenAI/Anthropic" | ✅ Token-based; costos controlados; pricing $25-55 vs Jane $30-45 |

---

### P14: ¿Qué te preocupa más que MaRS pueda cuestionar?
**Gaps documentados en repo:**

- **"¿Por qué no tienen usuarios aún?"** — `ANALISIS_ESTRATEGICO_MERCADO_2025`: "Compliance gaps críticos (consent, review gate) - CRÍTICO antes de pilot" → **Consent ya implementado 12 feb 2026**
- **"¿Cómo saben que los fisios pagarán $29.90/mes?"** — TOKEN_PRICING_STRATEGY: Jane $30-45; ROI WSIB 13-40x; research en PRICING_RESEARCH_REQUIRED
- **"¿Qué pasa si Jane mejora compliance?"** — INFORME_UNIFICADO: moat 24+ meses; Jane sin consent built-in; ventana de oportunidad documentada
- **"¿Cómo ejecutar sin equipo técnico?"** — Founder técnico; sistema funcional; 6 WOs completados en sprint reciente

---

### P15: ¿Cómo te sientes presentándote?
⚠️ **Requiere tu respuesta.** El repo documenta ambos: 20 casos clínicos (validación banderas rojas) y capacidad de piloto (sistema listo).

---

## SECCIÓN 5: DECISIÓN TÁCTICA INMEDIATA

### P16: ¿Cuál opción resuena más?
⚠️ **Requiere tu respuesta.**

**Contexto técnico para decidir:**

| Factor | Estado en repo |
|--------|----------------|
| **6 WOs** | ✅ Implementados (WORK_ORDERS_AUTORIZADOS_INFORME_2026-02-13); build pasa |
| **Sistema estable** | ✅ Flujo consent E2E; bugs críticos resueltos 12 feb |
| **Demo listo** | ✅ CUESTIONARIO_PRE_PITCH: flujo completo documentado; puntos débiles: latencia Vertex, ad blocker |
| **Feedback pendiente** | 6 ítems (INFORME_FEEDBACK_PENDIENTES): 2 bugs, 4 sugerencias; severidad media/baja |
| **Gaps pre-pitch** | Consent/datos completados; integración facturación CPO pendiente; dashboard parcial |

---

## SECCIÓN 6: INFORMACIÓN ADICIONAL

### P17: ¿Qué materiales llevarás a MaRS?
**Disponibles en el repo:**

| Material | Estado |
|----------|--------|
| Demo en vivo | ✅ pilot.aiduxcare.com funcional |
| Video grabado | ⚠️ No documentado |
| Financial model | ⚠️ TOKEN_PRICING_STRATEGY existe; modelo detallado no |
| LOIs | ⚠️ No documentado |
| Competitive analysis (Jane) | ✅ ANALISIS_ESTRATEGICO_MERCADO_2025; TOKEN_PRICING_STRATEGY; PRICING_RESEARCH_REQUIRED |
| Legal compliance framework | ✅ INFORME_PHIPA_PIPEDA_COMPLIANCE; RESUMEN_CONSENT_DATOS_PHIPA; ANALISIS_LEGAL_FRAMEWORK_EXPANDED |

---

### P18: ¿Reunión presencial, virtual o híbrida?
⚠️ **Requiere tu respuesta.**

---

### P19: ¿Factor que el CTO no conoce?
⚠️ **Requiere tu respuesta.**

---

## RECOMENDACIÓN TÉCNICA (basada en repo)

### Sobre commit + deploy de los 6 WOs
**Recomendación: SÍ, proceder con deploy.**

- Los 6 WOs están implementados y el build pasa.
- Mejoran el sistema en todos los escenarios (A, B o C).
- No dependen de la decisión de piloto.
- Corrigen feedback real (nombre paciente en header, formulario ongoing, etc.).

### Talking points técnicos para el pitch (evidencia en repo)

1. **Compliance-first:** Consent verbal + digital E2E; PHIPA/PIPEDA; datos en Canadá (Montreal); audit trail.
2. **Ventaja vs Jane:** Canadian data sovereignty; consent built-in; CPO Standards; sin cross-border.
3. **Timing:** Ford scope expansion mid-2026; CPO Aug 2025; burnout crisis.
4. **Moat:** Base de conocimiento banderas rojas (evidencia científica); detección espondiloartropatías; 24+ meses ventaja.
5. **Unit economics:** Token-based; $25-55 CAD; ROI 13-40x en WSIB/MVA.
6. **Estado técnico:** Sistema desplegado; flujo completo funcional; 6 mejoras UX recientes.

### Preguntas que debes responder tú

Para que el CTO pueda dar recomendación sobre **timing de deploy**, **estrategia de piloto** y **prioridades 7 días**, necesitas completar:

- P1, P2, P3, P4 (MaRS)
- P6, P7, P8, P9 (recursos)
- P10, P11, P12 (riesgo)
- P15, P16 (decisión táctica)
- P18, P19 (info adicional)

---

**Próximo paso:** Responde las preguntas marcadas con ⚠️ y el CTO puede emitir la recomendación final.
