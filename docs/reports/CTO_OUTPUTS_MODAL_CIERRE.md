# CTO: Outputs para modal de cierre (confirmación visual)

**Fecha:** 2026-01-31  
**Objetivo:** Dar los dos outputs solicitados para implementar el modal de confirmación del cierre de Initial Assessment.

---

## 1. Output 1: Uso de successMessage en la página

```bash
grep -n "successMessage\|SuccessMessage\|setSuccessMessage" src/pages/ProfessionalWorkflowPage.tsx
```

**Resultado:**

```
37:import { SuccessMessage } from "../components/ui/SuccessMessage";
291:  const [successMessage, setSuccessMessage] = useState<string | null>(null);
1075:          setSuccessMessage(null); // Clear any previous success messages
3310:      setSuccessMessage('Initial Assessment closed. Baseline saved.');
3438:        setSuccessMessage('SOAP note saved successfully to Clinical Vault.');
4081:                  successMessage={successMessage}
4083:                  setSuccessMessage={setSuccessMessage}
4132:                  successMessage={successMessage}
4134:                  setSuccessMessage={setSuccessMessage}
4306:                  successMessage={successMessage}
4308:                  setSuccessMessage={setSuccessMessage}
4374:                  successMessage={successMessage}
4376:                  setSuccessMessage={setSuccessMessage}
4430:              setSuccessMessage('Consent obtained. You can now proceed with the clinical workflow.');
4482:              setSuccessMessage(
```

**Conclusión:** `SuccessMessage` es un componente de feedback (toast/banner) que se pasa a AnalysisTab, SOAPTab, EvaluationTab, etc. No es un modal. Para el cierre se necesita un **modal dedicado** (confirmación explícita, botón "Ir al Command Center"), no reutilizar solo SuccessMessage.

---

## 2. Output 2: Imports actuales (primeras 80 líneas)

```bash
sed -n '1,80p' src/pages/ProfessionalWorkflowPage.tsx
```

**Resultado:**

```ts
// @ts-nocheck
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Play, Square, Mic, Loader2, CheckCircle, Download, Copy, Brain, Stethoscope, ClipboardList, ChevronsRight, AlertCircle, UploadCloud, Paperclip, X, FileText, Users, Plus, Info } from "lucide-react";
import type { WhisperSupportedLanguage } from "../services/OpenAIWhisperService";
import { useSharedWorkflowState } from "../hooks/useSharedWorkflowState";
import { useNiagaraProcessor } from "../hooks/useNiagaraProcessor";
import { useTranscript } from "../hooks/useTranscript";
import { useTimer } from "../hooks/useTimer";
import sessionService from "../services/sessionService";
import { useAuth } from "../hooks/useAuth";
import { useProfessionalProfile as useProfessionalProfileContext } from "../context/ProfessionalProfileContext";
import type { ClinicalAnalysis } from "../utils/cleanVertexResponse";
import type { SOAPNote } from "../types/vertex-ai";
import { ClinicalAnalysisResults } from "../components/ClinicalAnalysisResults";
import ClinicalAttachmentService, { ClinicalAttachment } from "../services/clinicalAttachmentService";
import { matchTestName } from "@/core/msk-tests/matching/fuzzyMatch";
import { SOAPEditor, type SOAPStatus } from "../components/SOAPEditor";
import { buildSOAPContext, detectVisitType, validateSOAPContext, type VisitType } from "../core/soap/SOAPContextBuilder";
import { generateSOAPNote as generateSOAPNoteFromService } from "../services/vertex-ai-soap-service";
import { buildPhysicalExamResults, buildPhysicalEvaluationSummary } from "../core/soap/PhysicalExamResultBuilder";
import { organizeSOAPData, validateUnifiedData, createDataSummary, type UnifiedClinicalData } from "../core/soap/SOAPDataOrganizer";
import { AnalyticsService } from "../services/analyticsService";
import type { ValueMetricsEvent } from "../services/analyticsService";
import { checkConsentViaServer } from "../services/consentServerService";
import { VerbalConsentService } from "../services/verbalConsentService";
import { SMSService } from "../services/smsService";
import { resolveConsentChannel } from "@/domain/consent/resolveConsentChannel";
import { getCurrentJurisdiction } from "@/core/consent/consentJurisdiction";
import { ConsentVerificationService } from "../services/consentVerificationService";
import { PatientService, type Patient } from "../services/patientService";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import treatmentPlanService from "../services/treatmentPlanService";
import PersistenceService from "../services/PersistenceService";
import { FeedbackWidget } from "../components/feedback/FeedbackWidget";
import { FeedbackService } from "../services/feedbackService";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { SuccessMessage } from "../components/ui/SuccessMessage";
import { LoadingSpinner, InlineLoading } from "../components/ui/LoadingSpinner";
import { InitialPlanModal } from "../components/treatment-plan/InitialPlanModal";
import UniversalShareMenu, { ShareOptions } from "../components/share/UniversalShareMenu";
import { VerbalConsentModal } from "../components/consent/VerbalConsentModal";
import { ConsentGateScreen } from "../components/consent/ConsentGateScreen";
import { DeclinedConsentModal } from "../components/consent/DeclinedConsentModal";
import {
  MSK_TEST_LIBRARY,
  regions,
  regionLabels,
  type MSKRegion,
  type MskTestDefinition,
  type PhysicalTest,
  type TestFieldDefinition,
  hasFieldDefinitions,
  getTestDefinition,
} from "@/core/msk-tests/library/mskTestLibrary";
import { sortPhysicalTestsByImportance, getTopPhysicalTests } from "@/utils/sortPhysicalTestsByImportance";
import { deriveClinicName, deriveClinicianDisplayName } from "@/utils/clinicProfile";
import { AudioWaveform } from "../components/AudioWaveform";
import SessionComparison from "../components/SessionComparison";
import type { Session } from "../services/sessionComparisonService";
import { Timestamp, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import tokenTrackingService from "../services/tokenTrackingService";
import logger from "@/shared/utils/logger";
import { useLastEncounter } from "../features/patient-dashboard/hooks/useLastEncounter";
import { useActiveEpisode } from "../features/patient-dashboard/hooks/useActiveEpisode";
import { usePatientVisitCount } from "../features/patient-dashboard/hooks/usePatientVisitCount";
import { SessionTypeService } from "../services/sessionTypeService";
import { getPublicBaseUrl } from "../utils/urlHelpers";
import { SessionStorage } from "../services/session-storage";
import { createBaseline } from "../services/clinicalBaselineService";
// ...
import { routeWorkflow, shouldSkipTab, getInitialTab, type WorkflowRoute } from "../services/workflowRouterService";
import type { FollowUpDetectionInput } from "../services/followUpDetectionService";
import WorkflowFeedback from "../components/workflow/WorkflowFeedback";
```

**Componentes modales ya usados en la página:** `InitialPlanModal`, `VerbalConsentModal`, `ConsentGateScreen`, `DeclinedConsentModal`. El patrón de `DeclinedConsentModal` (overlay, header, contenido, botón que hace `navigate('/command-center')`) es reutilizable para un modal de confirmación de cierre.

---

## 3. Componentes existentes que pueden servir de referencia

- **DeclinedConsentModal** (`src/components/consent/DeclinedConsentModal.tsx`): overlay `fixed inset-0`, `max-w-md`, header con icono, contenido, botón "Return to Command Center" que llama `navigate('/command-center')` y `onClose()`. Mismo patrón deseado para el modal de cierre (pero con mensaje de éxito y resumen mínimo).
- **InitialPlanModal**: `isOpen`, `onClose`, props de paciente; más complejo (formulario). Para el cierre basta un modal de confirmación simple (solo mensaje + resumen + botón).

Con estos dos outputs puedes crear el modal nuevo (por ejemplo `CloseInitialAssessmentConfirmModal`) y enlazarlo en `handleCloseInitialAssessment`: tras `createBaseline` + `updatePatient` + guardar estado de sesión, setear estado para mostrar el modal (y opcionalmente datos para el resumen: patientName, baselineId); **no** llamar `navigate()` hasta que el usuario pulse "Go to Command Center" en el modal.

---

## 4. Outputs para cadena Baseline vs TreatmentPlan (Follow-Up)

**Objetivo:** Confirmar si el baseline de Javier se creó y nadie lo lee, o si nunca se creó. El CTO observó en logs: `[WO-05-FIX][PROOF] todayFocus initialized from previousTreatmentPlan` — es decir, el HEP visible viene de TreatmentPlanService, no de `clinical_baselines`.

### 4.1. ¿Javier Doe tiene activeBaselineId en Firestore? (código)

```bash
grep -n "activeBaselineId" src/services/patientService.ts
```

**Resultado:**

```
80:  activeBaselineId?: string;
369:          ...(data.activeBaselineId != null && data.activeBaselineId !== '' && { activeBaselineId: data.activeBaselineId as string }),
```

**Conclusión:** El modelo y la persistencia de `activeBaselineId` están en `patientService.ts` (interface línea 80; actualización en 369). Si el cierre de Initial Assessment se ejecutó correctamente, Firestore tendría `patients/{id}.activeBaselineId`. Para confirmar en runtime hay que inspeccionar el documento del paciente en Firestore (no se puede ver solo con grep).

---

### 4.2. De dónde se inicializa el HEP en el follow-up

```bash
grep -n "homeProgramItems\|inClinicItems\|todayFocus" src/pages/FollowUpWorkflowPage.tsx | head -20
```

**Resultado:**

```
85:  const [inClinicItems, setInClinicItems] = useState<TodayFocusItem[]>([]);
86:  const [homeProgramItems, setHomeProgramItems] = useState<string[]>([]);
298:    const hasChecklist = inClinicItems.length > 0;
328:        inClinicToday: inClinicItems.map((item) => ({
333:        homeProgramPrescribed: homeProgramItems.length > 0 ? homeProgramItems : undefined,
372:  }, [clinicalState?.hasBaseline, patientId, inClinicItems, transcript]);
606:          {showFollowUpFlow && inClinicItems.length > 0 && (
624:                items={inClinicItems}
634:          {showFollowUpFlow && homeProgramItems.length > 0 && (
635:            <HomeProgramBlock items={homeProgramItems} onChange={setHomeProgramItems} />
```

En **FollowUpWorkflowPage** la inicialización real está en un `useEffect` (no mostrado en este grep) que depende de `clinicalState?.baselineSOAP?.plan` y llama a `derivePlanFromText` → `setInClinicItems` / `setHomeProgramItems`. Es decir: en la página dedicada `/follow-up?patientId=X` el HEP **sí** viene del baseline (Camino A).

El log `[WO-05-FIX][PROOF] todayFocus initialized from treatmentPlan` **no** sale de FollowUpWorkflowPage; sale de **AnalysisTab.tsx** (líneas 228-236), que se usa dentro de **ProfessionalWorkflowPage** cuando entras por `/workflow?patientId=X&type=followup` (Camino B).

---

### 4.3. ¿Hay fallback de baseline a treatmentPlan en FollowUpWorkflowPage?

```bash
grep -n "treatmentPlan\|TreatmentPlan\|fallback" src/pages/FollowUpWorkflowPage.tsx | head -20
```

**Resultado:**

```
21:import treatmentPlanService from "../services/treatmentPlanService";
87:  const [previousTreatmentPlan, setPreviousTreatmentPlan] = useState<any>(null);
220:    const loadTreatmentPlan = async () => {
222:        const plan = await treatmentPlanService.getTreatmentPlan(patientId);
224:          setPreviousTreatmentPlan(plan);
231:    loadTreatmentPlan();
570:                {previousTreatmentPlan && (
788:            <Suspense fallback={<LoadingSpinner />}>
```

**Conclusión:** En FollowUpWorkflowPage **no** hay fallback “baseline → treatmentPlan” para el HEP. El HEP/inClinic se derivan de `clinicalState.baselineSOAP.plan`. `previousTreatmentPlan` se carga aparte y se usa para **mostrar** que existe un plan previo (bloque con CheckCircle, línea 570), no como fuente del split In-Clinic/HEP.

---

### 4.4. Dónde se rompe la cadena (resumen para el CTO)

| Entrada | Fuente del HEP / todayFocus | ¿Usa baseline? |
|--------|------------------------------|-----------------|
| **FollowUpWorkflowPage** (`/follow-up?patientId=X`) | `clinicalState.baselineSOAP.plan` → `derivePlanFromText` | Sí (Camino A) |
| **ProfessionalWorkflowPage** (`/workflow?patientId=X&type=followup`) | `previousTreatmentPlan.planText` (y en AnalysisTab: `previousTreatmentPlan.planText` o `lastEncounter.soap.plan`) | No (Camino B) |

El mensaje de log que viste (`todayFocus initialized from previousTreatmentPlan`) viene de **AnalysisTab** dentro de **ProfessionalWorkflowPage** (Camino B). Ahí no se usa `getBaselineSafe` ni `clinical_baselines`; todo sale de TreatmentPlanService (o lastEncounter).

**Conclusión:** El baseline de Javier **probablemente sí se creó** al cerrar Initial Assessment (createBaseline + updatePatient con activeBaselineId). Lo que ocurre es que cuando el follow-up se abre por **workflow con type=followup**, nadie lee ese baseline: el HEP y todayFocus se rellenan solo desde TreatmentPlanService. Para confirmar al 100% que el baseline existe: revisar en Firestore `patients/{javierDoeId}.activeBaselineId` y que exista el documento `clinical_baselines/{id}`. Para unificar: hacer que ProfessionalWorkflowPage (cuando `visitType === 'follow-up'`) cargue clinicalState y use `baselineSOAP.plan` como fuente prioritaria, con fallback a `previousTreatmentPlan.planText` solo si no hay baseline.
