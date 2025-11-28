# ProfessionalWorkflowPage Refactoring - Execution Plan

## Current State
- **File**: `src/pages/ProfessionalWorkflowPage.tsx`
- **Size**: 4230 lines
- **Memory**: Consumes all laptop memory
- **Build**: Hangs during compilation
- **Backup**: ✅ `src/pages/ProfessionalWorkflowPage.tsx.backup-20251128-001853`

## Refactoring Strategy

### Phase 1: Extract Tab Components (HIGHEST IMPACT - ~2000 lines)

#### 1.1 AnalysisTab Component
- **Extract**: `renderAnalysisTab()` function (lines 2845-3254)
- **Dependencies**: 
  - Patient data, consent logic, transcript area
  - Niagara results, clinical analysis
- **File**: `src/components/workflow/tabs/AnalysisTab.tsx`
- **Props**: All state and handlers needed

#### 1.2 EvaluationTab Component  
- **Extract**: `renderEvaluationTab()` function (lines 3428-3876)
- **Dependencies**:
  - Test library, evaluation tests state
  - Field rendering logic
- **File**: `src/components/workflow/tabs/EvaluationTab.tsx`
- **Props**: Tests state, handlers, library access

#### 1.3 SOAPTab Component
- **Extract**: `renderSoapTab()` function (lines 3877-4051)
- **Dependencies**:
  - SOAP generation logic
  - Workflow metrics
- **File**: `src/components/workflow/tabs/SOAPTab.tsx`
- **Props**: SOAP state, handlers, metrics

#### 1.4 TranscriptArea Component
- **Extract**: `renderTranscriptArea()` function (lines 2517-2830)
- **Dependencies**:
  - Recording logic
  - Audio waveform
- **File**: `src/components/workflow/TranscriptArea.tsx`
- **Props**: Recording state, handlers

### Phase 2: Extract Custom Hooks (~1000 lines)

#### 2.1 useWorkflowHandlers Hook
- **Extract**: All `handle*` functions
- **File**: `src/hooks/workflow/useWorkflowHandlers.ts`
- **Returns**: All handler functions

#### 2.2 useWorkflowState Hook
- **Extract**: State management logic
- **File**: `src/hooks/workflow/useWorkflowState.ts`
- **Returns**: State and setters

#### 2.3 useWorkflowPersistence Hook
- **Extract**: localStorage logic
- **File**: `src/hooks/workflow/useWorkflowPersistence.ts`
- **Returns**: Save/restore functions

### Phase 3: Dynamic Imports
- Use `React.lazy()` for tab components
- Code splitting for better performance

## Implementation Steps

1. ✅ Create backup
2. ⏳ Extract TranscriptArea (simplest, ~300 lines)
3. ⏳ Extract AnalysisTab (~600 lines)
4. ⏳ Extract EvaluationTab (~800 lines)
5. ⏳ Extract SOAPTab (~400 lines)
6. ⏳ Extract handlers hook
7. ⏳ Extract state hook
8. ⏳ Add dynamic imports
9. ⏳ Test & verify

## Expected Results

- **Main File**: ~800-1000 lines (75% reduction)
- **Memory Usage**: Significantly reduced
- **Build Time**: Faster compilation
- **Maintainability**: Much improved
- **ISO Compliance**: Better code organization

## Risk Mitigation

- ✅ Backup created
- ⏳ Test each extraction incrementally
- ⏳ Keep functionality identical
- ⏳ Verify build after each phase

---
**Date**: November 28, 2025  
**Status**: ✅ **BACKUP CREATED - READY TO START PHASE 1**


