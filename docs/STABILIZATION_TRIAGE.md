# Stabilization Triage - Top 10 Fallos por Tipo

**Fecha:** 2025-12-23  
**Runner:** `pnpm test:lowmem:file` (baseline estable)  
**Muestra:** 10 tests representativos ejecutados

---

## 📊 Resumen Ejecutivo

**Tests ejecutados:** 10  
**Tests pasan:** 6 ✅  
**Tests fallan:** 4 ❌  
**Tasa de éxito:** 60%

---

## 🔴 Fallos Identificados (Top 10)

### 1. **CryptoService - WebCrypto/encrypt retorna null**
- **Archivo:** `test/tests/enterprise/CryptoService.spec.ts`
- **Tipo:** `crypto` / `WebCrypto API`
- **Error exacto:** `expected null to be 'Test medical record'`
- **Stack:** `CryptoService.spec.ts:11:20` - `expect(result).toBe(text)`
- **Causa probable:** WebCrypto API no disponible en jsdom o polyfill faltante
- **Fix:** Test setup (polyfill) o bug real
- **Prioridad:** P0 - Sistémico (afecta encriptación)

---

### 2. **hospitalPortalService - Validación de password incorrecta**
- **Archivo:** `src/services/__tests__/hospitalPortalService.test.ts`
- **Tipo:** `lógica de negocio` / `validación`
- **Error exacto:** `expected true to be false` - Password sin caracteres especiales debería fallar pero pasa
- **Stack:** `hospitalPortalService.test.ts:116:28` - `expect(result.valid).toBe(false)`
- **Causa probable:** Bug real en validación o test incorrecto
- **Fix:** Bug real (revisar implementación) o test incorrecto
- **Prioridad:** P1 - Lógica de negocio

---

### 3. **ErrorModal - Múltiples elementos encontrados**
- **Archivo:** `src/components/audio-pipeline/__tests__/ErrorModal.test.tsx`
- **Tipo:** `UI test` / `selector ambiguo`
- **Error exacto:** `Found multiple elements with the text: /connection/i`
- **Stack:** `ErrorModal.test.tsx:31:19` - `screen.getByText(/connection/i)`
- **Causa probable:** Test busca texto que aparece múltiples veces en el DOM
- **Fix:** Test (usar selector más específico: `getAllByText()[0]` o `getByTestId`)
- **Prioridad:** P2 - Test frágil

---

### 4. **assistantAdapter - runAssistantQuery no es función**
- **Archivo:** `src/core/assistant/__tests__/assistantAdapter.spec.ts`
- **Tipo:** `import/export` / `API incorrecta`
- **Error exacto:** `TypeError: runAssistantQuery is not a function`
- **Stack:** `assistantAdapter.spec.ts:143:28` - `await runAssistantQuery({...})`
- **Causa probable:** Import incorrecto o función no exportada/renombrada
- **Fix:** Bug real (revisar exports del módulo) o test incorrecto
- **Prioridad:** P1 - API rota

---

## ✅ Tests que Pasan

1. ✅ `src/core/audio-pipeline/__tests__/retryWrapper.test.ts` - 5 tests
2. ✅ `src/services/__tests__/feedbackService.test.ts` - 7 tests
3. ✅ `src/pages/__tests__/ProfessionalWorkflowPage.integration.test.tsx` - 8 tests
4. ✅ `src/components/feedback/__tests__/FeedbackWidget.test.tsx` - 4 tests
5. ✅ `src/components/transparency/__tests__/DataSovereigntyBadge.test.tsx` - 9 tests
6. ✅ `test/tests/core/notes/transcriptToSOAP.spec.tsx` - 3 tests

---

## 📋 Clasificación por Tipo

### **Crypto/WebCrypto** (1 fallo)
- CryptoService - encrypt/decrypt retorna null

### **Lógica de Negocio** (2 fallos)
- hospitalPortalService - validación password incorrecta
- assistantAdapter - función no encontrada

### **UI Tests Frágiles** (1 fallo)
- ErrorModal - selector ambiguo (múltiples elementos)

---

## 🎯 Priorización de Fixes

### **P0 - Sistémico (afecta muchos tests)**
1. **CryptoService** - WebCrypto polyfill en test-setup

### **P1 - Bugs Reales (lógica de negocio)**
2. **assistantAdapter** - Revisar exports/imports
3. **hospitalPortalService** - Revisar validación de password

### **P2 - Tests Frágiles (mejora calidad)**
4. **ErrorModal** - Usar selectores más específicos

---

## 📝 Notas

- **No se encontraron fallos de:** mock faltante, texto UI cambiado, timing, env var, firebase init, matchMedia, ResizeObserver
- **La mayoría de tests pasan** - El baseline está relativamente estable
- **Los fallos son específicos** - No son problemas sistémicos masivos

---

## 🔄 Próximos Pasos

1. **ToDo 2:** Agregar WebCrypto polyfill en test-setup para CryptoService
2. **Revisar exports** de assistantAdapter
3. **Revisar validación** de hospitalPortalService
4. **Mejorar selectores** en ErrorModal test

