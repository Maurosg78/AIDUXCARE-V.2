# WO-001: Red Flags Acknowledgement — No Repetir Justificación

**Fecha:** 2026-02-19  
**Prioridad:** P0 (Crítico para pilot)  
**Feedback ID:** `37IDkw4PY3CiKQChRoPC`  
**Estado:** ✅ Implementado (2026-02-07)

## Problema

Usuario justifica red flags en un paso, luego el sistema pide la misma justificación de nuevo en SOAP Generation. Fricción y pérdida de confianza.

## Solución (implementada)

1. **Capturar justificación ANTES de Physical Evaluation** (en Analysis tab, cuando hay red flags)
2. **Pre-llenar en SOAP** cuando el usuario llega al bloque override
3. **Pasar justificación a la generación inicial de SOAP** para que no incluya lenguaje de derivación cuando ya se justificó

## Implementación

- `ProfessionalWorkflowPage.tsx`: estado `redFlagsAcknowledgements` (Record), gate `continueToEvaluation`, pre-fill en override block, reset al cambiar análisis
- `AnalysisTab.tsx`: bloque de acknowledgement (Refer / Treat with monitoring + textarea justificación)
- `redFlagOverrideForInitial`: se pasa a `generateSOAPNoteFromService` en primera generación cuando hay justificaciones válidas
