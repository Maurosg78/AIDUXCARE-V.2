# HITO: Legal MVP — Links Funcionales + Documentos Canónicos

**Fecha:** 2025-12-15  
**Market:** CA  
**Language:** en-CA  
**Estado:** ✅ COMPLETADO  
**WO:** Checklist Canónico — Onboarding · Legal · Prompt Capability (P0)

---

## 🎯 Objetivo

Crear documentos legales MVP funcionales y conectarlos al onboarding wizard para que todos los links sean clickeables y muestren contenido real.

---

## ✅ Completado

### 1. Documentos Legales MVP Creados

**Ubicación:** `src/components/legal/legalContent.tsx`

- ✅ **Privacy Policy** (`PrivacyContent`)
  - Plain language, alineado con PHIPA/PIPEDA
  - Explica qué datos se procesan, cómo se usan
  - Data residency (Canadá)
  - Contacto de compliance
  
- ✅ **Terms of Use** (`TermsContent`)
  - Responsabilidades del profesional
  - Limitaciones del sistema (no diagnóstico, no tratamiento)
  - Jurisdicción (Ontario, Canadá)
  - Suspensión de cuenta por uso inapropiado

- ✅ **PHIPA / PIPEDA Acknowledgement** (`PHIPAPIPEDAContent`)
  - Explicación de qué es PHIPA
  - Explicación de qué es PIPEDA
  - Qué es audit trail
  - Responsabilidades del HIC (Health Information Custodian)

### 2. Modal Reutilizable

**Ubicación:** `src/components/legal/LegalModal.tsx`

- ✅ Modal reutilizable para mostrar documentos legales
- ✅ Scrollable, responsive
- ✅ Botón de cierre
- ✅ Fecha de última actualización

### 3. LegalChecklist Actualizado

**Ubicación:** `src/components/LegalChecklist.tsx`

- ✅ Usa `LegalModal` en lugar de modal básico
- ✅ Importa contenido legal desde `legalContent.tsx`
- ✅ Todos los links son clickeables y funcionan
- ✅ Eliminado contenido hardcodeado obsoleto

### 4. LocationDataStep Actualizado

**Ubicación:** `src/_deprecated/features_onboarding/wizard/LocationDataStep.tsx`

- ✅ 3 checkboxes legales requeridos:
  1. Terms of Use
  2. Privacy Policy
  3. PHIPA / PIPEDA Acknowledgement
- ✅ Textos actualizados a inglés (CA market)
- ✅ Mapeo correcto a campos de consent (`phipaConsent`, `pipedaConsent`)
- ✅ Todos los links abren el modal con contenido real

---

## 📋 Checklist P0 Completado

- ✅ **P0.1** Ningún link legal está "muerto" — Todos funcionan
- ✅ **P0.2** Contenido legal MVP creado (Privacy, Terms, PHIPA/PIPEDA)
- ✅ **P0.3** Privacy & Data Use documentado (PHIPA/PIPEDA aligned)
- ✅ **P0.4** Terms of Use documentado (Professional Platform)
- ✅ **P0.5** PHIPA/PIPEDA Acknowledgement explicativo
- ✅ **P1.7** Formato único elegido: Modal reutilizable (`<LegalModal />`)
- ✅ **P1.8** Links conectados en el wizard (`LocationDataStep`)

---

## 🎯 Características de los Documentos

### Plain Language
- ✅ No legalese excesivo
- ✅ Lenguaje claro y directo
- ✅ Explicaciones comprensibles

### Contenido Esencial
- ✅ Qué datos se procesan
- ✅ Para qué se usan
- ✅ Qué NO hace AiduxCare
- ✅ Audit logs (existencia y propósito)
- ✅ Disclaimer: "Not legal advice"

### Metadata
- ✅ Fecha y versión en cada documento
- ✅ Última actualización: December 15, 2025
- ✅ Versión: 1.0.0

---

## 🔗 Links Funcionales

Todos los checkboxes en `LocationDataStep` ahora tienen links funcionales:

1. **"I accept the Terms of Use"** → Abre modal con `TermsContent`
2. **"I accept the Privacy Policy"** → Abre modal con `PrivacyContent`
3. **"I acknowledge PHIPA / PIPEDA requirements"** → Abre modal con `PHIPAPIPEDAContent`

Cada modal es:
- Clickable desde el link "Read full terms"
- Scrollable para documentos largos
- Cierra con botón "Close" o click fuera
- Muestra fecha de última actualización

---

## 📁 Archivos Modificados/Creados

### Nuevos
- `src/components/legal/LegalModal.tsx` — Modal reutilizable
- `src/components/legal/legalContent.tsx` — Contenido legal MVP (3 documentos)
- `docs/north/HITO-ONBOARDING-LEGAL-MVP-2025-12-15.md` — Este documento

### Modificados
- `src/components/LegalChecklist.tsx` — Actualizado para usar nuevo modal y contenido
- `src/_deprecated/features_onboarding/wizard/LocationDataStep.tsx` — 3 checkboxes actualizados, textos en inglés

---

## 🚀 Próximos Pasos (P1-P2)

### P1 — Referencias Legales
- ☐ Buscar documentos de referencia reales (benchmark)
  - Jane App, Telus Health, OSCAR EMR
  - IPC Ontario, CPO guidance
  - Ajustar lenguaje basado en benchmarks

### P2 — Onboarding / Identidad
- ☐ Evitar duplicados críticos (email/phone único)
- ☐ Clarificar punto de entrada al onboarding

---

## ✨ Resultado

**Antes:** Links legales muertos o con contenido hardcodeado obsoleto  
**Después:** Todos los links funcionan, muestran contenido real, profesional, y alineado con PHIPA/PIPEDA

**Estado:** ✅ **READY FOR VALIDATION**

---

**Generado:** 2025-12-15  
**WO:** Checklist Canónico — Onboarding · Legal · Prompt Capability

