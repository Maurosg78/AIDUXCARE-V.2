# CTO: Dos caminos — baseline (clinical_baselines) vs TreatmentPlanService

**Fecha:** 2026-01-31  
**Objetivo:** Confirmar dónde se rompe la cadena: si el follow-up de Javier Doe consume `clinical_baselines` o `TreatmentPlanService`.

---

## 1. Outputs solicitados

### 1.1 activeBaselineId en patientService

```bash
grep -n "activeBaselineId" src/services/patientService.ts
```

**Resultado:**

```
80:  activeBaselineId?: string;
369:          ...(data.activeBaselineId != null && data.activeBaselineId !== '' && { activeBaselineId: data.activeBaselineId as string }),
```

**Conclusión:** El paciente tiene el campo `activeBaselineId` en la interfaz y se mapea desde Firestore al leer. Si Javier Doe cerró el Initial Assessment, su documento en `patients/{id}` debería tener `activeBaselineId` apuntando a `clinical_baselines/{id}`.

---

### 1.2 Origen de inClinicItems / homeProgramItems en FollowUpWorkflowPage

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

**Origen real en FollowUpWorkflowPage (líneas 269-286):**

```ts
// WO-FU-PLAN-SPLIT-01: derive In-Clinic vs HEP from baselineSOAP.plan (presentation only)
useEffect(() => {
  if (!clinicalState?.baselineSOAP?.plan) {
    setInClinicItems([]);
    setHomeProgramItems([]);
    return;
  }
  const derived = derivePlanFromText(clinicalState.baselineSOAP.plan);
  setInClinicItems(...);
  setHomeProgramItems(derived.homeProgram);
}, [clinicalState?.baselineSOAP?.plan]);
```

**Conclusión:** En **FollowUpWorkflowPage** (página dedicada `/follow-up?patientId=X`), `inClinicItems` y `homeProgramItems` vienen de **clinicalState.baselineSOAP.plan**, y `clinicalState` viene de **getClinicalState() → getBaselineSafe() → getBaselineById(activeBaselineId)**. Es decir, en esta página se usa **CAMINO A (clinical_baselines)**.

---

### 1.3 treatmentPlan / TreatmentPlan / fallback en FollowUpWorkflowPage

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

**Conclusión:** En **FollowUpWorkflowPage** sí se carga `previousTreatmentPlan` con `treatmentPlanService.getTreatmentPlan(patientId)` (líneas 220-231), pero **no** se usa para rellenar `inClinicItems` ni `homeProgramItems`. Esos se rellenan solo desde `clinicalState.baselineSOAP.plan` (useEffect 269-286). `previousTreatmentPlan` en FollowUpWorkflowPage se usa en la UI en la línea 570 (por ejemplo un indicador “Previous treatment plan loaded”), no como fuente del split In-Clinic/HEP.

---

## 2. Dónde está el desacople: dos páginas, dos fuentes

El log que citó el CTO es:

```text
[WO-05-FIX][PROOF] todayFocus initialized from previousTreatmentPlan
```

Ese log **no** sale de FollowUpWorkflowPage. Sale de **AnalysisTab** (dentro de **ProfessionalWorkflowPage**), que recibe `previousTreatmentPlan` y llama a `parsePlanToFocusItems(previousTreatmentPlan.planText)` y luego `onTodayFocusChange(parsed)`. Es decir:

| Página | URL típica | Fuente del plan para In-Clinic / HEP |
|--------|------------|--------------------------------------|
| **FollowUpWorkflowPage** | `/follow-up?patientId=X` | **clinicalState.baselineSOAP.plan** (getClinicalState → getBaselineSafe → clinical_baselines) |
| **ProfessionalWorkflowPage** (follow-up) | `/workflow?patientId=X&type=followup` | **previousTreatmentPlan.planText** (treatmentPlanService.getTreatmentPlan) |

Si Javier Doe se abrió por **workflow con type=followup** (ProfessionalWorkflowPage), entonces los datos que ve (incluido el HEP) vienen de **TreatmentPlanService**, no de **clinical_baselines**. Ahí se cumple el “CAMINO B” que describió el CTO: createBaseline escribe en clinical_baselines, pero esa ruta **no lee** de ahí; lee de treatmentPlanService.

En cambio, si se entra por la **página dedicada** `/follow-up?patientId=X` (FollowUpWorkflowPage), ahí sí se usa **clinical_baselines** (getClinicalState → baselineSOAP) y no TreatmentPlanService para el split.

---

## 3. Resumen para el CTO

1. **activeBaselineId:** Está en el modelo del paciente y se persiste/lee en patientService; si Javier cerró el IA, puede tener `activeBaselineId` en Firestore (habría que revisar el documento de Javier en la consola).
2. **FollowUpWorkflowPage:** In-Clinic/HEP se inicializan **solo** desde `clinicalState.baselineSOAP.plan` (CAMINO A). No hay fallback a treatmentPlan para ese split.
3. **ProfessionalWorkflowPage (follow-up):** In-Clinic/HEP se inicializan desde **previousTreatmentPlan.planText** (treatmentPlanService). No usa getClinicalState ni baselineSOAP en ese flujo (CAMINO B).

Por tanto: **la cadena se “rompe” en el sentido de que, al entrar por workflow con type=followup, nadie lee clinical_baselines para ese flujo.** El baseline de Javier puede estar creado y con activeBaselineId, pero si la sesión que estás viendo es la de ProfessionalWorkflowPage, lo que ves en pantalla viene de TreatmentPlanService.

**Acción recomendada:** Unificar la fuente del plan en follow-up: que **ProfessionalWorkflowPage** cuando `visitType === 'follow-up'` también use **getClinicalState** y, si `clinicalState.baselineSOAP?.plan` existe, derive inClinicItems/homeProgramItems de ahí; y solo usar **previousTreatmentPlan.planText** como fallback cuando no haya baseline (por ejemplo paciente sin “Close Initial Assessment” previo).
