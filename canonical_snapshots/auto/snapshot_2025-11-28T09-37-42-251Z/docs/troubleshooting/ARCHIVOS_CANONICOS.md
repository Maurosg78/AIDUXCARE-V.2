# 📋 ARCHIVOS CANÓNICOS - AiduxCare North

**Última actualización:** Noviembre 16, 2025  
**Propósito:** Definir la única fuente de verdad para componentes, servicios y rutas críticas.

---

## 🎯 PRINCIPIO FUNDAMENTAL

**Solo un archivo canónico por componente/servicio/ruta.**  
Cualquier duplicado debe moverse a `src/_quarantine/` con documentación de por qué existe.

---

## ✅ ARCHIVOS CANÓNICOS (ACTIVOS)

### **Router**
- ✅ **`src/router/router.tsx`** - Router principal canónico
  - Usa `createBrowserRouter` (React Router v6)
  - Importado por `src/App.tsx`
  - Rutas: `/`, `/consent`, `/workflow`, `/transparency`

### **Páginas**
- ✅ **`src/pages/LoginPage.tsx`** - Página de login canónica
  - Import: `@/pages/LoginPage`
  - Usado por router canónico

- ✅ **`src/pages/PatientConsentPage.tsx`** - Página de consentimiento

- ✅ **`src/pages/ProfessionalWorkflowPage.tsx`** - Workflow principal de fisios

- ✅ **`src/pages/TransparencyReportPage.tsx`** - Reporte de transparencia

### **Servicios Críticos**
- ✅ **`src/services/feedbackService.ts`** - Sistema de feedback
- ✅ **`src/services/crossBorderAIConsentService.ts`** - Consentimiento AI
- ✅ **`src/services/analyticsService.ts`** - Analytics principal
- ✅ **`src/services/pseudonymizationService.ts`** - Pseudonymization
- ✅ **`src/services/analyticsValidationService.ts`** - Validación analytics

### **Componentes Críticos**
- ✅ **`src/components/feedback/FeedbackWidget.tsx`** - Widget de feedback
- ✅ **`src/components/consent/CrossBorderAIConsentModal.tsx`** - Modal consentimiento
- ✅ **`src/components/transparency/TransparencyReport.tsx`** - Reporte transparencia
- ✅ **`src/components/error/WorkflowErrorBoundary.tsx`** - Error boundary

### **App Entry Points**
- ✅ **`src/App.tsx`** - Componente App principal
- ✅ **`src/main.tsx`** - Entry point de la aplicación

---

## 🚫 ARCHIVOS EN CUARENTENA

Los siguientes archivos NO deben ser importados ni usados:

### **`src/_quarantine/non-canonical-routers/`**
- `router.tsx.old` - Router duplicado viejo (si existe)

### **`src/_deprecated/`**
- Todos los archivos en esta carpeta están deprecados
- **NO importar de aquí**

### **`docs/_archive/`**
- `auth/LoginPage.deprecated.tsx` - LoginPage deprecado
- Archivos de documentación obsoleta

### **`backups/`**
- Todos los backups están en cuarentena
- **NO importar de aquí**

---

## 📝 REGLAS DE IMPORTACIÓN

### ✅ **IMPORTS CORRECTOS:**
```typescript
// ✅ Router canónico
import AppRouter from "@/router/router";

// ✅ LoginPage canónico
import LoginPage from "@/pages/LoginPage";

// ✅ Servicios canónicos
import { FeedbackService } from "@/services/feedbackService";
import { AnalyticsService } from "@/services/analyticsService";

// ✅ Componentes canónicos
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
```

### ❌ **IMPORTS PROHIBIDOS:**
```typescript
// ❌ NO usar rutas relativas cuando existe alias @
import LoginPage from "../pages/LoginPage";  // ❌
import LoginPage from "@/pages/LoginPage";   // ✅

// ❌ NO importar de _quarantine, _deprecated, backups
import LoginPage from "@/_deprecated/LoginPage";  // ❌
import LoginPage from "@/pages/LoginPage";        // ✅

// ❌ NO usar router duplicado
import AppRouter from "./router";  // ❌
import AppRouter from "@/router/router";  // ✅
```

---

## 🔍 VALIDACIÓN AUTOMÁTICA

### **Script de Validación:**
```bash
# Verificar imports canónicos
npm run validate:canonical

# Verificar archivos en cuarentena
npm run validate:quarantine
```

### **Pre-commit Hook:**
El hook verifica:
1. ✅ No hay imports de `_quarantine/`, `_deprecated/`, `backups/`
2. ✅ Router usa solo `@/router/router`
3. ✅ LoginPage usa solo `@/pages/LoginPage`
4. ✅ Servicios usan alias `@/services/`

---

## 🚨 PROCEDIMIENTO CUANDO SE ENCUENTRA DUPLICADO

### **1. Identificar Duplicado**
```bash
# Buscar duplicados
grep -r "from.*LoginPage" src/ | grep -v canonical
```

### **2. Mover a Cuarentena**
```bash
# Crear carpeta específica
mkdir -p src/_quarantine/non-canonical-pages

# Mover archivo
mv src/pages/LoginPage.old.tsx src/_quarantine/non-canonical-pages/

# Agregar README explicando por qué existe
echo "Archivo movido: [fecha]\nRazón: [explicación]" > src/_quarantine/non-canonical-pages/README.md
```

### **3. Actualizar Imports**
```bash
# Buscar todos los imports del archivo viejo
grep -r "from.*LoginPage.old" src/

# Reemplazar con import canónico
# Usar alias @ siempre que sea posible
```

### **4. Verificar**
```bash
# Verificar que no quedan imports al archivo viejo
grep -r "from.*LoginPage.old" src/

# Verificar que App.tsx usa archivo canónico
grep "from.*router/router" src/App.tsx
```

---

## 📋 CHECKLIST PRE-COMMIT

Antes de hacer commit, verificar:

- [ ] ✅ No hay imports de `_quarantine/`
- [ ] ✅ No hay imports de `_deprecated/`
- [ ] ✅ No hay imports de `backups/`
- [ ] ✅ Router usa `@/router/router`
- [ ] ✅ LoginPage usa `@/pages/LoginPage`
- [ ] ✅ Servicios usan alias `@/services/`
- [ ] ✅ Componentes usan alias `@/components/`
- [ ] ✅ App.tsx importa `@/router/router`

---

## 🔄 ACTUALIZAR ESTE DOCUMENTO

Cuando se agrega un nuevo archivo canónico:

1. Agregarlo a la sección "ARCHIVOS CANÓNICOS"
2. Agregar regla de importación en "REGLAS DE IMPORTACIÓN"
3. Actualizar script de validación si es necesario
4. Commit con mensaje: `docs: add canonical file [nombre]`

Cuando se mueve archivo a cuarentena:

1. Agregarlo a "ARCHIVOS EN CUARENTENA"
2. Documentar razón en README de cuarentena
3. Commit con mensaje: `chore: quarantine [archivo]`

---

**Mantenedor:** CTO Assistant  
**Revisión:** Cada vez que se modifica estructura de archivos críticos

