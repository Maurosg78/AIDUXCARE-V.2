# 📩 **CTO → IMPLEMENTADOR — INSTRUCCIONES OFICIALES DAY 2**

**Date:** November 2025  
**From:** CTO  
**To:** Implementation Team  
**Status:** ✅ **OFFICIAL - NO ALTERNATIVES**

---

## 🚨 **1. ENFOQUE DEL DÍA (OBLIGATORIO)**

Hoy se deben cumplir **tres entregables obligatorios**, en este orden:

1. **Data Residency Verification — 100% Canadá**

2. **Audio Pipeline Robustness — completado con los 3 ajustes CTO**

3. **Test Suite completa para todo lo desarrollado durante el día**

**No avanzarás ninguna otra funcionalidad.**

**No modificarás ningún otro módulo.**

**No abrirás tareas adicionales.**

---

## 🟥 **2. TAREA 1 — DATA RESIDENCY (09:00–11:30)**

### **DoD (Definition of Done):**

Para marcar esta tarea como DONE debes entregar:

### **✔ Firestore region verificada**

- Debe ser **northamerica-northeast1**
- Evidencia: captura de pantalla o screenshot textual
- Registrar en `DATA_RESIDENCY_VERIFICATION.md`

### **✔ Storage bucket region verificada**

- Debe ser **northamerica-northeast1**
- Evidencia incluida en el mismo documento

### **✔ Supabase region verificada**

- Debe ser **ca-central-1** o equivalente canadiense
- Evidencia incluida

### **✔ Pasos reproducibles para auditoría**

- Instrucciones claras de cómo verificar cada región
- Deben ser ejecutables por un tercero

### **🚨 Nota CTO:**

**Si alguna región NO ES canadiense → STOP WORK inmediato y escalarme.**

---

## 🟥 **3. TAREA 2 — AUDIO PIPELINE ROBUSTNESS (11:30–21:00)**

Esto incluye los **3 ajustes CTO obligatorios**.

### **✔ (A) Retry mechanism (3 retries, exponential backoff)**

- `attempt 1 → 500ms → attempt 2 → 1500ms → attempt 3`
- Si falla la tercera → registrar failure + mostrar error visible
- Implementado como wrapper reutilizable
- Ningún retry silencioso

### **✔ (B) Failure Classification**

Debes clasificar **todos** los fallos como uno de:

- `network_error`
- `storage_error`
- `whisper_error`
- `gpt_error`
- `timeout`

Y registrar cada uno en Supabase (`suggestion_events`).

### **✔ (C) Latency Tracking**

Debes capturar timestamps en estas etapas:

1. `upload_start`
2. `upload_end`
3. `whisper_start`
4. `whisper_end`
5. `gpt_start`
6. `gpt_end`
7. `total_pipeline_time`

Y enviar:

- `minutes_saved_estimate` calculado
- `pipeline_duration_ms`
- `upload_duration_ms`
- `gpt_duration_ms`
- `whisper_duration_ms`

A Supabase (`productivity_metrics`).

### **✔ (D) User-facing error messages**

Cada error debe:

- Abrir un modal
- Mostrar mensaje claro
- Mostrar botón "Try again"
- Cerrar modal sin romper el flujo

### **✔ (E) Logging**

- Todos los eventos deben registrarse en `suggestion_events`
- Con `event_type` mapeado según clasificación

### **✔ (F) NO MODIFICAR**

**No tocar:**

- Clinical Vault
- FAQ
- Feedback Widget
- Workflow UI
- Assistant logic
- Router
- Auth
- Patient records

Solo el Audio Pipeline y sus puntos de integración.

---

## 🟩 **4. TAREA 3 — TESTING OBLIGATORIO (21:00–02:00)**

Para marcar el día como DONE debes entregar:

### **Testing suite completa para:**

#### **1) Retry Mechanism**

- retry until success
- retry until fail
- exponential backoff timing
- failure after 3 retries
- error classification triggered

#### **2) Failure Classification**

- 5 tipos generados por mocks
- cada uno registrado en Supabase (mocked)
- cada uno mostrado en UI

#### **3) Latency Tracking**

- timestamps correctos
- cálculo correcto del total pipeline time
- registro de métricas en Supabase (mocked)

#### **4) User-facing UI**

- modal visible en error
- botón try again
- cierre modal
- reintento funcional

#### **5) Edge cases**

- network drop
- timeout
- incomplete upload
- whisper error
- GPT error

---

## 🧪 **5. DoD DEL DÍA (DEBES ENTREGAR TODO ESTO)**

Para que Día 2 se considere DONE:

### **✔ Documento actualizado:**

`IMPLEMENTER_DAY2_REPORT.md`

Con sección obligatoria:

**"Testing & Logic — Audio Pipeline"**

### **✔ Código:**

- Pipeline actualizado
- Retries + backoff
- Error classification
- Latency tracking
- Error modal
- Logging

### **✔ Tests:**

- Todos los tests arriba
- 90%+ de coverage en pipeline wrapper
- Pasan en CI local

### **✔ Evidencia:**

- Capturas/verificación Data Residency
- Log de pruebas realizadas
- Output de coverage

### **✔ Estado final:**

- Audio Pipeline si falla → visible + clasificado
- Tasa de fallo en mocks → <5%
- Latency promedio en mocks → <30s

---

## 🛑 **6. COSAS QUE NO DEBES TOCAR HOY**

Esto es mandato CTO:

### **🚫 No tocar:**

- Clinical Vault
- FAQ
- Feedback Widget
- Command Center UI
- Router general
- Authentication
- Patient data models
- Templates
- CSS global
- Design System
- i18n
- Storage rules
- Assistant logic

**Tu foco es única y exclusivamente:**

1. Data Residency
2. Audio Pipeline Robustness
3. Testing

**Nada más.**

---

## 🟦 **7. CHECK-INS OBLIGATORIOS**

- **12:00** — Data Residency status
- **18:00** — Pipeline implementation status
- **02:00** — Testing results + Day 2 report

**Si algo se bloquea o no cumple DoD:**

**→ Escalar inmediatamente por canal directo CTO.**

---

## ✅ **CTO SIGN-OFF**

**Este es el único plan válido para Día 2.**

**Ejecuta exactamente esto. Sin cambios. Sin desvíos. Sin excepciones.**

---

**CTO Signature:** ✅ **APPROVED**

**Effective Date:** November 2025  
**Status:** 🔴 **MANDATORY**

