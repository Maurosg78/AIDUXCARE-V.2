# 📖 SessionComparison Component - Usage Documentation
## Sprint 1 - Day 2: UI Component

**Component:** `SessionComparison`  
**Location:** `src/components/SessionComparison.tsx`  
**Status:** ✅ Ready for Integration (Day 3)

---

## 🎯 OVERVIEW

The `SessionComparison` component displays a visual comparison between a patient's current session and their previous session. It shows metrics, progress indicators, and regression alerts.

---

## 📦 INSTALLATION & IMPORT

```typescript
import { SessionComparison } from '../components/SessionComparison';
import type { SessionComparisonProps } from '../components/SessionComparison';
import type { Session } from '../services/sessionComparisonService';
```

---

## 🔧 PROPS INTERFACE

```typescript
interface SessionComparisonProps {
  patientId: string;                    // Required: Patient ID
  currentSessionId?: string;            // Optional: Current session ID
  currentSession?: Session | null;      // Optional: Current session data object
  isLoading?: boolean;                   // Optional: External loading state
  onComparisonLoad?: (comparison: SessionComparison) => void; // Optional: Callback
  className?: string;                    // Optional: Additional CSS classes
}
```

---

## 💡 USAGE EXAMPLES

### **Basic Usage (with currentSession prop)**

```typescript
import { SessionComparison } from '../components/SessionComparison';
import type { Session } from '../services/sessionComparisonService';

function ProfessionalWorkflowPage() {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const patientId = 'patient-123';

  return (
    <div>
      <SessionComparison 
        patientId={patientId}
        currentSession={currentSession}
        onComparisonLoad={(comparison) => {
          console.log('Comparison loaded:', comparison);
        }}
      />
    </div>
  );
}
```

### **With Loading State**

```typescript
function ProfessionalWorkflowPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  return (
    <SessionComparison 
      patientId="patient-123"
      currentSession={currentSession}
      isLoading={isLoading}
    />
  );
}
```

### **With Callback**

```typescript
function ProfessionalWorkflowPage() {
  const handleComparisonLoad = (comparison: SessionComparison) => {
    // Store comparison data
    console.log('Previous session date:', comparison.previousSession.date);
    console.log('Overall progress:', comparison.deltas.overallProgress);
    console.log('Alerts:', comparison.alerts);
  };

  return (
    <SessionComparison 
      patientId="patient-123"
      currentSession={currentSession}
      onComparisonLoad={handleComparisonLoad}
    />
  );
}
```

---

## 🎨 VISUAL ELEMENTS

### **Delta Indicators**

- **↑ Green:** Improvement (pain decreased, ROM increased)
- **↓ Red:** Regression (pain increased, ROM decreased)
- **→ Gray:** Stable (<5% change)

### **Progress Summary**

- **✅ Improved:** Green background, upward arrow
- **⚠️ Regressed:** Red background, downward arrow
- **→ Stable:** Gray background, horizontal arrow

### **Regression Alerts**

- **Severe:** Red background, red border
- **Moderate:** Orange background, orange border
- **Mild:** Yellow background, yellow border

---

## 🔄 COMPONENT STATES

### **1. Loading State**
Shows a loading spinner while fetching comparison data.

```typescript
<SessionComparison patientId="patient-123" isLoading={true} />
```

### **2. Error State**
Shows error message with retry button.

```typescript
// Automatically displayed when fetch fails
// User can click "Retry" to refetch
```

### **3. First Session State**
Shows message for new patients with no previous sessions.

```typescript
// Automatically displayed when no previous session found
```

### **4. Comparison State**
Shows full comparison with metrics, deltas, and alerts.

```typescript
// Automatically displayed when comparison data is available
```

---

## 🔌 INTEGRATION POINTS

### **Day 3 Integration with ProfessionalWorkflowPage**

```typescript
// In ProfessionalWorkflowPage.tsx

import { SessionComparison } from '../components/SessionComparison';
import type { Session } from '../services/sessionComparisonService';

function ProfessionalWorkflowPage() {
  // Get current session from context/state
  const currentSession: Session = {
    id: sessionId,
    userId: user?.uid,
    patientId: selectedPatientId,
    patientName: selectedPatient?.name,
    transcript: transcript,
    soapNote: soapNote,
    physicalTests: evaluationTests,
    timestamp: new Date(),
    status: 'completed',
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Main workflow */}
      <div className="col-span-2">
        {/* ... existing workflow ... */}
      </div>

      {/* Sidebar with comparison */}
      <div className="col-span-1">
        <SessionComparison 
          patientId={selectedPatientId}
          currentSession={currentSession}
          currentSessionId={sessionId}
          onComparisonLoad={(comparison) => {
            // Store comparison for analytics
            console.log('Comparison:', comparison);
          }}
        />
      </div>
    </div>
  );
}
```

---

## 📊 DATA STRUCTURE

### **ComparisonDisplayData**

```typescript
interface ComparisonDisplayData {
  hasComparison: boolean;
  isFirstSession: boolean;
  previousSessionDate: string | null;
  currentSessionDate: string;
  daysBetween: number | null;
  metrics: {
    painLevel: {
      previous: number | null;
      current: number | null;
      delta: number | null;
      trend: 'improved' | 'stable' | 'worsened' | 'no_data';
    };
    rangeOfMotion: Array<{
      region: string;
      previous: number | null;
      current: number | null;
      delta: number | null;
      trend: 'improved' | 'stable' | 'worsened' | 'no_data';
    }>;
    functionalTests: Array<{
      testName: string;
      previous: string | null;
      current: string | null;
      changed: boolean;
    }>;
  };
  overallProgress: 'improved' | 'stable' | 'regressed' | 'no_data';
  alerts: RegressionAlert[];
  summary: string;
}
```

---

## 🧪 TESTING

### **Running Component Tests**

```bash
npm run test -- src/components/__tests__/SessionComparison.test.tsx
```

### **Test Coverage**

- ✅ Loading state rendering
- ✅ Error state with retry
- ✅ First session handling
- ✅ Comparison data rendering
- ✅ Improvement indicators
- ✅ Regression indicators
- ✅ Stable indicators
- ✅ Callback integration
- ✅ Edge cases

---

## 🎯 RESPONSIVE DESIGN

The component is responsive and works on:
- **Mobile:** ≥320px width
- **Tablet:** ≥768px width
- **Desktop:** ≥1024px width

---

## ⚠️ REQUIREMENTS

### **Required Props:**
- `patientId`: Must be provided

### **Optional but Recommended:**
- `currentSession`: Required for comparison (will show error if not provided)
- `currentSessionId`: Used to exclude current session from previous session query

### **Service Dependency:**
- Requires `SessionComparisonService` (Day 1) ✅ Completed

---

## 🚀 NEXT STEPS (Day 3)

1. **Integrate in ProfessionalWorkflowPage:**
   - Add component to sidebar
   - Pass current session data
   - Handle comparison callbacks

2. **Add Analytics:**
   - Track comparison views
   - Track alert interactions
   - Track retry attempts

3. **Performance Optimization:**
   - Cache comparison results
   - Debounce rapid updates
   - Optimize re-renders

---

## 📝 NOTES

- Component automatically handles first session case
- Error state includes retry functionality
- Comparison data is formatted by `SessionComparisonService`
- All visual indicators follow medical UI standards
- Component is fully accessible (ARIA labels included)

---

**Documentation Version:** 1.0  
**Last Updated:** November 2025  
**Status:** ✅ Ready for Day 3 Integration

