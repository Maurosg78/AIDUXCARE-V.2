# 📋 Índice de WOs - Piloto CA-DEC2025

**Última actualización:** 2025-12-07  
**Estado general:** 🟡 **EN PROGRESO**

---

## 🎯 Visión General

Este índice lista todos los Work Orders (WOs) necesarios para preparar el piloto de diciembre 2025.

**Filosofía:** Cada WO deja una prueba concreta (script, doc, log). No estamos improvisando; estamos endureciendo un MVP acotado.

---

## 🧩 Fase 0 – Congelar Alcance

### ✅ WO-PILOT-01 – Definir qué puede y qué NO puede hacer el piloto

**Estado:** ✅ **COMPLETADO**

**Documento:** `docs/pilot/CA_DEC2025_PILOT_SCOPE.md`

**Entregable:**
- Documento completo con escenarios soportados
- Limitaciones conocidas y documentadas
- Listo para distribución a fisios/auditores

**DoD:**
- [x] Documento existe y está completo
- [x] Escenarios claramente definidos
- [x] Limitaciones documentadas

---

## 🧠 Fase 1 – Imaging Reports: Dejarlo Sólido para UAT

### ✅ WO-IR-02 – Procesar informes de imagen: extracción + resumen + metadatos

**Estado:** ✅ **COMPLETADO**

**Documento:** `docs/WO_IR_02_PROCESS_IMAGING_REPORTS.md`

**Entregable:**
- Función `processImagingReport` funcionando en local
- Scripts de diagnóstico validados
- Extracción de texto + resumen AI funcionando

**DoD:**
- [x] Función funciona en local
- [x] Scripts de diagnóstico validados
- [x] PDFs reales procesados exitosamente

---

### 🟡 WO-IR-03 – Alinear UAT con lo probado en local

**Estado:** 🟡 **EN PROGRESO**

**Documento:** `docs/WO_IR_03_ALIGN_UAT.md`

**Entregable:**
- Función desplegada en UAT
- Test end-to-end funcionando en UAT
- Logs validados

**DoD:**
- [ ] Función desplegada en UAT
- [ ] Test con curl devuelve respuesta correcta
- [ ] Logs muestran procesamiento exitoso

**Próximo paso:** Ejecutar pasos del WO-IR-03

---

## 🧾 Fase 2 – Pipeline Clínico Core

### 🟡 WO-CLIN-01 – Script de smoke test para initial assessment

**Estado:** 🟡 **PENDIENTE**

**Documento:** `docs/WO_CLIN_01_INITIAL_ASSESSMENT_SMOKE.md`

**Entregable:**
- Script `functions/scripts/test-initial-assessment-smoke.js`
- Test end-to-end de initial assessment funcionando

**DoD:**
- [ ] Script existe y ejecuta sin errores
- [ ] Nota se guarda en Firestore correctamente
- [ ] SOAP y ETP presentes
- [ ] Sin errores 500 en logs

**Próximo paso:** Implementar script según template

---

### 🟡 WO-CLIN-02 – Script de smoke test para follow-up basado en ETP

**Estado:** 🟡 **PENDIENTE**

**Documento:** `docs/WO_CLIN_02_FOLLOWUP_SMOKE.md`

**Entregable:**
- Script `functions/scripts/test-followup-smoke.js`
- Test end-to-end de follow-up funcionando

**DoD:**
- [ ] Script existe y ejecuta sin errores
- [ ] Nota de follow-up se guarda correctamente
- [ ] Referencia al ETP previo presente
- [ ] Respeta objetivos del plan

**Próximo paso:** Implementar script según template

---

## 📲 Fase 3 – Consentimiento + SMS

### 🟡 WO-CONSENT-01 – Test de sendConsentSMS y receiveSMS

**Estado:** 🟡 **PENDIENTE**

**Documento:** `docs/WO_CONSENT_01_SMS_TEST.md`

**Entregable:**
- Script `functions/scripts/test-sendConsentSMS.js`
- Documento `docs/pilot/CONSENT_FLOW_MINIMAL.md`

**DoD:**
- [ ] Script existe y ejecuta sin errores
- [ ] SMS se envía correctamente
- [ ] Log muestra ID de Vonage
- [ ] Documento explica flujo y limitaciones

**Próximo paso:** Implementar script y documentación

---

## 📊 Fase 4 – Checklist de QA

### ✅ WO-PILOT-02 – Checklist de QA de piloto

**Estado:** ✅ **COMPLETADO**

**Documento:** `docs/pilot/QA_CHECKLIST_DEC2025.md`

**Entregable:**
- Checklist completo para testers
- 3 escenarios principales paso a paso
- Listo para distribución

**DoD:**
- [x] Documento existe y está completo
- [x] Escenarios claramente definidos
- [x] Listo para imprimir/enviar a fisios

---

## 🛡️ Fase 5 – Observabilidad y Red de Seguridad

### ✅ WO-OPS-01 – Plan de soporte de piloto

**Estado:** ✅ **COMPLETADO**

**Documento:** `docs/pilot/OPS_PLAN_DEC2025.md`

**Entregable:**
- Plan completo de soporte técnico
- Dónde mirar logs
- Qué hacer si algo falla
- Modo degradado

**DoD:**
- [x] Documento existe y está completo
- [x] Logs documentados por función
- [x] Plan de contingencia definido

---

## 📈 Progreso General

### Por Fase

- **Fase 0 (Alcance):** ✅ 100% completado
- **Fase 1 (Imaging):** 🟡 50% completado (WO-IR-02 ✅, WO-IR-03 🟡)
- **Fase 2 (Clínico):** 🟡 0% completado (WO-CLIN-01 🟡, WO-CLIN-02 🟡)
- **Fase 3 (Consent):** 🟡 0% completado (WO-CONSENT-01 🟡)
- **Fase 4 (QA):** ✅ 100% completado
- **Fase 5 (Ops):** ✅ 100% completado

### Por Estado

- ✅ **Completados:** 4 WOs
- 🟡 **En progreso/Pendientes:** 4 WOs
- ❌ **Bloqueados:** 0 WOs

---

## 🎯 Próximos Pasos Prioritarios

1. **WO-IR-03** (Alta prioridad)
   - Validar imaging en UAT
   - Bloquea demo de imaging

2. **WO-CLIN-01** (Alta prioridad)
   - Validar initial assessment
   - Bloquea demo de notas iniciales

3. **WO-CLIN-02** (Media prioridad)
   - Validar follow-up
   - Bloquea demo de continuidad clínica

4. **WO-CONSENT-01** (Baja prioridad)
   - Validar SMS
   - No bloquea demo core, pero importante para piloto completo

---

## 📝 Notas

- Todos los documentos están en `docs/` o `docs/pilot/`
- Scripts de prueba deben ir en `functions/scripts/`
- Cada WO tiene su propio documento con DoD completo
- Este índice se actualiza cuando se completa un WO

---

**Última actualización:** 2025-12-07  
**Mantenido por:** Equipo técnico

