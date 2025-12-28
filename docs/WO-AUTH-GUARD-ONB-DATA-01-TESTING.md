# WO-AUTH-GUARD-ONB-DATA-01 — Guía de Testing Manual

## 1) Soft-fail: 3 Escenarios

### A. Adblock ON (ERR_BLOCKED_BY_CLIENT)

**Pasos:**
1. Activar adblocker (uBlock Origin, AdBlock Plus, etc.)
2. Iniciar sesión en la app
3. Navegar a una ruta protegida

**Esperado:**
- ✅ AuthGuard muestra pantalla recuperable con mensaje sobre adblock
- ✅ Botón "Retry" visible y funcional
- ✅ NO se hace signOut automático
- ✅ NO hay loop infinito

**Screenshot esperado:**
```
Unable to Load Profile
We couldn't load your profile. This may be caused by an ad blocker or browser extension blocking Firestore access.
Please disable ad blockers for this site if applicable, or check your browser settings.
[Retry] (disabled mientras loading)
```

**Log esperado (primera línea):**
```
Error: ERR_BLOCKED_BY_CLIENT
```

### B. Permission Denied (Firestore Rules)

**Pasos:**
1. Simular error de permisos (modificar reglas de Firestore temporalmente)
2. Iniciar sesión
3. Navegar a una ruta protegida

**Esperado:**
- ✅ Mensaje específico sobre permisos
- ✅ Botón Retry funcional
- ✅ NO expulsa al usuario

**Mensaje esperado:**
```
Unable to Load Profile
We couldn't load your profile due to a permissions issue. Please contact support if this persists.
[Retry]
```

### C. Offline / Network Error

**Pasos:**
1. Desconectar red (o simular offline en DevTools)
2. Iniciar sesión
3. Navegar a una ruta protegida

**Esperado:**
- ✅ Mensaje sobre conexión de red
- ✅ Botón Retry funcional
- ✅ Al reconectar, retry funciona

**Mensaje esperado:**
```
Unable to Load Profile
We couldn't load your profile. Please check your network connection and try again.
[Retry]
```

---

## 2) Consent → Prompt: 2 Pruebas Manuales

### A. `personalizationFromClinicianInputs = false`

**Pasos:**
1. Completar onboarding con `personalizationFromClinicianInputs = false`
2. Ir a ProfessionalWorkflowPage
3. Procesar un transcript
4. Inspeccionar el prompt generado (logs o DevTools)

**Esperado:**
- ✅ El prompt **NO** contiene `[Clinician Practice Preferences]`
- ✅ El prompt **SÍ** contiene `[Patient Context]` y `[Transcript]`

**Snippet esperado (consent OFF):**
```
[Clinician Profile]
Specialty: Physiotherapy
...

[Patient Context]
Patient undergoing physiotherapy assessment

[Clinical Instructions]
...

[Transcript]
...
```

**NO debe aparecer:**
```
[Clinician Practice Preferences]
Note verbosity: ...
Tone: ...
```

### B. `personalizationFromPatientData = false`

**Pasos:**
1. Completar onboarding con `personalizationFromPatientData = false`
2. Ir a ProfessionalWorkflowPage
3. Procesar un transcript
4. Inspeccionar el prompt generado

**Esperado:**
- ✅ El bloque `[Patient Context]` dice "Current session only - no historical data"
- ✅ NO se incluyen datos de historial, episodios previos, o visitas anteriores

**Snippet esperado (consent OFF):**
```
[Patient Context]
Current session only - no historical data
```

**NO debe aparecer:**
```
Patient with previous episodes and history
Last visit: 2024-01-15
Previous treatments: ...
```

---

## 3) Persistencia: Verificar en Firestore

**Pasos:**
1. Completar onboarding completo
2. Ir a Firestore Console
3. Navegar a `users/{uid}`

**Esperado en el documento:**
```json
{
  "practicePreferences": {
    "noteVerbosity": "standard",
    "tone": "formal",
    "preferredTreatments": ["manual therapy"],
    "doNotSuggest": ["dry needling"]
  },
  "dataUseConsent": {
    "personalizationFromClinicianInputs": true,
    "personalizationFromPatientData": false,
    "useDeidentifiedDataForProductImprovement": false,
    "allowAssistantMemoryAcrossSessions": true
  },
  "registrationStatus": "complete",
  "specialty": "Physiotherapy",
  "professionalTitle": "Physiotherapist",
  ...
}
```

**Verificar:**
- ✅ `practicePreferences` existe
- ✅ `dataUseConsent` existe con los 4 campos
- ✅ `registrationStatus` es "complete"

---

## Checklist de Cierre

- [ ] Screenshot del soft-fail (adblock)
- [ ] Log del error capturado (primera línea)
- [ ] Snippet de prompt con `personalizationFromClinicianInputs = false` (sin Practice Preferences)
- [ ] Snippet de prompt con `personalizationFromPatientData = false` (contexto mínimo)
- [ ] JSON del doc en `users/{uid}` mostrando persistencia

---

## Notas

- Los tests unitarios ya verifican la lógica de guardrails
- Esta guía es para verificación manual en producción/staging
- Si algún escenario falla, documentar el comportamiento observado vs esperado

