# Sprint 2B Completion Plan - Document Templates

## 📊 Current Status Assessment

### ✅ **COMPLETED (Day 1 - WSIB)**

1. **WSIB Data Structures** ✅
   - `src/types/wsib.ts` - Complete
   - All interfaces defined
   - Type safety verified

2. **WSIBTemplateService** ✅
   - `src/services/wsibTemplateService.ts` - Complete
   - All extraction methods implemented
   - Form generation methods working
   - 38 unit tests passing (>80% coverage)

3. **WSIBFormGenerator Component** ✅
   - `src/components/WSIBFormGenerator.tsx` - Complete
   - UI functional
   - Integration with workflow complete

4. **Integration** ✅
   - Integrated into `ProfessionalWorkflowPage`
   - Modal working
   - Analytics tracking implemented

### ⚠️ **PARTIALLY COMPLETE**

1. **PDF Generation** ⚠️
   - `src/services/wsibPdfGenerator.ts` - Structure exists
   - **Missing:** jsPDF library installation
   - **Missing:** Actual PDF generation implementation
   - Currently returns text blobs as placeholder

### ❌ **NOT STARTED**

1. **MVA Templates** ❌
   - No MVA types defined
   - No MVA service
   - No MVA component
   - No integration

2. **Certificate Generation** ❌
   - No certificate types
   - No certificate service
   - No certificate component
   - No integration

---

## 🎯 Completion Plan - Divided into Deliverables

### **ENTREGABLE 1: PDF Generation Implementation** (2-3 hours)

**Objective:** Complete PDF generation for WSIB forms using jsPDF

**Tasks:**
1. Install jsPDF and jspdf-autotable
2. Implement actual PDF generation in `wsibPdfGenerator.ts`
3. Test PDF generation for all 4 WSIB form types
4. Verify PDF quality and formatting

**Files:**
- `src/services/wsibPdfGenerator.ts` (UPDATE)
- `package.json` (UPDATE - add dependencies)

**DoD:**
- [ ] jsPDF installed
- [ ] All 4 WSIB form types generate proper PDFs
- [ ] PDFs are professional quality
- [ ] Signature sections included
- [ ] Compliance disclaimers included

---

### **ENTREGABLE 2: MVA Types & Service** (3-4 hours)

**Objective:** Create MVA (Motor Vehicle Accident) form types and service

**Tasks:**
1. Create `src/types/mva.ts` with OCF form types
2. Create `src/services/mvaTemplateService.ts`
3. Implement extraction methods for MVA-specific data
4. Implement form generation methods (OCF-1, OCF-3, OCF-23)
5. Add unit tests (>80% coverage)

**Files:**
- `src/types/mva.ts` (NEW)
- `src/services/mvaTemplateService.ts` (NEW)
- `src/services/__tests__/mvaTemplateService.test.ts` (NEW)

**DoD:**
- [ ] MVA types defined
- [ ] MVA service implemented
- [ ] All extraction methods working
- [ ] Form generation methods working
- [ ] Unit tests >80% coverage
- [ ] All tests passing

---

### **ENTREGABLE 3: MVA PDF Generator** (2 hours)

**Objective:** Create PDF generator for MVA forms

**Tasks:**
1. Create `src/services/mvaPdfGenerator.ts`
2. Implement PDF generation for OCF-1, OCF-3, OCF-23
3. Use same jsPDF library as WSIB
4. Ensure professional formatting

**Files:**
- `src/services/mvaPdfGenerator.ts` (NEW)

**DoD:**
- [ ] All 3 MVA form types generate PDFs
- [ ] Professional formatting
- [ ] Compliance disclaimers included

---

### **ENTREGABLE 4: MVA Component & Integration** (2 hours)

**Objective:** Create MVA form generator component and integrate into workflow

**Tasks:**
1. Create `src/components/MVAFormGenerator.tsx`
2. Similar structure to WSIBFormGenerator
3. Integrate into `ProfessionalWorkflowPage`
4. Add modal trigger for MVA sessions

**Files:**
- `src/components/MVAFormGenerator.tsx` (NEW)
- `src/pages/ProfessionalWorkflowPage.tsx` (UPDATE)

**DoD:**
- [ ] Component renders correctly
- [ ] Form type selection working
- [ ] PDF generation working
- [ ] Integration complete
- [ ] Only shows for MVA sessions

---

### **ENTREGABLE 5: Certificate Types & Service** (2-3 hours)

**Objective:** Create certificate generation types and service

**Tasks:**
1. Create `src/types/certificate.ts`
2. Create `src/services/certificateService.ts`
3. Implement certificate generation methods
4. Add unit tests

**Files:**
- `src/types/certificate.ts` (NEW)
- `src/services/certificateService.ts` (NEW)
- `src/services/__tests__/certificateService.test.ts` (NEW)

**DoD:**
- [ ] Certificate types defined
- [ ] Certificate service implemented
- [ ] Unit tests >80% coverage
- [ ] All tests passing

---

### **ENTREGABLE 6: Certificate PDF Generator** (1-2 hours)

**Objective:** Create PDF generator for certificates

**Tasks:**
1. Create `src/services/certificatePdfGenerator.ts`
2. Implement PDF generation for return-to-work certificates
3. Implement PDF generation for medical certificates
4. Professional certificate formatting

**Files:**
- `src/services/certificatePdfGenerator.ts` (NEW)

**DoD:**
- [ ] Return-to-work certificates generate PDFs
- [ ] Medical certificates generate PDFs
- [ ] Professional formatting
- [ ] Signature sections included

---

### **ENTREGABLE 7: Certificate Component & Integration** (1-2 hours)

**Objective:** Create certificate generator component and integrate

**Tasks:**
1. Create `src/components/CertificateGenerator.tsx`
2. Integrate into workflow
3. Add trigger for certificate sessions

**Files:**
- `src/components/CertificateGenerator.tsx` (NEW)
- `src/pages/ProfessionalWorkflowPage.tsx` (UPDATE)

**DoD:**
- [ ] Component functional
- [ ] Certificate type selection working
- [ ] PDF generation working
- [ ] Integration complete

---

### **ENTREGABLE 8: End-to-End Testing & Polish** (2-3 hours)

**Objective:** Test all document generation flows and fix any issues

**Tasks:**
1. Test WSIB form generation end-to-end
2. Test MVA form generation end-to-end
3. Test certificate generation end-to-end
4. Fix any bugs found
5. Performance optimization
6. Error handling improvements

**DoD:**
- [ ] All document types generate correctly
- [ ] No critical bugs
- [ ] Performance acceptable (<3s for PDF generation)
- [ ] Error handling robust
- [ ] User experience smooth

---

## 📅 Estimated Timeline

**Total Estimated Time:** 15-20 hours

**Breakdown:**
- Entregable 1: 2-3 hours
- Entregable 2: 3-4 hours
- Entregable 3: 2 hours
- Entregable 4: 2 hours
- Entregable 5: 2-3 hours
- Entregable 6: 1-2 hours
- Entregable 7: 1-2 hours
- Entregable 8: 2-3 hours

**Recommended Schedule:**
- **Today:** Entregables 1-2 (PDF + MVA Types/Service)
- **Tomorrow:** Entregables 3-4 (MVA PDF + Component)
- **Day 3:** Entregables 5-6 (Certificate Types/Service + PDF)
- **Day 4:** Entregables 7-8 (Certificate Component + Testing)

---

## 🎯 Priority Order

1. **🔴 CRITICAL:** Entregable 1 (PDF Generation) - Blocks all document downloads
2. **🔴 CRITICAL:** Entregable 2 (MVA Types/Service) - Required for MVA sessions
3. **🟡 HIGH:** Entregable 3-4 (MVA PDF + Component) - Complete MVA workflow
4. **🟡 HIGH:** Entregable 5-6 (Certificate Types/Service + PDF) - Complete certificate workflow
5. **🟢 MEDIUM:** Entregable 7 (Certificate Component) - UI polish
6. **🟢 MEDIUM:** Entregable 8 (Testing) - Quality assurance

---

## ✅ Success Criteria

**Sprint 2B Complete When:**
- ✅ All WSIB forms generate PDFs correctly
- ✅ All MVA forms generate PDFs correctly
- ✅ All certificates generate PDFs correctly
- ✅ All integrations working
- ✅ No critical bugs
- ✅ Performance acceptable
- ✅ Tests passing (>80% coverage)

---

## 🚀 Ready to Start

**Current Status:** Sprint 2B Day 1 Complete (WSIB templates)
**Next Step:** Entregable 1 - PDF Generation Implementation

**Confidence:** 🟢 HIGH - Clear path forward, well-defined deliverables

