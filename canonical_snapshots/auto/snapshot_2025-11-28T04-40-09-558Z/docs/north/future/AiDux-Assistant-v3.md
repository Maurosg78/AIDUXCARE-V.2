# AiDux Assistant v3 — Canonical Niagara Package

## 0. Prerrequisito

Avanzar solo cuando:

- AiDux Voice v1 esté 100% finalizado.
- Mauricio dé GO explícito.
- Branch limpio + `npm run lint` en verde.

---

## 1. Visión (CTO)

**AiDux Assistant = Clinical Informational Engine**

- No es un LLM generalista.
- Responde únicamente conocimiento fisioterapéutico regulado.
- Dominios permitidos: presets de modalidades, mecanismos, ROM norms, red flags, exercise safety, resúmenes legales.
- Lenguajes: inglés, español, francés.
- “Informa, no prescribe.”

---

## 2. Capacidad permitida

1. **Presets terapéuticos informativos**
   - Ejemplos: TENS HF 50–100 Hz / LF 2–10 Hz; Ultrasonido 1 MHz profundo, 3 MHz superficial, 1.0–1.5 W/cm² continuo; Shockwave 1.5–2.5 bar, 8–12 Hz; Tecar capacitivo vs resistivo.
   - Always append: “Ajustar según tolerancia y lineamientos regulatorios.”

2. **Consultas clínicas informativas**
   - Red flags, criterios de derivación, ROM normativo, mecanismos de modalidades.

3. **Documentos administrativos**
   - Resúmenes SOAP / carta neutra para médico.
   - Sin PHI sensible; tono legal neutral.

4. **Comandos operativos**
   - Cambiar modo live/dictation, detener transcripción, pedir resumen.

---

## 3. Prohibiciones absolutas

- Sin parámetros personalizados por paciente.
- Sin contraindicaciones médicas.
- Sin dosis exactas, intensidades, bar, joules, tiempo prescrito.
- Sin recomendaciones de “haz X”.
- Sin diagnóstico ni pronóstico médico.

---

## 4. Dual Safety Net

### Capa 1 — Intent mapper (frontend)

- Solo routea intents aprobados.
- Pregunta fuera de scope → respuesta: “Esa consulta excede el alcance clínico de AiDux…”

### Capa 2 — Prompt seguro (backend)

```
You are AiDux, a physiotherapy informational assistant inside a PHIPA/PIPEDA-compliant Canadian application.

You may ONLY provide:
- general modality presets (evidence-supported, typical ranges)
- functional ROM norms
- physical modality mechanisms
- general safety considerations
- red-flag and referral criteria
- non-prescriptive exercise safety cues
- administrative summaries (SOAP/legal letters)
- workflow assistance inside the app

You MUST:
- avoid patient-specific guidance
- avoid diagnosis or prognosis
- avoid prescriptions
- avoid doses, energy levels, bar values, joules, watts, schedules or intensities
- avoid medical contraindications
- avoid statement of “best modality” for a specific patient

Answer concisely. Always include:
“These are general physiotherapy guidelines.  
Adapt according to patient tolerance, provincial regulations and clinical judgment.  
This is not a prescription.”
```

---

## 5. UI final (persistente en workflow)

- Botón flotante (esquina inferior derecha).
- Estados: listo / escuchando / procesando / error.
- Panel lateral con historial y disclaimers visibles.
- Nunca obstruir contenido clínico.

---

## 6. Pitch Niagara (2 minutos)

1. **Hook**: “Co-piloto clínico seguro para fisioterapia canadiense.”
2. **Problema**: tiempo perdido, chatbots inseguros, brecha regulatoria.
3. **Solución**: asistente flotante tri-lingual, dominio limitado, dual safety net, resúmenes legales.
4. **Demo en vivo**:
   - Cambiar a dictado.
   - Preguntar presets de Tecar.
   - Consultar red flags.
   - Generar carta al médico.
   - Mostrar historial sin audio persistente.
5. **Impacto**: menos errores, compliance, diferenciador Niagara.
6. **Cierre**: “Potencia al fisio, fascina al auditor.”

---

## 7. Demo Script

1. Presentar botón AiDux, asegurar PHIPA compliance.
2. “Aidux, start dictation.” → confirma modo.
3. “Aidux, what presets are typical for interferential therapy on shoulder?” → respuesta neutral + disclaimer.
4. “Aidux, red flags for acute lumbar pain?” → bullet list.
5. “Aidux, prepare a referral letter.” → carta neutral.
6. Recordatorio: historial local, audio no almacenado.

---

## 8. Storyboard (video)

1. Vista UI + botón pulso.
2. Click → animación audio, subtítulos.
3. Panel abre con “Processing…”.
4. Respuesta + zoom en disclaimer.
5. Historial lateral.
6. Fisio copia texto al SOAP.
7. Cierre: “PHIPA/PIPEDA · EN/FR/ES · Niagara ready”.

---

## 9. Roadmap público

- **v3 (ahora)**: flotante, presets, red flags, ROM, cartas, tri-lingual.
- **v3.1**: wording editable, export CSV, sugerencias informativas.
- **v3.5**: citas a evidencia, pack offline, queue supervisión.
- **v4**: SDK EMR, analítica federada sin PHI, dashboard multi-clinic.

---

## 10. Rutas permitidas / prohibidas

### ✅ Permitir modificar
```
src/services/AiDuxVoiceService.ts
src/services/vertex-ai-service-firebase.ts
src/hooks/useAiDuxVoice.ts
src/hooks/useAiDuxAssistant.ts
src/components/AiDuxFloatingButton.tsx
src/components/AiDuxFloatingPanel.tsx
src/components/ClinicalInfoPanel.tsx
```

### ❌ Prohibido tocar
```
src/core/**
src/pages/**
src/main.tsx
router.tsx
src/features/onboarding/**
OpenAIWhisperService.ts (salvo parámetros aprobados)
useTranscript.ts
```

Solicitar aprobación antes de alterar archivos restringidos.

---

## 11. Definition of Done (DoD)

- [ ] Solo intents permitidos.
- [ ] Respuestas con disclaimers obligatorios.
- [ ] Guardrails (intent filter + prompt) activos.
- [ ] Tri-lingual funcionando.
- [ ] Historial persistente en panel.
- [ ] Resumen SOAP/carta disponible.
- [ ] Sin audio almacenado.
- [ ] Panel y botón en las 3 pestañas.
- [ ] Lint en verde.
- [ ] Sin tocar archivos prohibidos.

---

## 12. Material listo para Niagara

- Pitch 2 minutos.
- Demo script.
- Storyboard.
- Roadmap público.

Contactar a Mauricio para PDFs, slides o video simulado si se necesita paquete adicional.
