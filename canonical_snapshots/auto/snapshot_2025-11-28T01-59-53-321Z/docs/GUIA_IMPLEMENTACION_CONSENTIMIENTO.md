# 🎯 GUÍA PARA IMPLEMENTADOR: DOCUMENTO LEGAL DE CONSENTIMIENTO

## **FUNCIÓN Y CONTEXTO**

**Objetivo:** Crear documento legal que pacientes canadienses accederán vía link SMS para autorizar procesamiento de sus datos de salud mediante IA en servidores estadounidenses.

**Flujo:** SMS → Link → Documento Legal → Consentimiento → Workflow AiduxCare

**Decisión estratégica:** Si paciente rechaza = usa EMR tradicional (NO AiduxCare)

---

## 📚 **FUENTES DE INVESTIGACIÓN REQUERIDAS**

### **1. PHIPA (Personal Health Information Protection Act)**

**Buscar específicamente:**
- **Sección 18:** Requisitos para divulgación transfronteriza de PHI
- **"Knowledgeable consent"** - elementos obligatorios
- **Express consent** vs implied consent - cuándo es requerido
- **Withdrawal procedures** - cómo retirar consentimiento

**URL:** `https://www.ontario.ca/laws/statute/04p03`

### **2. CPO (College of Physiotherapists of Ontario)**

**Buscar específicamente:**
- **Documentation Standard** (efectivo August 1, 2025)
- **Consent requirements** para tecnología y terceros
- **Professional accountability** para herramientas de IA
- **Record retention** standards (10+ años)

**URL:** `https://collegept.org/standards-resources/standards/`

### **3. PIPEDA Cross-Border Guidelines**

**Buscar específicamente:**
- **Accountability principle** para procesadores terceros
- **Cross-border transfer** requirements y safeguards
- **Notification obligations** sobre procesamiento extranjero
- **Individual rights** en transferencias internacionales

**URL:** `https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/`

### **4. IPC Ontario Resources**

**Buscar específicamente:**
- **Health privacy rights** in Ontario
- **Complaint procedures** y patient rights
- **Consent guidance** para health information custodians

**URL:** `https://www.ipc.on.ca/en/health-individuals/`

---

## 📋 **ELEMENTOS LEGALES OBLIGATORIOS**

### **Divulgaciones Requeridas por PHIPA:**
- ✅ **Purpose** del procesamiento de IA
- ✅ **Location** específica (US servers, Google Vertex AI)
- ✅ **CLOUD Act exposure** - acceso por autoridades US
- ✅ **Data retention** período y políticas
- ✅ **Patient rights** (access, correction, withdrawal)
- ✅ **Complaint process** (IPC Ontario contact)

### **Responsabilidades del Fisioterapeuta:**
- ✅ **Professional accountability** maintained
- ✅ **Clinical decision** authority remains with PT
- ✅ **Documentation standards** compliance (CPO)
- ✅ **Liability coverage** no se ve afectada

### **Opciones de Consentimiento:**
- ✅ **Ongoing consent** (múltiples sesiones)
- ✅ **Session-specific** (solo esta visita)
- ✅ **Decline option** (usar EMR tradicional - NO AiduxCare)

---

## 🎨 **FORMATO Y ESTRUCTURA**

### **Documento Requirements:**
```
1. **Spanish Translation** - documento completamente en español
2. **Plain Language** - nivel lectura grado 8-10
3. **Neutral Format** - sin negritas, formato simple
4. **Scrollable Content** - documento completo en área scrollable
5. **Fixed Action Buttons** - siempre visibles (sticky footer)
6. **Mobile Responsive** - funciona en todos dispositivos
```

### **Technical Integration:**
```javascript
// Route: /consent-verification/:consentToken
// Component: PatientConsentPortalPage
// Actions: 
//   - Accept Ongoing (requires digital signature)
//   - Accept Session-Only (simple click)  
//   - Decline (redirect to EMR recommendation)
```

---

## 🔧 **INTEGRACIÓN CON AIDUXCARE**

### **File Structure:**
```
/src/components/consent/
├── PatientConsentPortalPage.tsx (already exists)
├── LegalConsentDocument.tsx (NEW - create this)
├── ConsentActionButtons.tsx (NEW - create this)
└── consentContent.ts (NEW - Spanish legal text)

/docs/legal/
├── PHIPA_Compliance_Framework.md (NEW)
├── CPO_Requirements_Analysis.md (NEW) 
└── Legal_Research_Sources.md (NEW)
```

### **Data Structure (Firestore):**
```typescript
ConsentRecord {
  patientId: string,
  consentScope: 'ongoing' | 'session-only' | 'declined',
  consentTimestamp: Date,
  ipAddress: string,
  digitalSignature?: string,
  legalVersion: string, // Para tracking cambios legales
  auditTrail: ConsentAuditEvent[]
}
```

---

## ⚠️ **COMPLIANCE CHECKPOINTS**

### **Legal Validation Steps:**
1. **Research completeness** - todos los elementos requeridos incluidos
2. **Language accuracy** - traducción legal precisa al español  
3. **Format compliance** - meets accessibility standards
4. **Integration testing** - workflow completo funciona
5. **Audit trail** - logging completo implementado

### **Professional Review:**
- **CPO guidance** consultation recommended
- **Legal counsel** review before production
- **Privacy officer** approval if available

---

## 🎯 **DELIVERABLES ESPERADOS**

### **1. Legal Content File:**
```typescript
// /src/content/legalConsent.ts
export const LEGAL_CONSENT_CONTENT = {
  title: "CONSENTIMIENTO INFORMADO...",
  sections: {
    purpose: "...",
    crossBorder: "...", 
    patientRights: "...",
    // etc.
  }
}
```

### **2. Component Implementation:**
```typescript
// Actualizar PatientConsentPortalPage con nuevo contenido legal
// Sticky footer con 3 opciones
// Digital signature para ongoing consent
```

### **3. Documentation:**
```markdown
// Evidencia de research legal completo
// Compliance checklist completado
// Integration testing results
```

---

## 🚀 **SUCCESS CRITERIA**

- ✅ **Legally compliant** documento covering all regulatory requirements
- ✅ **User-friendly** interface con opciones claras
- ✅ **Audit trail** completo para compliance
- ✅ **Professional protection** para fisioterapeutas
- ✅ **Business differentiation** vs competidores

**Este documento completará la Stage 4 (SMS) y habilitará el workflow completo de AiduxCare con protección legal completa.**

