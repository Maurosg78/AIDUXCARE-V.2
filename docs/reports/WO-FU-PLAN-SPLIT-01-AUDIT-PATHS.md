# WO-FU-PLAN-SPLIT-01: Audit — Follow-up vs Initial Assessment Paths

**Objetivo:** Separar plan en "Today's in-clinic treatment" y "Home Exercise Program (HEP)" solo en flujos de **follow-up**. Los paths **initial assessment** y **follow-up** son distintos y se retroalimentan en algunos puntos; este WO toca **exclusivamente follow-up** en cuanto a UI del split.

## Archivos tocados y alcance

| Archivo | Alcance | Gate / Notas |
|---------|---------|--------------|
| **ProfessionalWorkflowPage.tsx** | Compartido (initial + follow-up). Solo follow-up usa split. | `visitType === 'follow-up'`: inClinicItems/homeProgramItems, Bloque 1 (In-Clinic + HEP), focusToInject = inClinicItems. Initial: todayFocus, no Bloque 1, focusToInject = todayFocus. |
| **AnalysisTab.tsx** | Compartido. Solo follow-up puede ocultar "Today's treatment session". | `todayFocusBlockRenderedByParent`: solo en follow-up el parent pasa `true`; entonces AnalysisTab no renderiza SuggestedFocusEditor. Initial: prop `false`, comportamiento sin cambios. |
| **FollowUpWorkflowPage.tsx** | **Solo follow-up** (página dedicada). | Toda la página es follow-up; inClinicItems/homeProgramItems desde clinicalState.baselineSOAP.plan. |
| **HomeProgramBlock.tsx** | **Solo follow-up** (componente usado solo en contextos follow-up). | Usado en ProfessionalWorkflowPage cuando follow-up y en FollowUpWorkflowPage. |
| **derivePlanFromText.ts** | Utilidad; usada solo por flujos follow-up. | Sin visitType; llamada solo desde ProfessionalWorkflowPage (visitType === 'follow-up') y FollowUpWorkflowPage. |
| **planSplitKeywords.ts** | Utilidad; usada por derivePlanFromText. | Sin visitType. |

## Gates explícitos en código

- **ProfessionalWorkflowPage**
  - `inClinicItems` / `homeProgramItems`: poblados solo si `visitType === 'follow-up'` y `previousTreatmentPlan?.planText`.
  - Bloque 1 (In-Clinic + HEP): `visitType === 'follow-up' && (inClinicItems.length > 0 || homeProgramItems.length > 0)`.
  - SOAP context: `focusToInject = visitType === 'follow-up' ? inClinicItems : todayFocus`.
  - `todayFocusBlockRenderedByParent={visitType === 'follow-up'}` al AnalysisTab (Bloque 2).

- **AnalysisTab**
  - SuggestedFocusEditor y mensaje "Follow-up Conversation": `visitType === 'follow-up' && !todayFocusBlockRenderedByParent && ...`.
  - Log PROOF "Rendering Today's treatment session": mismo gate (solo cuando AnalysisTab realmente renderiza el bloque).

- **FollowUpWorkflowPage**
  - Página entera follow-up; no hay condicional por visitType.

## Initial assessment — sin cambios

- No usa `inClinicItems` ni `homeProgramItems`.
- No muestra Bloque 1 In-Clinic/HEP.
- Sigue usando `todayFocus` para SOAP cuando aplica.
- AnalysisTab en initial sigue mostrando "Today's treatment session" cuando hoy se usa (todayFocusBlockRenderedByParent = false).
