# 🎨 **AIDUXCARE OFFICIAL DESIGN SYSTEM**

**Version:** 1.0.0  
**Last Updated:** November 2025  
**Status:** ✅ **OFFICIAL - APPLY TO ALL PAGES**

---

## 🇨🇦 **CANADIAN IDENTITY**

### **Maple Leaf Symbol (🍁)**
- **Usage:** Display maple leaf emoji in headers and footers
- **Purpose:** Visual connection to Canadian identity
- **Placement:**
  - Header: Next to "AiduxCare" brand name
  - Footer: Before trust indicators
  - Any Canadian-specific messaging

---

## 🎨 **COLOR SYSTEM**

### **Primary Gradient (Apple-Inspired)**
```css
/* OFFICIAL AIDUXCARE GRADIENT */
background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);

/* Colors */
--primary-blue: #667EEA;      /* Soft periwinkle blue */
--primary-purple: #764BA2;    /* Muted purple */

/* Hover States */
--primary-blue-hover: #5A6FD8;
--primary-purple-hover: #6A4190;
```

**Tailwind Classes:**
- `from-primary-blue` / `to-primary-purple`
- `bg-gradient-to-r from-primary-blue to-primary-purple`
- `text-primary-blue` / `text-primary-purple`

---

## 🔤 **TYPOGRAPHY SYSTEM**

### **Font Family (Apple System)**
```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', system-ui, sans-serif;
```

**Tailwind Class:** `font-apple`

### **Type Scale**

| Element | Size | Weight | Letter Spacing | Line Height | Usage |
|---------|------|--------|---------------|-------------|-------|
| Hero | `text-3xl sm:text-4xl` (30-36px) | `font-light` | `tracking-[-0.02em]` | `leading-[1.1]` | Main headlines |
| Tagline | `text-lg` (18px) | `font-light` | `0` | `leading-[1.3]` | Subheadings |
| Section Title | `text-xl` (20px) | `font-medium` | `0` | `leading-[1.2]` | Section headers |
| Body | `text-[15px]` | `font-light` | `0` | `leading-[1.5]` | Body text |
| Caption | `text-[12px]` | `font-light` | `0` | `leading-[1.4]` | Small text |
| Eyebrow | `text-[10px]` | `font-light` | `tracking-[0.02em]` | `leading-[1.2]` | Uppercase labels |

### **Font Weights**
- `font-light` (300) - Default for most text
- `font-normal` (400) - Labels, emphasis
- `font-medium` (500) - Section titles, buttons
- `font-semibold` (600) - Strong emphasis (rarely used)

---

## 📐 **SPACING SYSTEM**

### **Vertical Spacing**
- `py-6` - Page padding (top/bottom)
- `mb-8` - Large section spacing
- `mb-6` - Medium section spacing
- `mb-5` - Card header spacing
- `mb-4` - Form field spacing
- `mb-3` - Tight spacing
- `space-y-4` - Form fields
- `space-y-3` - Compact lists

### **Horizontal Spacing**
- `px-4` - Page padding (sides)
- `px-6` - Card padding
- `gap-1` - Tight spacing (icons/text)

---

## 🎯 **COMPONENT SPECIFICATIONS**

### **Buttons**

**Primary (Gradient):**
```tsx
<Button
  variant="gradient"
  className="h-11 text-[15px] font-medium font-apple"
>
  Button Text
</Button>
```

**Outline:**
```tsx
<Button
  variant="outline"
  className="h-11 text-[15px] font-medium font-apple"
>
  Button Text
</Button>
```

### **Inputs**
```tsx
<input
  className="w-full h-11 px-4 border border-gray-300 rounded-lg 
             focus:ring-2 focus:ring-primary-blue focus:border-primary-blue 
             transition-all text-[15px] bg-white font-apple font-light"
/>
```

### **Cards**
```tsx
<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
  {/* Content */}
</div>
```

---

## 📱 **RESPONSIVE BREAKPOINTS**

- **Mobile:** `< 640px` - Single column, stacked layout
- **Tablet:** `640px - 1024px` - Adjusted spacing
- **Desktop:** `> 1024px` - Full layout with optimal spacing

---

## ✅ **APPLICATION CHECKLIST**

### **Pages to Update:**
- [x] LoginPage.tsx
- [ ] OnboardingPage.tsx
- [ ] CommandCenterPage.tsx
- [ ] ProfessionalWorkflowPage.tsx
- [ ] SOAPEditor.tsx
- [ ] PatientConsentPortalPage.tsx
- [ ] All other pages

### **Elements to Standardize:**
- [x] Typography (font-apple, sizes, weights)
- [x] Colors (primary-blue, primary-purple gradient)
- [x] Buttons (h-11, text-[15px], font-medium)
- [x] Inputs (h-11, text-[15px], font-light)
- [x] Spacing (consistent margins/padding)
- [x] Canadian identity (maple leaf 🍁)

---

## 🚫 **DO NOT USE**

- ❌ Bold fonts (`font-bold`) - Use `font-light` or `font-medium` instead
- ❌ Large sizes (`text-5xl`, `text-6xl`) - Use `text-3xl sm:text-4xl` max
- ❌ Old gradient colors (`#7C3AED`, `#2563EB`) - Use `#667EEA` → `#764BA2`
- ❌ Heavy shadows - Use `shadow-sm` only
- ❌ Multiple font families - Use `font-apple` exclusively

---

## 📝 **USAGE EXAMPLES**

### **Page Header**
```tsx
<div className="text-center mb-8">
  <p className="text-[10px] font-light text-gray-500 uppercase tracking-[0.02em] mb-4 font-apple">
    SECTION LABEL • PHIPA COMPLIANT
  </p>
  
  <h1 className="text-3xl sm:text-4xl font-light mb-3 tracking-[-0.02em] leading-[1.1] font-apple">
    Welcome to{' '}
    <span className="bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent font-medium">
      AiduxCare
    </span>
    <span className="ml-2 text-2xl">🍁</span>
  </h1>
  
  <p className="text-lg text-gray-600 font-light leading-[1.3] font-apple">
    Your Best Medico-Legal Copilot
  </p>
</div>
```

### **Section Title**
```tsx
<h2 className="text-xl font-medium text-gray-900 mb-5 text-center font-apple">
  Section Title
</h2>
```

### **Footer with Canadian Identity**
```tsx
<div className="text-center">
  <p className="text-[12px] text-gray-500 font-apple font-light flex items-center justify-center gap-1">
    <span>🍁</span>
    <span>PHIPA Compliant • SSL Secured • 100% Canadian Data</span>
  </p>
</div>
```

---

## 🎯 **DESIGN PRINCIPLES**

1. **Apple-Inspired Simplicity** - Clean, minimal, professional
2. **Thin Typography** - Use `font-light` as default
3. **Subtle Colors** - Soft gradient, not intense
4. **Canadian Identity** - Maple leaf (🍁) in headers/footers
5. **Consistent Spacing** - Mathematical precision
6. **Professional Medical** - Trustworthy, credible appearance

---

**This design system is OFFICIAL and must be applied to ALL pages in AiduxCare.**

