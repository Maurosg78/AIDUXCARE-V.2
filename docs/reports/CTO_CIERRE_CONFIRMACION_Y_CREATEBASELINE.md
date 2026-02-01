# CTO: Cierre (confirmación visual) + createBaseline — Outputs y conclusión

**Fecha:** 2026-01-31  
**Contexto:** Validar qué ve el fisioterapeuta al cerrar Initial Assessment y qué hace exactamente createBaseline.

---

## 1. Outputs solicitados

### 1.1 El cierre: ¿qué le ve al fisioterapeuta?

```bash
sed -n '3256,3320p' src/pages/ProfessionalWorkflowPage.tsx
```

**Resultado (líneas 3256-3320):**

```ts
  // WO-IA-CLOSE-01: Close Initial Assessment — persist baseline, update patient/session, redirect
  const handleCloseInitialAssessment = useCallback(async () => {
    if (soapStatus !== 'finalized') {
      setAnalysisError('SOAP note must be finalized before closing the initial assessment.');
      return;
    }
    if (initialAssessmentClosedAt != null && initialAssessmentClosedAt !== '') {
      return;
    }
    if (!localSoapNote) {
      setAnalysisError('No SOAP note to save as baseline.');
      return;
    }
    const pid = patientIdFromUrl || demoPatient.id;
    const uid = user?.uid;
    if (!uid) {
      setAnalysisError('User not authenticated.');
      return;
    }
    setAnalysisError(null);
    try {
      const sourceSessionId = sessionId || `${uid}-${sessionStartTime.getTime()}`;
      const baselineId = await createBaseline({
        patientId: pid,
        sourceSoapId: sourceSessionId,
        sourceSessionId,
        snapshot: {
          primaryAssessment: localSoapNote.assessment ?? '',
          keyFindings: [localSoapNote.subjective ?? '', localSoapNote.objective ?? ''].filter(Boolean),
          precautions: localSoapNote.precautions ? [localSoapNote.precautions] : undefined,
          planSummary: localSoapNote.plan ?? '',
        },
        createdBy: uid,
      });
      await PatientService.updatePatient(pid, { activeBaselineId: baselineId });
      const now = new Date().toISOString();
      setInitialAssessmentClosedAt(now);
      setBaselineIdFromSession(baselineId);
      // ... SessionStorage.saveSession(...)
      setSuccessMessage('Initial Assessment closed. Baseline saved.');
      navigate('/command-center');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to close initial assessment.';
      setAnalysisError(message);
    }
  }, [...]);
```

**Conclusión sobre la confirmación visual:**

- Hoy **no hay modal de confirmación**. Solo:
  1. `setSuccessMessage('Initial Assessment closed. Baseline saved.')`
  2. `navigate('/command-center')` **inmediatamente después**.

- Al hacer `navigate()`, la página de workflow se desmonta, así que el mensaje de éxito (toast/banner que use `SuccessMessage` en esa página) **no llega a mostrarse** o se ve un instante y se pierde. El fisio pasa directo a Command Center sin una pantalla que diga explícitamente “Baseline guardado; ya puedes iniciar follow-ups”.

- **Certeza clínica:** La acción está bien (persistencia + redirect), pero la **certeza visual para el fisio no está resuelta**. Para tenerla, hace falta al menos una de:
  - Modal de confirmación **antes** de redirigir (“Baseline guardado. Serás redirigido al Command Center”), o
  - Modal/toast **en Command Center** tras llegar con un query/state tipo “acabas de cerrar initial” (“Initial Assessment cerrado. Baseline guardado.”), o
  - Mantener un toast en la página actual con un pequeño delay antes de `navigate()` para que el mensaje se vea (menos ideal que un modal explícito).

---

### 1.2 Dónde se usa createBaseline y contenido del servicio

```bash
grep -rn "createBaseline" src/
```

**Resultado:**

```
src/pages/ProfessionalWorkflowPage.tsx:70:import { createBaseline } from "../services/clinicalBaselineService";
src/pages/ProfessionalWorkflowPage.tsx:3278:      const baselineId = await createBaseline({
src/services/__tests__/sessionFeedingFlow.evidence.test.ts:65:// Casos ficticios (mismo formato que ProfessionalWorkflowPage → createBaseline)
src/services/clinicalBaselineService.ts:32:export async function createBaseline(params: {
```

```bash
cat src/services/clinicalBaselineService.ts
```

**Resultado (contenido del archivo):**

```ts
/**
 * WO-IA-CLOSE-01: Clinical Baselines — persist and read baseline from SOAP final.
 * Collection: clinical_baselines/{baselineId}
 * No refactor. No expansion.
 */

import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ClinicalBaselineSnapshot {
  primaryAssessment: string;
  keyFindings: string[];
  precautions?: string[];
  planSummary: string;
}

export interface ClinicalBaseline {
  id: string;
  patientId: string;
  sourceSoapId: string;
  sourceSessionId?: string;
  snapshot: ClinicalBaselineSnapshot;
  createdAt: unknown;
  createdBy: string;
}

const COLLECTION_NAME = 'clinical_baselines';

/**
 * Create a baseline document. Returns the new baseline id.
 */
export async function createBaseline(params: {
  patientId: string;
  sourceSoapId: string;
  sourceSessionId?: string;
  snapshot: ClinicalBaselineSnapshot;
  createdBy: string;
}): Promise<string> {
  const ref = doc(collection(db, COLLECTION_NAME));
  const id = ref.id;
  const now = serverTimestamp();
  await setDoc(ref, {
    patientId: params.patientId,
    sourceSoapId: params.sourceSoapId,
    ...(params.sourceSessionId != null && params.sourceSessionId !== '' && { sourceSessionId: params.sourceSessionId }),
    snapshot: {
      primaryAssessment: params.snapshot.primaryAssessment ?? '',
      keyFindings: Array.isArray(params.snapshot.keyFindings) ? params.snapshot.keyFindings : [],
      ...(params.snapshot.precautions != null && params.snapshot.precautions.length > 0 && { precautions: params.snapshot.precautions }),
      planSummary: params.snapshot.planSummary ?? '',
    },
    createdAt: now,
    createdBy: params.createdBy,
  });
  return id;
}

export async function getBaselineById(baselineId: string): Promise<ClinicalBaseline | null> {
  const ref = doc(db, COLLECTION_NAME, baselineId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    patientId: data.patientId ?? '',
    sourceSoapId: data.sourceSoapId ?? '',
    sourceSessionId: data.sourceSessionId,
    snapshot: {
      primaryAssessment: data.snapshot?.primaryAssessment ?? '',
      keyFindings: Array.isArray(data.snapshot?.keyFindings) ? data.snapshot.keyFindings : [],
      precautions: data.snapshot?.precautions,
      planSummary: data.snapshot?.planSummary ?? '',
    },
    createdAt: data.createdAt,
    createdBy: data.createdBy ?? '',
  };
}
```

**Resumen createBaseline:**

- **Colección:** `clinical_baselines/{baselineId}`.
- **Escritura:** `setDoc` con `patientId`, `sourceSoapId`, `sourceSessionId` (opcional), `snapshot` (primaryAssessment, keyFindings, precautions, **planSummary**), `createdAt`, `createdBy`.
- **Retorno:** `id` del documento creado (usado como `activeBaselineId` en el paciente).

---

## 2. Respuesta directa para el CTO

| Pregunta | Respuesta |
|----------|-----------|
| ¿El cierre tiene la certeza visual que necesitas? | **No.** Solo hay `setSuccessMessage` + `navigate` inmediato; no hay modal de confirmación y el mensaje no se llega a ver de forma clara. Conviene agregar un modal de confirmación (o feedback explícito en Command Center / delay antes de redirigir). |
| ¿Qué contiene exactamente createBaseline? | Persistencia en `clinical_baselines/{id}` con snapshot estructurado (primaryAssessment, keyFindings, precautions, planSummary); retorna el id; el llamador actualiza `patient.activeBaselineId`. |

Con esto puedes decidir si se implementa el modal de confirmación (o la alternativa elegida) para cerrar la validación del cierre.
