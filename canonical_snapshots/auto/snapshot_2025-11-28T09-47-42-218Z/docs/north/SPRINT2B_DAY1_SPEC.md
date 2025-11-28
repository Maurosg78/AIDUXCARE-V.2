# 🏭 SPRINT 2B - DAY 1: WSIB TEMPLATES

**Duration:** 1 day  
**Owner:** Development Team  
**Dependencies:** Sprint 2A ✅ (Session Types + Token Tracking)  
**Market:** CA · en-CA · PHIPA/PIPEDA Ready

---

## 🎯 **DAY 1 OBJECTIVE**

Implement WSIB (Workplace Safety and Insurance Board) document templates that generate professional, legally compliant forms from SOAP notes for workplace injury claims in Ontario.

---

## 📋 **DELIVERABLE BREAKDOWN**

### **Entregable 1: WSIB Data Structure & Interfaces** (1 hour)

**Objective:** Define TypeScript interfaces for WSIB-specific data structures

**Files:**
- `src/types/wsib.ts` (NEW)
- `src/services/wsibTemplateService.ts` (NEW)

**Requirements:**

```typescript
// WSIB-specific data structure
export interface WSIBFormData {
  // Patient Information
  patient: {
    name: string;
    dateOfBirth: Date;
    address: string;
    phone: string;
    email?: string;
    wsibClaimNumber?: string;
  };
  
  // Professional Information
  professional: {
    name: string;
    registrationNumber: string; // COTO registration
    clinicName: string;
    clinicAddress: string;
    phone: string;
    email: string;
  };
  
  // Injury Information
  injury: {
    dateOfInjury: Date;
    mechanismOfInjury: string;
    bodyPartAffected: string[];
    workRelated: boolean;
    preInjuryStatus: string;
    currentStatus: string;
  };
  
  // Clinical Assessment (from SOAP)
  clinical: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    functionalLimitations: string[];
    workRestrictions: string[];
    returnToWorkRecommendations: string;
  };
  
  // Treatment Information
  treatment: {
    startDate: Date;
    frequency: string;
    duration: string;
    modalities: string[];
    exercises: string[];
    expectedOutcome: string;
  };
  
  // Legal/Compliance
  compliance: {
    dateOfReport: Date;
    signatureRequired: boolean;
    disclaimers: string[];
  };
}

// WSIB Form Types
export type WSIBFormType = 
  | 'functional-abilities-form' 
  | 'treatment-plan' 
  | 'progress-report'
  | 'return-to-work-assessment';
```

**DoD Entregable 1:**
- [ ] TypeScript interfaces defined without errors
- [ ] All WSIB-specific fields included
- [ ] Type safety verified
- [ ] Documentation comments added

---

### **Entregable 2: WSIB Template Service** (2 hours)

**Objective:** Create service to transform SOAP notes into WSIB-formatted data

**File:** `src/services/wsibTemplateService.ts`

**Requirements:**

```typescript
import { SOAPNote } from '../types/vertex-ai';
import { Session } from '../services/sessionComparisonService';
import { WSIBFormData, WSIBFormType } from '../types/wsib';

export class WSIBTemplateService {
  /**
   * Extract WSIB-specific data from SOAP note and session
   */
  static extractWSIBData(
    soapNote: SOAPNote,
    session: Session,
    patientData: any,
    professionalData: any
  ): WSIBFormData {
    // Extract injury mechanism from SOAP subjective
    // Extract functional limitations from SOAP objective/assessment
    // Extract work restrictions from SOAP plan
    // Map SOAP sections to WSIB format
  }
  
  /**
   * Generate WSIB Functional Abilities Form (FAF)
   */
  static generateFunctionalAbilitiesForm(
    wsibData: WSIBFormData
  ): WSIBFormData {
    // Format for WSIB FAF-8 form
  }
  
  /**
   * Generate WSIB Treatment Plan
   */
  static generateTreatmentPlan(
    wsibData: WSIBFormData
  ): WSIBFormData {
    // Format for WSIB treatment plan submission
  }
  
  /**
   * Generate WSIB Progress Report
   */
  static generateProgressReport(
    wsibData: WSIBFormData,
    previousReport?: WSIBFormData
  ): WSIBFormData {
    // Compare with previous report if available
    // Highlight changes in functional status
  }
  
  /**
   * Generate Return-to-Work Assessment
   */
  static generateReturnToWorkAssessment(
    wsibData: WSIBFormData
  ): WSIBFormData {
    // Specific format for RTW recommendations
  }
  
  /**
   * Validate WSIB data completeness
   */
  static validateWSIBData(data: WSIBFormData): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    // Check required fields
    // Validate dates
    // Check professional registration
  }
  
  /**
   * Add WSIB compliance disclaimers
   */
  static addComplianceDisclaimers(data: WSIBFormData): string[] {
    return [
      "This report is based on clinical assessment and may require verification.",
      "All information provided is accurate to the best of the professional's knowledge.",
      "This document complies with WSIB reporting requirements and CPO standards.",
      "Patient consent has been obtained for this report."
    ];
  }
}
```

**DoD Entregable 2:**
- [ ] Service class implemented
- [ ] All extraction methods working
- [ ] Data transformation logic correct
- [ ] Validation logic implemented
- [ ] Error handling added

---

### **Entregable 3: WSIB PDF Template** (2 hours)

**Objective:** Create PDF template for WSIB forms using a PDF library

**Files:**
- `src/services/wsibPdfGenerator.ts` (NEW)
- Update `src/services/pdf-generator.ts` (enhance existing)

**Requirements:**

```typescript
import { WSIBFormData, WSIBFormType } from '../types/wsib';
import jsPDF from 'jspdf'; // or similar PDF library

export class WSIBPdfGenerator {
  /**
   * Generate WSIB Functional Abilities Form PDF
   */
  static generateFAF8PDF(data: WSIBFormData): Blob {
    const doc = new jsPDF();
    
    // Header: WSIB logo, form title
    // Patient information section
    // Professional information section
    // Injury details section
    // Functional abilities assessment
    // Work restrictions
    // Return-to-work recommendations
    // Professional signature section
    // Compliance disclaimers footer
    
    return doc.output('blob');
  }
  
  /**
   * Generate WSIB Treatment Plan PDF
   */
  static generateTreatmentPlanPDF(data: WSIBFormData): Blob {
    // Similar structure, focused on treatment details
  }
  
  /**
   * Generate WSIB Progress Report PDF
   */
  static generateProgressReportPDF(
    data: WSIBFormData,
    previousData?: WSIBFormData
  ): Blob {
    // Include comparison with previous report
    // Highlight progress/changes
  }
  
  /**
   * Generate Return-to-Work Assessment PDF
   */
  static generateRTWAssessmentPDF(data: WSIBFormData): Blob {
    // Focus on RTW recommendations and timeline
  }
  
  /**
   * Add professional header to PDF
   */
  private static addHeader(doc: jsPDF, data: WSIBFormData): void {
    // Clinic name, address, logo
    // Professional name and registration
  }
  
  /**
   * Add compliance footer to PDF
   */
  private static addFooter(doc: jsPDF, disclaimers: string[]): void {
    // Legal disclaimers
    // CPO compliance notice
    // PHIPA notice
  }
}
```

**DoD Entregable 3:**
- [ ] PDF generation working
- [ ] All WSIB form types supported
- [ ] Professional formatting
- [ ] Compliance disclaimers included
- [ ] Signature sections included

---

### **Entregable 4: WSIB UI Component** (1.5 hours)

**Objective:** Create React component for WSIB form generation and preview

**File:** `src/components/WSIBFormGenerator.tsx` (NEW)

**Requirements:**

```tsx
interface WSIBFormGeneratorProps {
  soapNote: SOAPNote;
  session: Session;
  patientData: any;
  professionalData: any;
  onGenerate: (formType: WSIBFormType, pdfBlob: Blob) => void;
}

export const WSIBFormGenerator: React.FC<WSIBFormGeneratorProps> = ({
  soapNote,
  session,
  patientData,
  professionalData,
  onGenerate
}) => {
  const [formType, setFormType] = useState<WSIBFormType>('functional-abilities-form');
  const [wsibData, setWsibData] = useState<WSIBFormData | null>(null);
  const [previewMode, setPreviewMode] = useState<'form' | 'pdf'>('form');
  
  // Extract WSIB data from SOAP
  useEffect(() => {
    const extracted = WSIBTemplateService.extractWSIBData(
      soapNote,
      session,
      patientData,
      professionalData
    );
    setWsibData(extracted);
  }, [soapNote, session]);
  
  // Generate PDF
  const handleGeneratePDF = () => {
    if (!wsibData) return;
    
    let pdfBlob: Blob;
    switch (formType) {
      case 'functional-abilities-form':
        pdfBlob = WSIBPdfGenerator.generateFAF8PDF(wsibData);
        break;
      case 'treatment-plan':
        pdfBlob = WSIBPdfGenerator.generateTreatmentPlanPDF(wsibData);
        break;
      // ... other cases
    }
    
    onGenerate(formType, pdfBlob);
  };
  
  return (
    <div className="wsib-form-generator">
      {/* Form type selector */}
      {/* Data preview/edit */}
      {/* Validation warnings */}
      {/* Generate PDF button */}
      {/* Preview PDF */}
    </div>
  );
};
```

**DoD Entregable 4:**
- [ ] Component renders correctly
- [ ] Form type selection working
- [ ] Data extraction working
- [ ] PDF preview working
- [ ] Download functionality working
- [ ] Error handling implemented

---

### **Entregable 5: Integration with ProfessionalWorkflowPage** (1 hour)

**Objective:** Integrate WSIB form generator into workflow

**File:** `src/pages/ProfessionalWorkflowPage.tsx` (UPDATE)

**Requirements:**

```typescript
// Add WSIB form generation option when sessionType === 'wsib'
const handleGenerateWSIBForm = async () => {
  if (sessionType !== 'wsib') return;
  
  // Show WSIB form generator modal
  setShowWSIBModal(true);
};

// Add button/option in UI when WSIB session
{sessionType === 'wsib' && (
  <button onClick={handleGenerateWSIBForm}>
    Generate WSIB Form
  </button>
)}
```

**DoD Entregable 5:**
- [ ] Integration working
- [ ] Only shows for WSIB sessions
- [ ] Modal/dialog working
- [ ] No breaking changes to existing workflow

---

### **Entregable 6: Unit Tests** (1.5 hours)

**File:** `src/services/__tests__/wsibTemplateService.test.ts` (NEW)

**Required Tests:**

```typescript
describe('WSIBTemplateService', () => {
  test('extracts WSIB data from SOAP note correctly')
  test('validates WSIB data completeness')
  test('generates Functional Abilities Form correctly')
  test('generates Treatment Plan correctly')
  test('generates Progress Report with comparison')
  test('generates Return-to-Work Assessment correctly')
  test('adds compliance disclaimers')
  test('handles missing data gracefully')
  test('handles invalid session type')
});
```

**DoD Entregable 6:**
- [ ] 9+ unit tests implemented
- [ ] All tests passing
- [ ] Coverage >80%
- [ ] Edge cases covered

---

## 🎨 **UI/UX REQUIREMENTS**

### **WSIB Form Generator UI:**

```
┌─────────────────────────────────────────┐
│ WSIB Form Generator                     │
├─────────────────────────────────────────┤
│ Form Type: [Functional Abilities ▼]     │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Patient Information                 │ │
│ │ Name: [Auto-filled]                 │ │
│ │ DOB: [Auto-filled]                 │ │
│ │ Claim #: [________]                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Injury Details                      │ │
│ │ Date: [Auto-filled]                │ │
│ │ Mechanism: [From SOAP]             │ │
│ │ Body Parts: [Multiple select]     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Functional Limitations              │ │
│ │ [From SOAP Objective]              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Preview Form] [Generate PDF] [Cancel] │
└─────────────────────────────────────────┘
```

---

## ⚡ **PERFORMANCE REQUIREMENTS**

- **Data extraction:** <100ms
- **PDF generation:** <3 seconds
- **Form validation:** <50ms
- **UI render:** <200ms

---

## 🧪 **TESTING STRATEGY**

### **Unit Tests:**
- WSIBTemplateService methods
- Data extraction logic
- Validation logic
- PDF generation

### **Integration Tests:**
- End-to-end: SOAP → WSIB Form → PDF
- Session type integration
- Error handling

---

## ✅ **DEFINITION OF DONE - DAY 1**

### **🔴 Functionality:**
- [ ] WSIB data structures defined
- [ ] WSIB template service implemented
- [ ] PDF generation working for all form types
- [ ] UI component functional
- [ ] Integration with workflow complete

### **🔴 Quality:**
- [ ] Unit tests >80% coverage
- [ ] All tests passing
- [ ] TypeScript errors resolved
- [ ] Professional formatting in PDFs
- [ ] Compliance disclaimers included

### **🔴 Integration:**
- [ ] Works with SessionTypeService
- [ ] Integrates with ProfessionalWorkflowPage
- [ ] No breaking changes
- [ ] Error handling implemented

---

## 🚨 **CRITICAL IMPLEMENTATION NOTES**

- **WSIB Compliance:** Must follow Ontario WSIB reporting standards
- **CPO Standards:** Professional documentation must meet CPO requirements
- **PHIPA Compliance:** Patient data handling must comply with PHIPA
- **Legal Disclaimers:** Required disclaimers must be included
- **Professional Signature:** Signature section required for all forms
- **Data Accuracy:** All extracted data must be verified
- **Error Handling:** Missing data should show warnings, not fail silently

---

## 📚 **REFERENCES**

- WSIB Functional Abilities Form (FAF-8)
- WSIB Treatment Plan Template
- WSIB Progress Report Requirements
- CPO Documentation Standards
- PHIPA Compliance Guidelines

---

**Status:** 🟡 **READY TO START**  
**Next:** Day 2 - MVA Templates

