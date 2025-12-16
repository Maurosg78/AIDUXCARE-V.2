# 🎯 **SPRINT EXECUTION PLAN — PRIORIDADES OFICIALES**

**Date:** November 20, 2025  
**Status:** ✅ **IN PROGRESS**  
**Sprint:** Short Sprint - Critical Fixes

---

## 📋 **PRIORIDADES**

### **P1. Corrección Clínica y de Datos** 🔴 CRITICAL

1. **MSK tests mezclados (lumbar + muñeca)**
   - **Archivo:** `src/pages/ProfessionalWorkflowPage.tsx`, `src/core/msk-tests/library/mskTestLibrary.ts`
   - **Problema:** Tests de otras regiones aparecen en Physical Evaluation
   - **Solución:** Filtrar tests por región seleccionada, eliminar mocks
   - **Test:** Unit test para selector de tests

2. **SOAP con contenido ajeno (wrist en caso lumbar)**
   - **Archivo:** `src/services/PhysiotherapyPipelineService.ts`, `src/services/SOAPGenerationService.ts`
   - **Problema:** Objective contiene contenido de otras regiones
   - **Solución:** Construir Objective solo con tests seleccionados, eliminar templates dummy
   - **Test:** Unit test para mapper physicalTests → SOAP.Objective

3. **SOAP no aparece en Clinical Vault**
   - **Archivo:** `src/services/PersistenceService.ts`, `src/pages/DocumentsPage.tsx`
   - **Problema:** Notas no se guardan o no se leen correctamente
   - **Solución:** Verificar guardado en Firestore, conectar Clinical Vault
   - **Test:** Integration test para creación y lectura de notas

---

### **P2. Consentimiento Informado (Entorno Dev)** 🟡 HIGH

4. **Link de consentimiento que no abre en móvil**
   - **Archivo:** `src/services/patientConsentService.ts`, `src/utils/urlHelpers.ts`
   - **Problema:** Links usan localhost, no accesible desde iPhone
   - **Solución:** Usar `VITE_DEV_PUBLIC_URL` para construir links
   - **Test:** Unit test para generador de URL

5. **Mensajes/colores de consentimiento duplicados y fuera de paleta**
   - **Archivo:** `src/features/command-center/CommandCenterPage.tsx`, componentes de consentimiento
   - **Problema:** Múltiples banners, colores no oficiales
   - **Solución:** Unificar UX, usar paleta oficial
   - **Test:** Snapshot test del componente de banner

---

### **P3. Experiencia Canadá-First** 🟢 MEDIUM

6. **Command Center con textos en español**
   - **Archivo:** `src/features/command-center/CommandCenterPage.tsx`, componentes relacionados
   - **Problema:** Textos en español en build de North/Canada
   - **Solución:** Migrar todos los textos a en-CA
   - **Test:** Test de render que verifique ausencia de español

7. **Botones/alertas en negro o colores no oficiales**
   - **Archivo:** Todos los componentes de UI
   - **Problema:** Botones negros/grises oscuros fuera del design system
   - **Solución:** Reemplazar con gradientes oficiales
   - **Test:** Linter/snapshot que verifique clases esperadas

8. **Claridad "Copy to Clipboard" vs "Download .txt"**
   - **Archivo:** `src/components/SOAPEditor.tsx`
   - **Problema:** Falta claridad en diferencias entre acciones
   - **Solución:** Agregar subtítulos descriptivos
   - **Test:** Unit test para funciones de copy/download

---

## 🚫 **ZONA PROTEGIDA — NO TOCAR**

- ❌ Audio pipeline core
- ❌ retryWrapper, latencyTracker, errorClassification, pipelineLogger, audioPipeline
- ❌ Permisos de micrófono y recorder UI
- ❌ HTTPS + certificado local + mobileconfig
- ❌ Mobile Harness + instrumentation

---

## ✅ **PROGRESO**

- [ ] P1.1: MSK tests mezclados
- [ ] P1.2: SOAP con contenido ajeno
- [ ] P1.3: SOAP no aparece en Clinical Vault
- [ ] P2.1: Link consentimiento móvil
- [ ] P2.2: UX consentimiento
- [ ] P3.1: Command Center en español
- [ ] P3.2: Botones negros
- [ ] P3.3: Copy vs Download

---

**Signed:** Implementation Team  
**Date:** November 20, 2025  
**Status:** ✅ **EXECUTION IN PROGRESS**
