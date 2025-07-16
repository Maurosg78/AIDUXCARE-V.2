# 📦 CHANGELOG – AiDuxCare

---

## ✅ v2.9.0 – Cierre de fase técnica y preparación MVP (2025-05-20)

### Cambios principales:
- Refactor completo de tipado en MCPContextDiffDashboard.tsx
- Justificación de falsos positivos de accesibilidad en `<select>`
- Corrección de imports erróneos y errores de CI en AgentSuggestionsViewer.tsx
- Limpieza de variables `.env` y `.env.local`, configuración estable validada
- Documentación técnica avanzada:
  - `v2.9-status-report.md`
  - `ROADMAP_READAPTADO_MVP_vs_PRODUCTO.md`

### Estado:
🟢 Sistema estable en entorno local. Preparado para iniciar integración IA → EMR.

---

## 🚀 v2.10.0 – Inicio del MVP Clínico Funcional (2025-05-21)

### Objetivo:
Implementar la integración real de sugerencias generadas por el agente IA al EMR estructurado, con trazabilidad clínica y aceptación validable.

### Próximos módulos del sprint:
- [ ] Integración UI/UX de sugerencias aceptadas manualmente
- [ ] Persistencia en Supabase
- [ ] Visualización en la ficha clínica
- [ ] Auditoría Langfuse por campo aceptado
- [ ] Test funcional e interacción con EMR real

---

## [Unreleased]
### Mejoras
- test(AudioFileSTTService): Corrección de mocks y tipos para compatibilidad total con TranscriptionSegment y tipado estricto. Tests 100% verdes. [mantra: Crear→Testear→Aprobar→Integrar] ([#32](https://github.com/Maurosg78/AIDUXCARE-V.2/pull/32))
- test(AgentSuggestionsViewer): Robustez total en queries y aserciones. Soporte duplicados, accesibilidad y errores de red. 100% verde en Vitest. [mantra: Crear→Testear→Aprobar→Integrar] (rama: sprint/TDP-3-test-coverage-performance)

### Refactorización y cobertura de tests (visitDataSourceSupabase)
- Se refactorizó el mock global de Supabase (`src/core/auth/supabaseClient.ts`) para soportar chaining profundo real y estado compartido por tabla.
- Ahora permite configurar resultados con `.returns(...)` en cualquier punto del chain y es compatible con todos los flujos de integración y edge cases.
- Todos los tests de `visitDataSourceSupabase` pasan en verde, validando flujos normales, errores, validación Zod y casos límite.
- El sistema de mocks es robusto, reutilizable y cumple estándar enterprise para pruebas de integración.

