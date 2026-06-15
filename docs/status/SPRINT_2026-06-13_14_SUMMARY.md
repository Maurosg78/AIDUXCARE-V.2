# Sprint 13-14 Jun 2026 - Resumen completo

## Fixes deployados en produccion

| Commit | Fix | Impacto |
| --- | --- | --- |
| `d34ee65` | Medicacion actual excluye `previous`/`stopped_adverse` | Ibuprofeno por 5 dias ya no aparece 4 meses despues |
| `7bbf3f9` | Session dismiss optimistic removal | Descartar sesion ya no enruta a modo pendiente |
| `b7587f5` | SOAP follow-up enriquece contexto con SOAP sesion anterior | La nota captura variaciones clinicas especificas |
| `5762c7f` | `whisperProxy` auth guard | Nadie puede transcribir audio sin token Firebase |

## Compliance cerrado

- DPA GCP Firebase firmado el 14 jun 2026 por `maurosg.2023@gmail.com`.
- CDPA activo; cubre Vertex AI, Firebase y Cloud Functions.
- API keys exportadas a Secret Manager: `AIDUXCARE_FUNCTIONS_CONFIG/v1`.

## Backlog actualizado

- SOCRATES MODO 0: advertencia duracion medicacion con excepciones PRN/lifelong.
- UX: physio notes reminder pre-SOAP una sola vez, sin bucle.
- ESTRATEGIA: estandarizacion ICF/FHIR para interoperabilidad futura.
- INFRA: Node.js 22 + `firebase-functions` 6.6+; reminder 1 sep 2026.
- `apiErasePatientData`: gap RGPD Art. 17 documentado; requiere sesion dedicada.
- DPA OpenAI Whisper: formulario formal pendiente esta semana.

## Feedbacks Firebase cerrados

- `maq8gLZs7MctS81KCgHX`
- `bF8dhxuQqLRLFtsFHhXf`
- `GFFCsyKOQR5BfHBMlydZ`

Resultado: 3 de 6 feedbacks pendientes cerrados este fin de semana.
