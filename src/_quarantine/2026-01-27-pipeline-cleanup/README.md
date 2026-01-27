# Cuarentena: Pipeline Cleanup
**Fecha:** 27 Enero 2026

## Archivos movidos:
- audioPipeline.ts - 0 imports
- transcriptToSOAP.ts - 0 imports
- soap-generator.ts - solo usado por soap-handler.ts
- soap-handler.ts - 0 imports

## Razón:
Canonización del pipeline clínico. Sistema funciona sin estos archivos.

## Plan:
- Si build pasa: mantener en cuarentena
- Si algo falla: restaurar inmediatamente
- Si 2 semanas sin problemas: considerar eliminan
