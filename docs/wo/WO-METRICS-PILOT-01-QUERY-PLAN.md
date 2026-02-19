# WO-METRICS-PILOT-01 — Query Plan Firestore (verificación rápida)

**Objetivo:** Revisar en Firestore qué campos mirar y cómo detectar anomalías.

---

## Colección: `telemetry_sessions`

### Campos mínimos por doc (DoD C)

| Campo | Tipo | Verificación |
|-------|------|--------------|
| `schemaVersion` | number | Debe ser `1` |
| `createdAt` | number | Timestamp coherente |
| `updatedAt` | number | >= createdAt |
| `userIdHash` | string | 64 chars hex (SHA-256) |
| `sessionId` | string | UUID |
| `workflowType` | string | `'initial'` o `'followup'` |
| `finalized` | boolean | `true` en sesiones cerradas |
| `endedReason` | string | `'completed'` \| `'unload'` \| `'timeout'` |

### Paso 2 (latencia)

| Campo | Verificación |
|-------|---------------|
| `soapGenerateClickedCount` | >= `soapGenerateSuccessCount + soapGenerateFailureCount` |
| `soapGenerateLatencyMsMax` | > 0 en sesiones donde se generó SOAP |
| `soapGenerateSuccessCount` | Incrementa cuando generate OK |
| `soapGenerateFailureCount` | Incrementa cuando generate falla |

### Paso 4 (fricción)

| Campo | Verificación |
|-------|---------------|
| `regenerateCount` | Coincide con clicks en Regenerate |
| `validationErrorCount` | Coincide con errores provocados (CPO review, validación) |

### Paso 3 (bloques) — SOLO initial

| Campo | Verificación |
|-------|---------------|
| `blocks.soap_subjective.renderedCount` | = 1 (no 5 ni más) |
| `blocks.soap_subjective.acceptAsIsCount` | Sube al finalizar sin editar |
| `blocks.soap_subjective.acceptAfterEditCount` | Sube al finalizar con edición |
| `blocks.soap_subjective.originalCharsTotal` | > 0 |
| `blocks.soap_subjective.finalCharsTotal` | > 0 |
| `blocks.soap_subjective.editDeltaAdded` | > 0 solo si hubo edición (chars añadidos) |
| `blocks.soap_subjective.editDeltaRemoved` | > 0 solo si hubo edición (chars removidos) |

*(Idem para `soap_objective`, `soap_assessment`, `soap_plan`)*

---

## Verificación por CLI (sin abrir Console)

```bash
pnpm telemetry:check
```

Muestra `config/telemetry` y los últimos 10 docs de `telemetry_sessions`. Requiere `gcloud auth application-default login`.

---

## Queries útiles (Firestore Console)

### 1. Sesiones recientes (últimas 24h)

```
Colección: telemetry_sessions
Ordenar por: createdAt (desc)
Límite: 50
```

### 2. Sesiones con generate (latencia presente)

```
Filtrar: soapGenerateLatencyMsMax > 0
```

### 3. Sesiones initial con bloques

```
Filtrar: workflowType == 'initial'
Verificar: blocks.soap_subjective existe
```

### 4. Sesiones abandonadas (unload)

```
Filtrar: endedReason == 'unload'
```

### 5. Sesiones sin cierre (detectar fugas)

```
Filtrar: finalized == false
Ordenar por: createdAt (desc)
```

### 6. Sesiones con fricción alta (cazar bugs)

```
Filtrar: validationErrorCount > 0 OR regenerateCount > 0
```

Lleva directo a casos donde el flujo se atascó.

---

## Anomalías a detectar

| Anomalía | Indicador | Acción |
|----------|-----------|--------|
| **Duplicación renderedCount** | `renderedCount` > 1 por bloque en 1 sesión | Revisar useEffect en SOAPEditor (anti-duplicados) |
| **Sesiones sin finalize** | `finalized: false` y `endedAt` ausente tras 24h | Normal si unload; sospechoso si muchas |
| **Latencias absurdas** | `soapGenerateLatencyMsMax` > 120000 (2 min) | Revisar timeouts / red |
| **Clicks sin success/failure** | `soapGenerateClickedCount` >> `success + failure` | Revisar early-returns en handleGenerateSoap |
| **userIdHash vacío o raro** | `userIdHash` no es 64 hex | Revisar hashUserId |
| **Bloques en follow-up** | `workflowType == 'followup'` y `blocks` poblado | No debería ocurrir (solo initial) |

---

## Cómo obtener tu userIdHash (para enabledUserHashes)

**Patrón seguro (evitar activar a todos en prod):**

1. Mantén `enabled: false` en prod.
2. Obtén tu `userIdHash` en **UAT o dev**:
   - En UAT/dev: `enabled: true`, **omitir** `enabledUserHashes` (usa sampleRate; solo UAT afectado).
   - Ejecuta 1 sesión completa.
   - En Firestore (UAT/dev), abre el doc en `telemetry_sessions` y copia `userIdHash`.
3. En **prod**: actualiza `config/telemetry` con `enabled: true` y `enabledUserHashes: ["<ese_hash>"]`.
4. A partir de ahí solo tú generas telemetría en prod.

**Interpretación (implementación actual):**
- `enabledUserHashes: []` = **nadie** (SAFE)
- `enabledUserHashes` ausente = usa `sampleRate` (puede incluir a todos)
