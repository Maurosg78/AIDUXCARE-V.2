# 🎨 **AIDUXCARE BUTTON GRADIENT SYSTEM**

**Version:** 1.0.0  
**Status:** ✅ **OFFICIAL - USE THESE GRADIENTS FOR BUTTONS**

---

## 🎯 **BUTTON GRADIENT CATEGORIES**

### **1. Primary (Main Actions)**
**Gradient:** `#667EEA → #764BA2`  
**Hover:** `#5A6FD8 → #6A4190`  
**Usage:**
- Start Recording
- Generate SOAP Note
- Analyze Transcript
- Primary CTA buttons

**Example:**
```tsx
<Button variant="primary">Start Recording</Button>
```

---

### **2. Secondary (Secondary Actions)**
**Gradient:** `#8B9AFF → #9B7BC2`  
**Hover:** `#7A8AEF → #8B6BB2`  
**Usage:**
- Save Draft
- Preview
- Regenerate
- Secondary actions

**Example:**
```tsx
<Button variant="secondary">Save Draft</Button>
```

---

### **3. Success (Positive Actions)**
**Gradient:** `#10B981 → #667EEA`  
**Hover:** `#059669 → #5A6FD8`  
**Usage:**
- Finalize Note
- Approve
- Complete
- Confirm actions

**Example:**
```tsx
<Button variant="success">Finalize Note</Button>
```

---

### **4. Warning (Warning Actions)**
**Gradient:** `#F59E0B → #764BA2`  
**Hover:** `#D97706 → #6A4190`  
**Usage:**
- Review Required
- Pending Actions
- Attention needed

**Example:**
```tsx
<Button variant="warning">Review Required</Button>
```

---

### **5. Danger (Destructive Actions)**
**Gradient:** `#EF4444 → #764BA2`  
**Hover:** `#DC2626 → #6A4190`  
**Usage:**
- Delete
- Remove
- Cancel (destructive)
- Clear

**Example:**
```tsx
<Button variant="danger">Delete Note</Button>
```

---

### **6. Info (Informational Actions)**
**Gradient:** `#06B6D4 → #667EEA`  
**Hover:** `#0891B2 → #5A6FD8`  
**Usage:**
- Learn More
- Info
- Help
- Details

**Example:**
```tsx
<Button variant="info">Learn More</Button>
```

---

### **7. Logout (Special)**
**Gradient:** `#D946EF → #764BA2 → #667EEA`  
**Hover:** `#C026D3 → #6A4190 → #5A6FD8`  
**Usage:**
- Log Out (only)

**Example:**
```tsx
<Button variant="logout">Log Out</Button>
```

---

### **8. Outline (Secondary with Border)**
**Border:** `#667EEA`  
**Text:** `#667EEA`  
**Hover:** `bg-primary-blue/5`  
**Usage:**
- Sign Up
- Cancel (non-destructive)
- Secondary CTAs

**Example:**
```tsx
<Button variant="outline">Sign Up</Button>
```

---

## 📋 **BUTTON USAGE GUIDE**

### **Workflow Page:**
- **Start Recording:** `variant="primary"`
- **Stop Recording:** `variant="danger"`
- **Analyze:** `variant="primary"`
- **Generate SOAP:** `variant="primary"`
- **Save Draft:** `variant="secondary"`
- **Preview:** `variant="secondary"`
- **Finalize:** `variant="success"`
- **Regenerate:** `variant="secondary"`

### **SOAP Editor:**
- **Save Draft:** `variant="secondary"`
- **Preview:** `variant="secondary"`
- **Finalize:** `variant="success"`
- **Regenerate:** `variant="secondary"`

### **Command Center:**
- **New Patient:** `variant="primary"`
- **New Appointment:** `variant="primary"`
- **Audit:** `variant="info"`
- **Log Out:** `variant="logout"`

### **Consent:**
- **Accept Ongoing:** `variant="success"`
- **Accept Session:** `variant="primary"`
- **Decline:** `variant="outline"`

---

## 🚫 **DO NOT USE**

- ❌ `bg-black` / `bg-slate-900` - Use gradients instead
- ❌ Same gradient for all buttons - Use appropriate variant
- ❌ Custom gradients outside this system - Use defined variants

---

## ✅ **IMPLEMENTATION**

All buttons should use the `Button` component with appropriate `variant`:

```tsx
import Button from '@/components/ui/button';

// Primary action
<Button variant="primary">Start Recording</Button>

// Secondary action
<Button variant="secondary">Save Draft</Button>

// Success action
<Button variant="success">Finalize</Button>

// Destructive action
<Button variant="danger">Delete</Button>
```

---

**This gradient system ensures visual hierarchy and consistent branding across all buttons.**

