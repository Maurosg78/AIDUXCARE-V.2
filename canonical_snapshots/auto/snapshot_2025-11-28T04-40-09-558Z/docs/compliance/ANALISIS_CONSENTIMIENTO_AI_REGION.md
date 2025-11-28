# 🔍 ANÁLISIS: CONSENTIMIENTO AI Y REGIÓN DE PROCESAMIENTO

**Fecha:** Noviembre 16, 2025  
**Problema:** Modal de consentimiento aparece tarde + Verificar región real de procesamiento  
**Prioridad:** CRÍTICA - Compliance PHIPA s. 18

---

## 🎯 PROBLEMA ACTUAL

### **1. Timing del Modal:**
- ❌ **Modal aparece DESPUÉS** de que el fisio ya está usando la aplicación
- ❌ Solo se muestra cuando intenta generar SOAP (muy tarde)
- ❌ No puede leer el consentimiento al paciente ANTES de la consulta

### **2. Verificación de Región:**
- ❓ ¿TODAS las consultas van a Estados Unidos?
- ❓ ¿Hay procesamiento local en Canadá?
- ❓ ¿El texto del modal es preciso?

---

## 🔍 ANÁLISIS TÉCNICO - REGIÓN DE PROCESAMIENTO

### **Servicios Activos Actualmente:**

#### **✅ TODOS VAN A ESTADOS UNIDOS (`us-central1`):**

1. **`functions/index.js`** - `vertexAIProxy`
   ```javascript
   const LOCATION = 'us-central1'; // Estados Unidos
   const ENDPOINT = `https://${LOCATION}-aiplatform.googleapis.com/...`
   ```

2. **`src/services/vertex-ai-soap-service.ts`**
   ```typescript
   const VERTEX_PROXY_URL = 'https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy';
   ```

3. **`src/services/vertex-ai-service-firebase.ts`**
   ```typescript
   const VERTEX_PROXY_URL = 'https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy';
   ```

#### **⚠️ Servicio en Canadá (NO ACTIVO):**

- **`functions/clinical-analysis-v2.js`** - usa `northamerica-northeast1` (Montreal, Canadá)
  - ❌ **PERO NO SE ESTÁ USANDO** en el código actual
  - Solo se llama desde código legacy/deprecated

---

## ✅ CONCLUSIÓN: REGIÓN DE PROCESAMIENTO

### **RESPUESTA DIRECTA:**
**SÍ, TODAS las consultas de AI van a Estados Unidos (`us-central1`).**

- ✅ Análisis de transcripciones → `us-central1` (Estados Unidos)
- ✅ Generación de SOAP → `us-central1` (Estados Unidos)
- ✅ Procesamiento de tests físicos → `us-central1` (Estados Unidos)
- ✅ Todas las llamadas a Vertex AI → `us-central1` (Estados Unidos)

### **NO HAY PROCESAMIENTO LOCAL:**
- ❌ No hay procesamiento en Canadá (`northamerica-northeast1`) activo
- ❌ El servicio canadiense existe pero no se usa

---

## 📋 TEXTO ACTUAL DEL MODAL

### **Texto Actual (CrossBorderAIConsentModal.tsx):**

```
"Your health information will be processed by US-based AI services (Google Vertex AI) 
subject to US laws, including the US CLOUD Act. Under the CLOUD Act, US authorities 
may access your health data without notice."
```

### **✅ EVALUACIÓN:**
- ✅ **CORRECTO** - Dice que va a Estados Unidos
- ✅ **CORRECTO** - Menciona CLOUD Act
- ⚠️ **FALTA CLARIDAD** - No dice explícitamente "NO hay procesamiento local"

---

## 💡 PROPUESTA DE MEJORAS

### **1. Mover Modal al Principio:**

**Opción A: Después del Login (RECOMENDADA)**
- Modal aparece inmediatamente después de login exitoso
- Bloquea acceso al workflow hasta que se dé consentimiento
- Permite leer al paciente ANTES de iniciar consulta

**Opción B: Página Dedicada de Consentimiento**
- Nueva ruta `/consent-ai` después del login
- Página completa (no modal) para mejor lectura
- Redirige a `/workflow` después de consentir

**Opción C: En LoginPage (ANTES de login)**
- Mostrar información antes de autenticarse
- Pero no puede guardar consentimiento sin usuario autenticado
- ❌ No recomendada

### **2. Actualizar Texto del Modal:**

**Texto Propuesto:**
```
⚠️ IMPORTANT: All AI Processing Occurs in the United States

AiduxCare uses Google Vertex AI (Gemini 2.5 Flash) for clinical documentation. 
ALL AI processing occurs in the United States (us-central1 region). 

There is NO local AI processing in Canada. All clinical data sent for AI analysis 
will cross the border to US-based servers.

This means:
• Your health information will be processed in the United States
• US laws apply, including the US CLOUD Act
• US authorities may access your health data without notice
• No Canadian data sovereignty for AI processing
```

### **3. Estructura del Modal Mejorada:**

1. **Header:** "Cross-Border AI Processing Consent - REQUIRED"
2. **Warning Box:** Texto claro sobre procesamiento en Estados Unidos
3. **Disclosure Sections:** (mantener actuales)
   - AI Processing Disclosure
   - US CLOUD Act Risk
   - Data Retention
   - Right to Withdraw
   - Complaint Rights
4. **Alternative:** (mantener actual)

---

## 🔧 IMPLEMENTACIÓN PROPUESTA

### **Cambio 1: Mover Modal al Router**

**Archivo:** `src/router/router.tsx`

```typescript
// Nueva ruta de consentimiento
{ path: "/consent-ai", element: <AIConsentPage /> },
{ path: "/workflow", element: (
  <AIConsentGuard>
    <ProfessionalWorkflowPage />
  </AIConsentGuard>
) },
```

### **Cambio 2: Crear AIConsentGuard**

**Archivo:** `src/components/consent/AIConsentGuard.tsx`

```typescript
// Componente que verifica consentimiento antes de permitir acceso
// Si no hay consentimiento → redirige a /consent-ai
// Si hay consentimiento → renderiza children
```

### **Cambio 3: Actualizar Texto del Modal**

**Archivo:** `src/components/consent/CrossBorderAIConsentModal.tsx`

- Agregar warning box prominente sobre procesamiento en Estados Unidos
- Clarificar que NO hay procesamiento local
- Mantener todas las secciones actuales

---

## 📊 IMPACTO

### **Compliance:**
- ✅ PHIPA s. 18: Consentimiento explícito ANTES de procesamiento
- ✅ Transparencia: Información clara sobre región de procesamiento
- ✅ Auditoría: Consentimiento registrado antes de cualquier uso

### **UX:**
- ✅ Fisio puede leer consentimiento al paciente ANTES de consulta
- ✅ No interrumpe workflow (consentimiento dado una vez)
- ✅ Claro sobre riesgos y alternativas

---

## 🚨 DECISIÓN REQUERIDA

### **Pregunta 1: ¿Confirmamos que TODO va a Estados Unidos?**
- ✅ **SÍ** - Confirmado técnicamente
- ✅ **SÍ** - Debe reflejarse en el modal

### **Pregunta 2: ¿Dónde mostrar el modal?**
- **Opción A:** Después del login (recomendada)
- **Opción B:** Página dedicada `/consent-ai`
- **Opción C:** Otra ubicación

### **Pregunta 3: ¿Actualizamos el texto del modal?**
- ✅ **SÍ** - Agregar warning claro sobre procesamiento en Estados Unidos
- ✅ **SÍ** - Clarificar que NO hay procesamiento local

---

**Última actualización:** Noviembre 16, 2025  
**Mantenedor:** CTO Assistant

