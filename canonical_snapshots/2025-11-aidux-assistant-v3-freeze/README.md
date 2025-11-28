# AiDux Assistant v3 — Freeze Snapshot

## Estado (2025-11)

- Feature: Floating voice assistant (panel + button) for AiDuxCare workflow.
- Estado: Desarrollo congelado para retomarlo en fase futura.
- Se movió el código a `src/_experimental/aidux-assistant-v3/`.

## Componentes incluídos

- `AiDuxFloatingButton.tsx`
- `AiDuxFloatingPanel.tsx`
- `useAiDuxAssistant.ts`
- `useAiDuxVoice.ts`
- `AiDuxVoiceService.ts`
- `AiDuxVoiceTypes.ts`

## Funcionalidad lograda

- Saludo por voz y texto, con idioma basado en preferencia.
- Historial de interacciones (comandos, resúmenes, respuestas clínicas).
- Integración preliminar con Whisper y Vertex AI para intentos reconocidos.

## Pendientes para reactivación

1. Afinar prompts/voice commands y pipeline Whisper (evitar capturar saludos).
2. UI final (colores, layout responsive, accessibility).
3. Integración con pipeline clínico (chat vs. acciones concretas) + QA.
4. Definir guardrails regulatorios/llaves de seguridad (PHIPA/PIPEDA).
5. Tests unitarios/end-to-end.

## Cómo reactivarlo

1. Mover archivos desde `src/_experimental/aidux-assistant-v3/` a sus rutas originales (`src/components`, `src/hooks`, `src/services`).
2. Reintroducir imports en `src/pages/ProfessionalWorkflowPage.tsx`:
   ```tsx
   import AiDuxFloatingButton from '@/components/AiDuxFloatingButton';
   import AiDuxFloatingPanel from '@/components/AiDuxFloatingPanel';
   import useAiDuxAssistant from '@/hooks/useAiDuxAssistant';
   ```
   y volver a montar:
   ```tsx
   const assistant = useAiDuxAssistant(...);
   <AiDuxFloatingButton ... />
   <AiDuxFloatingPanel ... />
   ```
3. Ajustar prompts y lógica de whisper según los pendientes.

## Notas regulatorias

- El asistente debe permanecer “informational only”, sin prescripción.
- No se almacena audio; verificar integridad antes de producción.
- Alinear con checklist de PHIPA/PIPEDA antes de lanzar.

## Pruebas pendientes

- Revisión manual de comandos (modalidades, red flags, resúmenes).
- Tests para que el speech-to-text no capture mensajes internos.
- Ensayos UX para pantalla mobile/desktop.
