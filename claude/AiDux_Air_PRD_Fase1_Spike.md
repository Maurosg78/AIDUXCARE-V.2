# AiDux Air — Fase 1: Spike de captura nativa en segundo plano

*Estado: APROBADO como punto de partida (2026-08-28). Planificación de implementación en archivo separado: `AiDux_Air_Implementation_Plan_Hito1_2.md`.*

## Problema

El producto actual (AiDuxCare, web app) no puede capturar audio ambiente con el teléfono en el bolsillo y la pantalla apagada, porque iOS Safari suspende la ejecución en segundo plano y no expone ninguna API de captura de micrófono en background para contenido web; Android Chrome es más permisivo pero no confiable sin un Foreground Service nativo. Sin esta capacidad, la promesa central de "el dispositivo que ya llevás encima, sin fricción" no es alcanzable.

## Evidencia

- Confirmado por inspección directa del código (grep, lectura de archivos, sesión del 2026-08-28): no hay Capacitor/Cordova/React Native/Expo instalado; no hay Wake Lock API en `src/`; la captura real (`useTranscript.ts` + `micController.ts`, usada por `ProfessionalWorkflowPage.tsx`) depende de `getUserMedia` + `MediaRecorder` atado al ciclo de vida de React.
- Restricción de plataforma documentada de WebKit: no existe Background Audio API para *captura* de audio en contenido web, ni siquiera en modo PWA standalone.
- TBD — necesita validación de campo: cuánto tiempo sobrevive realmente un Foreground Service en Android bajo ahorro de batería agresivo por fabricante (Xiaomi, Huawei, Samsung).

## Usuarios

**Primario**: el propio founder, como primer probador, antes de exponer esto a cualquier otro fisioterapeuta o paciente.

**No es para**: pacientes ni datos clínicos reales — este spike corre con audio de prueba, no con sesiones reales.

## Hipótesis

Creemos que **envolver el cliente existente en Capacitor + un plugin nativo delgado de audio en segundo plano** resolverá **la imposibilidad de capturar con pantalla apagada** para **el flujo de consulta real del fisioterapeuta**.

Sabremos que acertamos cuando **una grabación de prueba sobreviva de forma confiable 6-8 horas continuas, con la pantalla apagada y el teléfono en un bolsillo real, en al menos un iPhone y un Android de gama media, sin que el sistema operativo mate el proceso**.

## Métricas de éxito

| Objetivo | Umbral | Cómo se mide |
|---|---|---|
| Duración de grabación continua sin interrupción | ≥ 6 horas | Prueba de campo cronometrada, pantalla apagada, bolsillo real |
| Supervivencia del proceso en distintos OEM Android | Sin caídas en al menos 2 fabricantes distintos | Prueba manual en dispositivos propios/prestados |
| Revisión de tienda para permiso de micrófono en segundo plano | Sin rechazo en revisión inicial | Envío a TestFlight / internal testing de Play Console |

## Alcance

**MVP del spike**: solo la capa de captura nativa. Iniciar/detener grabación de forma deliberada, sobrevivir en segundo plano, subir el blob al mismo `whisperProxy` ya existente.

**Fuera de alcance**
- Las tres capas de identificación de paciente — Fase 2, solo si este spike aprueba.
- Reloj y lentes — solo teléfono en esta fase.
- Cualquier dato clínico real — audio de prueba únicamente.

## Hitos de entrega

| # | Hito | Resultado visible para el usuario | Estado |
|---|---|---|---|
| 1 | Repo paralelo creado, Capacitor instalado, shell arranca | La app compila y corre en un dispositivo real | en curso |
| 2 | Plugin nativo mínimo de audio en segundo plano (iOS) | Graba con pantalla apagada ≥ 1 hora en iPhone de prueba | pending |
| 3 | Plugin nativo mínimo de audio en segundo plano (Android) | Graba con pantalla apagada ≥ 1 hora en Android de prueba | pending |
| 4 | Prueba de campo completa (6-8h, bolsillo real) | Métricas cumplidas o documentadas como no alcanzadas | pending |
| 5 | Decisión go/no-go documentada | Registro escrito de la decisión y su evidencia | pending |

## Preguntas abiertas

- [ ] ¿Qué modelos específicos de iPhone/Android se usan para la prueba de campo?
- [ ] ¿Quién más, además del founder, puede probar esto en su propio teléfono antes de comprometerse al camino nativo?

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Apple/Google rechazan el permiso de micrófono en segundo plano en revisión | Media | Alto | Justificación clínica explícita en el review; fallback ya construido a modo pantalla-encendida sobre la arquitectura web actual |
| Foreground Service no sobrevive en OEMs con ahorro de batería agresivo | Alta | Alto — rompe la promesa central para una porción real de usuarios Android | Documentar limitación por fabricante; considerar guía de configuración manual como mitigación de v1 |
| El spike consume tiempo del founder solo sin avanzar el resto del roadmap | Media | Media | Acotado a plazo fijo (2-3 semanas) con criterio de salida explícito, no indefinido |
