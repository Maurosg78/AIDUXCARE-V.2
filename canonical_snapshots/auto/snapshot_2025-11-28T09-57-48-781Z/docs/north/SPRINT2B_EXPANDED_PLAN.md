# Sprint 2B Expanded - Implementation Plan
## UX Redesign + Navigation Architecture + Context-Sensitive Workflows

**Status:** 🚧 IN PROGRESS  
**Duration:** 12 days (extended from 7 days)  
**Start Date:** $(date)

---

## 📋 SCOPE OVERVIEW

### Original Sprint 2B (Completed ✅)
- WSIB/MVA document templates
- PDF generation integration
- Certificate templates

### Expanded Scope (In Progress 🚧)
- Command Center UX redesign
- Context-sensitive workflow interfaces
- Complete navigation routing system
- Emergency slot workflow
- Scheduling system foundation
- Dynamic feature access system

---

## 🗓️ DAILY BREAKDOWN

### **DAY 1-2: Navigation & Routing Foundation** 🚧 IN PROGRESS

#### Deliverables:
1. ✅ Session state types and interfaces
2. ✅ Navigation context types
3. ✅ Route definitions and structure
4. ✅ State persistence utilities
5. ✅ Protected route guards

#### Files to Create:
- `src/types/sessionState.ts` - Session state interfaces
- `src/types/navigation.ts` - Navigation context types
- `src/utils/sessionPersistence.ts` - State persistence utilities
- `src/router/routes.tsx` - Route definitions
- `src/components/navigation/ProtectedRoute.tsx` - Route guards

---

### **DAY 3-4: Command Center Redesign**

#### Deliverables:
1. Redesigned CommandCenter component
2. Contextual dashboard states
3. Dynamic action buttons
4. Today's appointments integration

#### Files to Create/Modify:
- `src/features/command-center/CommandCenterPage.tsx` (redesign)
- `src/components/command-center/DashboardState.tsx`
- `src/components/command-center/ContextualActions.tsx`
- `src/hooks/useCommandCenter.ts`

---

### **DAY 5-6: Context-Sensitive Workflows**

#### Deliverables:
1. Workflow component architecture
2. Session-type specific workflows
3. Dynamic workflow loader
4. Context switching logic

#### Files to Create:
- `src/components/workflows/InitialAssessmentWorkflow.tsx`
- `src/components/workflows/FollowUpWorkflow.tsx`
- `src/components/workflows/WSIBWorkflow.tsx`
- `src/components/workflows/MVAWorkflow.tsx`
- `src/components/workflows/EmergencyWorkflow.tsx`
- `src/components/workflows/CertificateWorkflow.tsx`
- `src/components/workflows/DynamicWorkflow.tsx`

---

### **DAY 7-8: Dynamic Feature Access System**

#### Deliverables:
1. SmartSidebar component
2. Feature stacking system
3. Contextual action detection
4. Output management hooks

#### Files to Create:
- `src/components/navigation/SmartSidebar.tsx`
- `src/hooks/useSessionOutputs.ts`
- `src/hooks/useContextualActions.ts`
- `src/components/navigation/FeatureStack.tsx`

---

### **DAY 9: Emergency Slot & Scheduling**

#### Deliverables:
1. Emergency intake workflow
2. Basic scheduling system
3. Appointment integration

#### Files to Create:
- `src/pages/EmergencyIntake.tsx`
- `src/pages/Scheduling.tsx`
- `src/components/scheduling/TimeSlotSelector.tsx`
- `src/hooks/useScheduling.ts`

---

### **DAY 10-12: Integration & Testing**

#### Deliverables:
1. GlobalNavigation component
2. State persistence system
3. Integration testing
4. Polish and refinement

#### Files to Create:
- `src/components/navigation/GlobalNavigation.tsx`
- `src/components/navigation/SessionStatusBar.tsx`
- `src/utils/sessionPersistence.ts` (enhancement)
- Integration tests

---

## 📊 PROGRESS TRACKING

### Day 1-2: Navigation & Routing Foundation
- [ ] Session state types
- [ ] Navigation context types
- [ ] Route definitions
- [ ] State persistence utilities
- [ ] Protected route guards

### Day 3-4: Command Center Redesign
- [ ] Redesigned component
- [ ] Contextual states
- [ ] Dynamic actions
- [ ] Appointments integration

### Day 5-6: Context-Sensitive Workflows
- [ ] Workflow architecture
- [ ] InitialAssessmentWorkflow
- [ ] FollowUpWorkflow
- [ ] WSIBWorkflow
- [ ] MVAWorkflow
- [ ] EmergencyWorkflow
- [ ] CertificateWorkflow
- [ ] DynamicWorkflow loader

### Day 7-8: Dynamic Feature Access
- [ ] SmartSidebar
- [ ] Feature stacking
- [ ] Contextual actions
- [ ] Output management

### Day 9: Emergency & Scheduling
- [ ] EmergencyIntake page
- [ ] Scheduling page
- [ ] TimeSlotSelector
- [ ] Scheduling hooks

### Day 10-12: Integration & Testing
- [ ] GlobalNavigation
- [ ] SessionStatusBar
- [ ] State persistence
- [ ] Integration tests
- [ ] Polish

---

## ✅ DEFINITION OF DONE

### Navigation & UX:
- [ ] All navigation routes implemented and tested
- [ ] Command Center redesigned with contextual states
- [ ] Context-sensitive workflow interfaces working
- [ ] Dynamic feature access system functional
- [ ] Emergency slot workflow complete
- [ ] Basic scheduling system implemented

### Session Management:
- [ ] Session state persists across navigation
- [ ] Multiple outputs can be added to single session
- [ ] Workflow switching works mid-session
- [ ] Return to Center always functional

### User Experience:
- [ ] Maximum 3 taps from patient selection to recording
- [ ] Context-appropriate actions surface automatically
- [ ] No feature overwhelm - progressive disclosure working
- [ ] Apple-style clean, elegant interface maintained

---

**Last Updated:** $(date)

