# WO-SOAP-PARSER-BASELINE-VALIDATION-TESTS-V1

**Tests obligatorios para validar parseo de respuestas Vertex antes de persistir baseline**

## Objetivo

Validar que una respuesta parseada de Vertex cumple requisitos mínimos clínicos y es apta para baseline; bloquear persistencia cuando no lo es. Foco: detección y validación, no cambio de lógica de negocio.

## Implementado

| Artefacto | Descripción |
|-----------|-------------|
| `src/services/soapBaselineValidation.ts` | `isValidBaselineSOAP(parsedSOAP): boolean` — validación semántica (Subjective + Plan mínimos; Plan no vacío ni genérico). `getBaselineValidationFailureReason(parsedSOAP): string \| null` para auditoría. Log con `console.warn('[BaselineValidation]', reason)` cuando se rechaza. TODO para integrar en flujo de persistencia. |
| `src/services/__tests__/soapBaselineValidation.test.ts` | Tests Vitest para los 6 casos obligatorios + requisitos mínimos + plan vago ("Increase activity.") + test de `getBaselineValidationFailureReason`. |
| `vertex-ai-soap-service.ts` | Export de `parseSOAPResponse` y `parsePlainSOAPSections` para tests. |

## Requisitos clínicos mínimos (criterio de aceptación)

- Tiene al menos **Subjective** y **Plan**.
- El **Plan** no está vacío ni es genérico (ej. "continue treatment", "n/a", "as planned").
- El texto del Plan tiene contenido accionable (longitud mínima 15 caracteres).
- No es texto libre sin secciones clínicas.

Si no cumple → no se considera baseline válida y no debe persistirse como historia clínica.

## Casos de test (OBLIGATORIOS)

1. **Vertex devuelve JSON válido** → baseline válida ✔
2. **Vertex devuelve texto plano estructurado** (Subjective:/Objective:/Assessment:/Plan:) → baseline válida ✔
3. **Texto plano con markdown** (**Subjective:**, **Plan:**) → baseline válida ✔
4. **Texto plano sin Plan** → baseline inválida ❌
5. **Texto plano con Plan vacío o genérico** ("Continue treatment as planned.", "n/a") → baseline inválida ❌  
   Incluye **Plan vago** ("Increase activity.") → baseline inválida ❌ (refuerza criterio “accionable”).
6. **Texto no clínico / conversacional** → baseline inválida ❌

## Scope respetado

- **Incluido:** tests unitarios para parsers y validador; validación de estructura clínica mínima; 6 casos Vertex.
- **Excluido:** backend Firestore, persistencia real, prompts, UI, flujo Ongoing; no se modificó la lógica de guardado existente (solo se testea).

## Ajustes CTO aplicados (pre-commit)

- **Log de rechazo:** al rechazar baseline, `isValidBaselineSOAP` hace `console.warn('[BaselineValidation]', reason)`; se exporta `getBaselineValidationFailureReason()` para uso en flujo de persistencia (auditoría).
- **TODO en código:** en `soapBaselineValidation.ts` se documenta dónde integrar el validador antes de persistir.
- **Test plan vago:** caso "Increase activity." → baseline inválida (demasiado vago).
- **Test de motivo:** test de `getBaselineValidationFailureReason` para contrato de mensajes.

## Nota CTO

Un baseline debe ser clínicamente interpretable, mínimamente completo y defendible en auditoría. Si no cumple, no entra a la historia del paciente, aunque Vertex haya respondido algo.

## Commit sugerido

```
test(soap): validate Vertex responses before baseline persistence

WO-SOAP-PARSER-BASELINE-VALIDATION-TESTS-V1
- Add isValidBaselineSOAP() for semantic validation
- Export parseSOAPResponse, parsePlainSOAPSections for tests
- Vitest: 6 mandatory cases + minimum requirements
```
