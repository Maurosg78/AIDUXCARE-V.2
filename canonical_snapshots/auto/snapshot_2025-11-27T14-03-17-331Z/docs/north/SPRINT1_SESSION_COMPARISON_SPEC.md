# 🏃‍♂️ SPRINT 1: SESSION COMPARISON ENGINE
## Especificaciones Técnicas Completas

**Sprint Goal:** Implementar comparación automática entre sesiones  
**Duration:** 5 días hábiles  
**Start Date:** Inmediato  
**Sprint Owner:** Desarrollador Principal

---

## 📋 SPRINT BACKLOG

### **User Story:**

```
Como fisioterapeuta,
Quiero ver automáticamente cómo progresa mi paciente comparado con la sesión anterior,
Para tomar decisiones clínicas informadas sin revisar manualmente el historial completo.

Valor Estimado: Alto (diferenciador competitivo)
Complejidad: Media (5 story points)
```

---

## 🎯 ACCEPTANCE CRITERIA (FINAL)

### **Functional Requirements:**

```
AC1: WHEN paciente tiene >1 sesión anterior
     THEN sistema muestra automáticamente comparación

AC2: WHEN genero nuevo SOAP
     THEN veo métricas: anterior vs actual

AC3: WHEN hay regresión >20% en métricas clave
     THEN sistema muestra alerta visual

AC4: WHEN paciente es nuevo (0 sesiones anteriores)
     THEN sistema muestra "Primera sesión - sin comparación disponible"

AC5: WHEN cargo comparación
     THEN tiempo de respuesta <2 segundos
```

### **Technical Requirements:**

```
TR1: Service layer para lógica de comparación
TR2: React component para UI de comparación
TR3: Integration con workflow existente
TR4: Error handling para edge cases
TR5: Performance optimization para pacientes con many sessions
```

---

## 🔧 IMPLEMENTATION SPECS

### **Archivo 1: `src/services/sessionComparisonService.ts`**

**Responsibility:** Core business logic para comparación

**Required Functions:**

```typescript
interface SessionComparisonService {
  // Get previous session for comparison
  getPreviousSession(patientId: string, currentSessionId: string): Promise<Session | null>
  
  // Compare two sessions and return metrics
  compareSessions(previous: Session, current: Session): SessionComparison
  
  // Determine if regression occurred
  detectRegression(comparison: SessionComparison): RegressionAlert[]
  
  // Format comparison for UI display
  formatComparisonForUI(comparison: SessionComparison): ComparisonDisplayData
}

interface SessionComparison {
  patientId: string
  previousSession: {
    id: string
    date: Date
    metrics: SessionMetrics
  }
  currentSession: {
    id: string  
    date: Date
    metrics: SessionMetrics
  }
  deltas: {
    painLevel: number        // -2 to +2 scale
    rangeOfMotion: number    // percentage change
    functionalTests: {
      [testName: string]: number // percentage change
    }
    overallProgress: 'improved' | 'stable' | 'regressed'
  }
  alerts: RegressionAlert[]
}
```

**Performance Requirement:** <500ms para comparison logic

---

### **Archivo 2: `src/components/SessionComparison.tsx`**

**Responsibility:** UI component para mostrar comparación

**Required Props:**

```typescript
interface SessionComparisonProps {
  patientId: string
  currentSessionId?: string
  isLoading?: boolean
  onComparisonLoad?: (comparison: SessionComparison) => void
}
```

**Required UI Elements:**

```
📊 Metrics Comparison Panel:
├── Previous Session Date & Metrics
├── Current Session Date & Metrics  
├── Delta Indicators (↑↓→ with colors)
├── Progress Summary ("Improved", "Stable", "Regressed")
└── Regression Alerts (if any)

🎨 Visual Requirements:
├── Green ↑ for improvement
├── Red ↓ for regression  
├── Gray → for stable
├── Warning icon for alerts
└── Professional medical UI styling
```

**Loading States:**
- Loading skeleton while fetching data
- Error state for failed comparisons
- Empty state for new patients

---

### **Archivo 3: Modificar `src/pages/ProfessionalWorkflowPage.tsx`**

**Integration Points:**

```
1. Import SessionComparison component
2. Add comparison panel to right sidebar
3. Trigger comparison when SOAP is generated
4. Handle loading states appropriately
```

**Placement:** Right sidebar, below patient info, above session history

---

## 🧪 TESTING REQUIREMENTS

### **Unit Tests (Required Coverage: >80%)**

**File: `src/services/__tests__/sessionComparisonService.test.ts`**

```javascript
describe('SessionComparisonService', () => {
  test('getPreviousSession - returns null for new patient')
  test('getPreviousSession - returns most recent session')  
  test('compareSession - calculates correct deltas')
  test('compareSession - detects improvement correctly')
  test('compareSession - detects regression correctly')
  test('detectRegression - triggers alert at >20% regression')
  test('detectRegression - no alert for <20% regression')
})
```

**File: `src/components/__tests__/SessionComparison.test.tsx`**

```javascript
describe('SessionComparison Component', () => {
  test('renders loading state correctly')
  test('renders comparison data correctly')
  test('shows improvement indicators correctly')  
  test('shows regression alerts correctly')
  test('handles new patient case correctly')
  test('handles error state correctly')
})
```

### **Integration Tests**

```javascript
describe('Session Comparison Integration', () => {
  test('full workflow - load comparison in ProfessionalWorkflowPage')
  test('performance - comparison loads in <2 seconds')
  test('edge case - patient with 50+ sessions performance')
})
```

### **Performance Tests**

```
Benchmark Requirements:
- Comparison calculation: <500ms
- UI render with comparison: <2s total
- Memory usage: <100MB additional
```

---

## 📅 DAILY BREAKDOWN

### **Day 1: Service Layer**
**Focus:** Core comparison logic

**Deliverables:**
- [ ] `sessionComparisonService.ts` implemented
- [ ] Unit tests for service layer
- [ ] Performance benchmarks documented

**DoD Day 1:**
- [ ] Service functions working
- [ ] Unit tests >80% coverage
- [ ] Performance <500ms verified

---

### **Day 2: UI Component**
**Focus:** SessionComparison React component

**Deliverables:**
- [ ] `SessionComparison.tsx` component complete
- [ ] Component unit tests
- [ ] Visual design mockup approved

**DoD Day 2:**
- [ ] Component renders correctly
- [ ] All UI elements functional
- [ ] Component tests passing

---

### **Day 3: Integration**  
**Focus:** Integrate into main workflow

**Deliverables:**
- [ ] Integration in `ProfessionalWorkflowPage.tsx`
- [ ] Integration tests
- [ ] End-to-end testing

**DoD Day 3:**
- [ ] Integration working in dev environment
- [ ] E2E tests passing
- [ ] No breaking changes to existing functionality

---

### **Day 4: Polish & Edge Cases**
**Focus:** Handle edge cases, performance optimization

**Deliverables:**
- [ ] Edge case handling (new patients, errors, etc.)
- [ ] Performance optimization
- [ ] UI/UX refinements

**DoD Day 4:**
- [ ] All edge cases handled gracefully
- [ ] Performance requirements met
- [ ] UI approved by stakeholder

---

### **Day 5: Final Testing & Demo**
**Focus:** Comprehensive testing, demo preparation

**Deliverables:**
- [ ] Complete test suite execution
- [ ] Demo video recording
- [ ] Sprint retrospective document

**DoD Day 5:**
- [ ] All tests passing
- [ ] Demo approved by stakeholder
- [ ] No critical bugs
- [ ] Sprint retrospective completed

---

## 📊 SUCCESS METRICS

### **Technical Metrics:**
- [ ] Unit test coverage >80%
- [ ] Performance <2s end-to-end
- [ ] Zero critical bugs
- [ ] Zero breaking changes to existing features

### **Business Metrics (to measure post-deployment):**
- [ ] >60% of sessions use comparison feature
- [ ] Positive user feedback on utility
- [ ] Reduced time spent reviewing patient history manually

---

## 🚨 RISK MITIGATION

### **High Risk: Performance with Large Patient Histories**
**Mitigation:** 
- Implement pagination for session retrieval
- Cache comparison results
- Index database queries properly

### **Medium Risk: UI Complexity**
**Mitigation:**
- Keep initial UI simple, iterate based on feedback
- Implement progressive disclosure
- User testing with real physiotherapists

### **Low Risk: Integration Issues**
**Mitigation:**
- Thorough integration testing
- Feature flags for gradual rollout
- Rollback plan prepared

---

## ✅ DEFINITION OF DONE (SPRINT LEVEL)

### **Code Quality:**
- [ ] All code peer reviewed
- [ ] No linting errors
- [ ] Code follows established patterns
- [ ] Documentation updated

### **Testing:**
- [ ] Unit tests >80% coverage
- [ ] Integration tests passing
- [ ] Performance tests passing
- [ ] Manual testing completed

### **Deployment:**
- [ ] Feature deployed to dev environment
- [ ] Basic smoke testing passed
- [ ] Demo environment ready
- [ ] Rollback plan tested

### **Stakeholder Approval:**
- [ ] Live demo conducted
- [ ] Stakeholder sign-off received
- [ ] User feedback collected (if available)
- [ ] Next sprint planning input provided

---

## 📞 DAILY STANDUP FORMAT

**Daily Questions:**
1. What did you complete yesterday toward Sprint Goal?
2. What will you complete today toward Sprint Goal?  
3. What blockers need CTO resolution?
4. Are you on track for your day's DoD?

**Escalation Triggers:**
- Any day's DoD not met → Immediate CTO review
- Performance benchmarks not met → Architecture review
- Integration issues → Immediate tech debt prioritization

---

## 🎯 SPRINT REVIEW CRITERIA

### **Demo Script:**

```
1. "Show patient with previous session"
2. "Generate new SOAP note" 
3. "Comparison appears automatically"
4. "Explain metrics and indicators"
5. "Show regression alert example"
6. "Show new patient case (no comparison)"
```

### **Acceptance:**
- [ ] Demo successful with zero critical issues
- [ ] Performance requirements verified live
- [ ] Stakeholder approval obtained
- [ ] Ready to proceed to Sprint 2

---

**CTO Authorization Required:** Sprint does not proceed without explicit CTO approval of Day 1 deliverables.

**Start Command:** Execute immediately upon CTO approval.

---

## 📍 UBICACIÓN DE DOCUMENTOS

Todos los documentos están en:
- `/docs/ESTADO_ACTUAL_PROYECTO.md` - Análisis detallado
- `/docs/RESUMEN_EJECUTIVO_ESTADO_ACTUAL.md` - Resumen ejecutivo
- `/docs/PLAN_ACCION_ORDENADO.md` - Plan de acción
- `/docs/INDICE_DOCUMENTOS_ACTUALES.md` - Índice completo
- `/docs/north/SPRINT1_SESSION_COMPARISON_SPEC.md` - Este documento

