# REPORTE: Análisis y Canonización del Pipeline Clínico

**Fecha:** 27 Enero 2026  
**Preparado para:** CTO (Mauricio)  
**Preparado por:** Cursor AI  
**WO:** WO-PIPELINE-CANONIZATION-01

---

## 📋 RESUMEN EJECUTIVO

Este informe analiza el pipeline clínico (audio → transcript → SOAP) para identificar archivos duplicados/no utilizados y proponer una estructura canónica. El análisis se realizó mediante:

- ✅ Búsqueda exhaustiva de imports en todo el codebase
- ✅ Análisis del flujo real en producción (ProfessionalWorkflowPage)
- ✅ Comparación de funcionalidades entre archivos similares
- ✅ Identificación de dependencias y usos reales

**Hallazgos principales:**
- 1 archivo completamente no utilizado (`audioPipeline.ts`)
- 1 archivo con uso limitado (`transcriptToSOAP.ts`)
- 2 archivos con funcionalidad duplicada (`soap-generator.ts` vs `vertex-ai-soap-service.ts`)
- 1 archivo de integración no utilizado en producción (`soapWithAlertsIntegration.ts`)
- Flujo canónico identificado y documentado

---

## 1. ARCHIVOS POR ESTADO

### ✅ USADOS EN PRODUCCIÓN (MANTENER)

#### Grupo A: Servicios Core de SOAP
- **`src/services/vertex-ai-soap-service.ts`** ✅ **CRÍTICO**
  - **Usado por:** `ProfessionalWorkflowPage.tsx:2783`
  - **Función principal:** Generación de SOAP usando Vertex AI con prompts diferenciados (Initial vs Follow-up)
  - **Características:**
    - Integración con Prompt Brain v3
    - De-identificación PHIPA/PIPEDA
    - Validación anti-hallucinación
    - Optimización de tokens para follow-ups
    - Soporte para session types (WSIB, MVA, Certificate)
  - **Estado:** ✅ **CANÓNICO** - Es el servicio principal en producción

- **`src/services/vertex-ai-service-firebase.ts`** ✅ **USADO**
  - **Usado por:**
    - `useNiagaraProcessor.ts:56` (análisis clínico)
    - `audioPipeline.ts:89` (análisis clínico)
    - `VirtualAssistant.tsx:4` (análisis con proxy)
  - **Función principal:** Servicio base para llamadas a Vertex AI (Niagara analysis, SOAP generation, voice summaries)
  - **Estado:** ✅ **MANTENER** - Servicio base crítico

#### Grupo B: Core SOAP Builders (CANÓNICOS)
- **`src/core/soap/SOAPContextBuilder.ts`** ✅ **USADO**
  - **Usado por:** `ProfessionalWorkflowPage.tsx:18` (import directo)
  - **Función:** Construye contexto SOAP desde Tab 1 (Analysis) y Tab 2 (Physical Evaluation)
  - **Estado:** ✅ **CANÓNICO**

- **`src/core/soap/SOAPPromptFactory.ts`** ✅ **USADO**
  - **Usado por:** `vertex-ai-soap-service.ts:10` (import directo)
  - **Función:** Genera prompts diferenciados para Initial Assessment vs Follow-up
  - **Estado:** ✅ **CANÓNICO**

- **`src/core/soap/PhysicalExamResultBuilder.ts`** ✅ **USADO**
  - **Usado por:** `ProfessionalWorkflowPage.tsx:20` (import directo)
  - **Función:** Convierte EvaluationTestEntry[] → PhysicalExamResult[] para SOAP
  - **Estado:** ✅ **CANÓNICO**

- **`src/core/soap/SOAPDataOrganizer.ts`** ✅ **USADO**
  - **Usado por:** `ProfessionalWorkflowPage.tsx:21` (import directo)
  - **Función:** Organiza datos unificados de Tab 1 y Tab 2 para generación SOAP
  - **Estado:** ✅ **CANÓNICO** - Single source of truth

- **`src/core/soap/SOAPObjectiveValidator.ts`** ✅ **USADO**
  - **Usado por:** `ProfessionalWorkflowPage.tsx` (import dinámico línea 1658 en snapshots)
  - **Función:** Valida que SOAP Objective solo mencione regiones testeadas
  - **Estado:** ✅ **MANTENER**

#### Grupo C: Utilities
- **`src/utils/soapValidation.ts`** ✅ **USADO**
  - **Usado por:** `vertex-ai-soap-service.ts:15` (import directo)
  - **Función:** Valida límites de caracteres y repetición en SOAP notes
  - **Estado:** ✅ **MANTENER**

- **`src/utils/soap-handler.ts`** ⚠️ **USADO PERO DEPRECABLE**
  - **Usado por:** Ningún archivo en producción (solo definido, no importado)
  - **Función:** Wrapper que usa `SOAPGenerator.generateFromData()` (deprecado)
  - **Estado:** ⚠️ **CANDIDATO A DEPRECAR** - No se usa en producción

#### Grupo D: Types
- **`src/types/vertex-ai.ts`** ✅ **USADO EXTENSIVAMENTE**
  - **Usado por:** Múltiples archivos (SOAPNote, PhysicalExamResult, etc.)
  - **Estado:** ✅ **MANTENER**

- **`src/types/webaudio.globals.d.ts`** ✅ **USADO**
  - **Usado por:** Sistema de audio global
  - **Estado:** ✅ **MANTENER**

---

### ❌ NO USADOS (DEPRECAR)

#### Archivo 1: `src/core/audio-pipeline/audioPipeline.ts`
- **Estado:** ❌ **NO SE USA EN PRODUCCIÓN**
- **Análisis:**
  - Solo mencionado en `DebugAudioPage.tsx` (página de debug, no producción)
  - `DebugAudioPage.tsx` no importa ni usa `AudioPipeline` - solo tiene comentario
  - 0 imports reales en código de producción
- **Función:** Pipeline completo audio → transcript → analysis → SOAP con retry y métricas
- **Razón de no uso:** Probablemente reemplazado por flujo en `ProfessionalWorkflowPage`
- **Recomendación:** ❌ **DEPRECAR** - Mover a `src/deprecated/` o eliminar

#### Archivo 2: `src/core/notes/transcriptToSOAP.ts`
- **Estado:** ⚠️ **NO SE USA EN PRODUCCIÓN**
- **Análisis:**
  - Solo se auto-referencia (usa `SOAPBuilder` internamente)
  - No hay imports de `transcriptToChecklist` o `buildSOAPFromAnalysis` en producción
  - Funcionalidad similar a `SOAPContextBuilder` pero menos completa
- **Función:** Convierte analysis results → ChecklistSignal[] → MinimalSOAPNote
- **Razón de no uso:** Reemplazado por flujo canónico con `SOAPContextBuilder` + `vertex-ai-soap-service`
- **Recomendación:** ⚠️ **DEPRECAR** - Funcionalidad obsoleta, reemplazada por pipeline canónico

---

### 🔀 DUPLICADOS (CONSOLIDAR)

#### Duplicación 1: `soap-generator.ts` vs `vertex-ai-soap-service.ts`

**Archivo 1: `src/services/soap-generator.ts`**
- **Estado:** ⚠️ **DUPLICADO - NO USADO EN PRODUCCIÓN**
- **Usado por:** Solo `soap-handler.ts` (que tampoco se usa)
- **Función:** `SOAPGenerator.generateFromData()` - Genera SOAP desde analysis + physical eval + patient data
- **Características:**
  - Generación local (sin IA)
  - Construye SOAP manualmente desde datos estructurados
  - No usa Vertex AI
  - No tiene de-identificación
  - No tiene validación avanzada

**Archivo 2: `src/services/vertex-ai-soap-service.ts`**
- **Estado:** ✅ **CANÓNICO - USADO EN PRODUCCIÓN**
- **Usado por:** `ProfessionalWorkflowPage.tsx:2783` (flujo principal)
- **Función:** `generateSOAPNote()` - Genera SOAP usando Vertex AI
- **Características:**
  - Usa Vertex AI (Gemini 2.0 Flash)
  - Prompts diferenciados (Initial vs Follow-up)
  - De-identificación PHIPA/PIPEDA
  - Validación anti-hallucinación
  - Optimización de tokens
  - Soporte session types
  - Integración Prompt Brain v3

**Análisis de duplicación:**
- Ambos generan SOAP notes
- `soap-generator.ts` es generación local/simple
- `vertex-ai-soap-service.ts` es generación con IA (canónico)
- **NO son intercambiables** - tienen propósitos diferentes pero `soap-generator.ts` no se usa

**Recomendación:** ❌ **DEPRECAR `soap-generator.ts`** - Funcionalidad obsoleta, reemplazada por `vertex-ai-soap-service.ts`

#### Duplicación 2: `soapWithAlertsIntegration.ts`

**Archivo: `src/services/soapWithAlertsIntegration.ts`**
- **Estado:** ⚠️ **NO USADO EN PRODUCCIÓN**
- **Usado por:** Solo se auto-exporta, no hay imports en producción
- **Función:** Wrapper que incluye medical alerts en SOAP notes
- **Características:**
  - Detecta alerts desde transcription
  - Incluye alerts en Assessment section
  - Logging de auditoría de seguridad
- **Razón de no uso:** Probablemente funcionalidad planeada pero no integrada en flujo principal
- **Recomendación:** ⚠️ **EVALUAR** - Si se planea usar, integrar en `vertex-ai-soap-service.ts`. Si no, deprecar.

---

## 2. FLUJO CANÓNICO ACTUAL

### Flujo Principal: ProfessionalWorkflowPage → SOAP Generation

```
┌─────────────────────────────────────────────────────────────┐
│ ProfessionalWorkflowPage.tsx                                 │
│ handleGenerateSoap() [línea 2695]                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Validación de Consentimiento                             │
│    checkConsentViaServer()                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Organización de Datos Unificados                         │
│    organizeSOAPData(unifiedData)                             │
│    └─ SOAPDataOrganizer.ts                                   │
│       ├─ buildPhysicalExamResults()                         │
│       │  └─ PhysicalExamResultBuilder.ts                    │
│       ├─ buildSOAPContext()                                 │
│       │  └─ SOAPContextBuilder.ts                          │
│       └─ buildPhysicalEvaluationSummary()                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Generación SOAP con Vertex AI                            │
│    generateSOAPNoteFromService(context, options)           │
│    └─ vertex-ai-soap-service.ts:generateSOAPNote()          │
│       ├─ De-identificación (PHIPA/PIPEDA)                  │
│       ├─ buildSOAPPrompt(context, options)                   │
│       │  └─ SOAPPromptFactory.ts                            │
│       │     ├─ buildInitialAssessmentPrompt()               │
│       │     └─ buildFollowUpPrompt()                        │
│       ├─ Llamada a Vertex AI Proxy                         │
│       │  └─ VERTEX_PROXY_URL (northamerica-northeast1)      │
│       ├─ Parse respuesta                                    │
│       ├─ Re-identificación (PHIPA/PIPEDA)                  │
│       ├─ Validación anti-hallucinación                      │
│       └─ validateSOAP() + truncateSOAPToLimits()          │
│          └─ soapValidation.ts                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Validación de Regiones Testeadas                         │
│    validateSOAPObjective()                                  │
│    └─ SOAPObjectiveValidator.ts                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Actualización de UI                                      │
│    setSoapNote(response.soap)                               │
│    setSoapStatus('generated')                               │
└─────────────────────────────────────────────────────────────┘
```

### Flujo Secundario: Audio → Analysis (Niagara)

```
┌─────────────────────────────────────────────────────────────┐
│ useNiagaraProcessor.ts                                       │
│ processTranscript()                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ VertexAIServiceViaFirebase.processWithNiagara()             │
│ └─ vertex-ai-service-firebase.ts                            │
│    ├─ De-identificación                                      │
│    ├─ buildPrompt (PromptFactory)                            │
│    ├─ Llamada a Vertex AI Proxy                             │
│    └─ Re-identificación                                     │
└─────────────────────────────────────────────────────────────┘
```

**Nota:** El flujo de audio → transcript → analysis está separado del flujo de SOAP generation. El análisis (Niagara) se hace en Tab 1, y luego se usa para generar SOAP en Tab 3.

---

## 3. PROPUESTA DE CANONIZACIÓN

### Estructura Canónica Propuesta

```
src/
├── services/
│   ├── vertex-ai-soap-service.ts          ✅ CANÓNICO (mantener)
│   ├── vertex-ai-service-firebase.ts      ✅ CANÓNICO (mantener)
│   ├── soap-generator.ts                  ❌ DEPRECAR (duplicado)
│   └── soapWithAlertsIntegration.ts       ⚠️ EVALUAR (no usado)
│
├── core/
│   ├── soap/                              ✅ CANÓNICO (mantener todo)
│   │   ├── SOAPContextBuilder.ts
│   │   ├── SOAPPromptFactory.ts
│   │   ├── PhysicalExamResultBuilder.ts
│   │   ├── SOAPDataOrganizer.ts
│   │   └── SOAPObjectiveValidator.ts
│   │
│   ├── audio-pipeline/
│   │   └── audioPipeline.ts               ❌ DEPRECAR (no usado)
│   │
│   └── notes/
│       └── transcriptToSOAP.ts             ⚠️ DEPRECAR (obsoleto)
│
├── utils/
│   ├── soapValidation.ts                   ✅ CANÓNICO (mantener)
│   └── soap-handler.ts                     ⚠️ DEPRECAR (no usado)
│
└── types/
    ├── vertex-ai.ts                        ✅ CANÓNICO (mantener)
    └── webaudio.globals.d.ts               ✅ CANÓNICO (mantener)
```

### Decisiones de Canonización

#### ✅ MANTENER (Core del Pipeline)

1. **`vertex-ai-soap-service.ts`** - Servicio principal de generación SOAP
2. **`vertex-ai-service-firebase.ts`** - Servicio base Vertex AI
3. **`core/soap/*`** - Todos los builders y organizadores (canónicos)
4. **`utils/soapValidation.ts`** - Validación crítica
5. **`types/vertex-ai.ts`** - Tipos fundamentales

#### ❌ DEPRECAR (No Usados)

1. **`core/audio-pipeline/audioPipeline.ts`**
   - **Razón:** 0 imports en producción
   - **Acción:** Mover a `src/deprecated/audio-pipeline/` o eliminar
   - **Riesgo:** Bajo (no se usa)

2. **`core/notes/transcriptToSOAP.ts`**
   - **Razón:** Funcionalidad obsoleta, reemplazada por pipeline canónico
   - **Acción:** Mover a `src/deprecated/notes/` o eliminar
   - **Riesgo:** Bajo (no se usa)

3. **`services/soap-generator.ts`**
   - **Razón:** Duplica funcionalidad de `vertex-ai-soap-service.ts` pero sin IA
   - **Acción:** Mover a `src/deprecated/services/` o eliminar
   - **Riesgo:** Bajo (solo usado por `soap-handler.ts` que tampoco se usa)

4. **`utils/soap-handler.ts`**
   - **Razón:** No se usa en producción, depende de `soap-generator.ts` (deprecado)
   - **Acción:** Mover a `src/deprecated/utils/` o eliminar
   - **Riesgo:** Bajo (no se usa)

#### ⚠️ EVALUAR (Funcionalidad Potencial)

1. **`services/soapWithAlertsIntegration.ts`**
   - **Razón:** No se usa pero tiene funcionalidad de seguridad (medical alerts)
   - **Opciones:**
     - **Opción A:** Integrar en `vertex-ai-soap-service.ts` si se planea usar
     - **Opción B:** Deprecar si no se planea usar
   - **Recomendación:** Consultar con equipo si se planea usar medical alerts en SOAP

---

## 4. PLAN DE MIGRACIÓN

### Fase 1: Preparación (Sin Cambios de Código)

1. ✅ **Completado:** Análisis de uso real
2. ✅ **Completado:** Identificación de duplicaciones
3. ✅ **Completado:** Documentación de flujo canónico

### Fase 2: Deprecación Conservadora

#### Paso 2.1: Crear estructura de deprecados

```bash
mkdir -p src/deprecated/audio-pipeline
mkdir -p src/deprecated/notes
mkdir -p src/deprecated/services
mkdir -p src/deprecated/utils
```

#### Paso 2.2: Mover archivos deprecados

1. **`audioPipeline.ts`**
   ```bash
   mv src/core/audio-pipeline/audioPipeline.ts src/deprecated/audio-pipeline/
   ```
   - Agregar comentario `@deprecated` en archivo
   - Documentar razón de deprecación

2. **`transcriptToSOAP.ts`**
   ```bash
   mv src/core/notes/transcriptToSOAP.ts src/deprecated/notes/
   ```
   - Agregar comentario `@deprecated`
   - Verificar que `SOAPBuilder.ts` no dependa de él

3. **`soap-generator.ts`**
   ```bash
   mv src/services/soap-generator.ts src/deprecated/services/
   ```
   - Agregar comentario `@deprecated`
   - Verificar que no haya otros usos

4. **`soap-handler.ts`**
   ```bash
   mv src/utils/soap-handler.ts src/deprecated/utils/
   ```
   - Agregar comentario `@deprecated`
   - Ya no se usa, seguro mover

#### Paso 2.3: Actualizar imports (si existen)

- Buscar cualquier import de archivos deprecados
- Si se encuentran, reemplazar con alternativas canónicas o eliminar

### Fase 3: Decisión sobre `soapWithAlertsIntegration.ts`

#### Opción A: Integrar en Pipeline Canónico

Si se decide usar medical alerts:

1. Integrar `includeAlertsInSOAP()` en `vertex-ai-soap-service.ts`
2. Llamar después de generar SOAP pero antes de validar
3. Mantener logging de auditoría
4. Deprecar archivo original

#### Opción B: Deprecar

Si no se planea usar:

1. Mover a `src/deprecated/services/`
2. Agregar comentario `@deprecated`
3. Documentar funcionalidad para referencia futura

### Fase 4: Testing y Validación

1. **Verificar que no hay imports rotos:**
   ```bash
   grep -r "from.*audioPipeline\|from.*transcriptToSOAP\|from.*soap-generator\|from.*soap-handler" src --exclude-dir=deprecated
   ```

2. **Ejecutar tests:**
   ```bash
   npm test
   ```

3. **Verificar build:**
   ```bash
   npm run build
   ```

4. **Testing manual:**
   - Flujo completo de generación SOAP en ProfessionalWorkflowPage
   - Verificar que no hay errores en consola
   - Verificar que SOAP se genera correctamente

### Fase 5: Limpieza Final (Opcional)

Después de 1-2 sprints sin problemas:

1. Eliminar archivos de `src/deprecated/` si se confirma que no se necesitan
2. Actualizar documentación
3. Cerrar WO

---

## 5. RIESGOS IDENTIFICADOS

### Riesgos Bajos ✅

1. **Deprecar `audioPipeline.ts`**
   - **Riesgo:** Bajo - No se usa en producción
   - **Mitigación:** Mover a deprecated primero, eliminar después

2. **Deprecar `transcriptToSOAP.ts`**
   - **Riesgo:** Bajo - No se usa, funcionalidad reemplazada
   - **Mitigación:** Verificar que `SOAPBuilder.ts` no dependa de él

3. **Deprecar `soap-generator.ts` y `soap-handler.ts`**
   - **Riesgo:** Bajo - No se usan en producción
   - **Mitigación:** Mover a deprecated, verificar imports

### Riesgos Medios ⚠️

1. **Deprecar `soapWithAlertsIntegration.ts`**
   - **Riesgo:** Medio - Funcionalidad de seguridad, podría necesitarse
   - **Mitigación:** Evaluar con equipo antes de deprecar
   - **Recomendación:** Integrar en pipeline canónico si se planea usar

### Riesgos de Migración

1. **Imports rotos**
   - **Riesgo:** Bajo - Búsqueda exhaustiva realizada
   - **Mitigación:** Verificar con grep antes de mover archivos

2. **Dependencias ocultas**
   - **Riesgo:** Bajo - Análisis exhaustivo realizado
   - **Mitigación:** Testing completo después de mover

---

## 6. MÉTRICAS DE ÉXITO

### Métricas de Canonización

- ✅ **0 archivos duplicados** en pipeline clínico
- ✅ **100% de archivos usados** están en estructura canónica
- ✅ **0 imports rotos** después de migración
- ✅ **Build exitoso** después de cambios
- ✅ **Tests pasando** después de cambios

### Métricas de Calidad

- ✅ **Flujo canónico documentado** y claro
- ✅ **Single source of truth** para cada funcionalidad
- ✅ **Estructura lógica** y mantenible

---

## 7. RECOMENDACIONES FINALES

### Prioridad Alta 🔴

1. **Deprecar archivos no usados:**
   - `audioPipeline.ts` (0 imports)
   - `transcriptToSOAP.ts` (obsoleto)
   - `soap-generator.ts` (duplicado)
   - `soap-handler.ts` (no usado)

### Prioridad Media 🟡

2. **Decidir sobre `soapWithAlertsIntegration.ts`:**
   - Si se planea usar: Integrar en `vertex-ai-soap-service.ts`
   - Si no: Deprecar

### Prioridad Baja 🟢

3. **Limpieza final:**
   - Después de validar, eliminar archivos deprecated
   - Actualizar documentación

---

## 8. APÉNDICES

### A. Archivos Analizados

| Archivo | Estado | Usos | Decisión |
|---------|--------|------|----------|
| `audioPipeline.ts` | ❌ No usado | 0 | Deprecar |
| `transcriptToSOAP.ts` | ❌ No usado | 0 | Deprecar |
| `soap-generator.ts` | ⚠️ Duplicado | 1 (no usado) | Deprecar |
| `soapWithAlertsIntegration.ts` | ⚠️ No usado | 0 | Evaluar |
| `soap-handler.ts` | ❌ No usado | 0 | Deprecar |
| `vertex-ai-soap-service.ts` | ✅ Canónico | 1 (producción) | Mantener |
| `vertex-ai-service-firebase.ts` | ✅ Usado | 3 | Mantener |
| `SOAPContextBuilder.ts` | ✅ Canónico | 1 | Mantener |
| `SOAPPromptFactory.ts` | ✅ Canónico | 1 | Mantener |
| `PhysicalExamResultBuilder.ts` | ✅ Canónico | 1 | Mantener |
| `SOAPDataOrganizer.ts` | ✅ Canónico | 1 | Mantener |
| `SOAPObjectiveValidator.ts` | ✅ Usado | 1 | Mantener |
| `soapValidation.ts` | ✅ Usado | 1 | Mantener |
| `vertex-ai.ts` | ✅ Usado | Múltiples | Mantener |
| `webaudio.globals.d.ts` | ✅ Usado | Global | Mantener |

### B. Comandos de Verificación

```bash
# Verificar imports de archivos a deprecar
grep -r "from.*audioPipeline" src --exclude-dir=deprecated
grep -r "from.*transcriptToSOAP" src --exclude-dir=deprecated
grep -r "from.*soap-generator" src --exclude-dir=deprecated
grep -r "from.*soap-handler" src --exclude-dir=deprecated

# Verificar uso de vertex-ai-soap-service (canónico)
grep -r "generateSOAPNoteFromService\|generateSOAPNote" src

# Verificar uso de builders canónicos
grep -r "buildSOAPContext\|organizeSOAPData\|buildPhysicalExamResults" src
```

### C. Referencias

- **Flujo canónico:** `ProfessionalWorkflowPage.tsx:2695-2806`
- **Servicio principal:** `vertex-ai-soap-service.ts:109`
- **Organizador de datos:** `SOAPDataOrganizer.ts:71`

---

## 9. CONCLUSIÓN

El análisis del pipeline clínico revela una estructura mayormente canónica con algunos archivos obsoletos que pueden deprecarse de forma segura. El flujo principal está bien definido y usa `vertex-ai-soap-service.ts` como servicio canónico.

**Acciones recomendadas:**
1. ✅ Deprecar 4 archivos no usados (bajo riesgo)
2. ⚠️ Evaluar 1 archivo con funcionalidad potencial (`soapWithAlertsIntegration.ts`)
3. ✅ Mantener estructura canónica existente

**Tiempo estimado de implementación:** 2-3 horas (solo deprecación, sin cambios funcionales)

---

**Fin del Reporte**
