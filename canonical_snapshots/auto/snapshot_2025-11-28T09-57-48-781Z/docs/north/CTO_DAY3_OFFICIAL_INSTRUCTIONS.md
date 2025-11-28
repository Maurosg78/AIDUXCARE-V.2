# 📱 **CTO → IMPLEMENTADOR — ÓRDENES OFICIALES DÍA 3**

**Date:** November 2025  
**From:** CTO  
**To:** Implementation Team  
**Status:** ✅ **OFFICIAL - NO ALTERNATIVES**

---

## ✅ **CTO REVIEW — DÍA 2 COMPLETADO**

El implementador **cumplió al 100%** con el DoD del Día 2:

- ✔ Audio Pipeline robusto
- ✔ Retries + backoff
- ✔ Latency tracking
- ✔ Failure classification
- ✔ User-facing errors
- ✔ Logging Supabase
- ✔ Testing suite (90%+ coverage)
- ✔ Documentación actualizada
- ✔ Script Data Residency creado

**No hay desviaciones. No hay deuda técnica nueva. La calidad de implementación es aceptable para entorno clínico.**

---

## ⚠️ **ÚNICO BLOQUEADOR: VERIFICACIÓN MANUAL DATA RESIDENCY**

El implementador ya hizo **todo lo que podía hacer sin acceso**.

Ahora la responsabilidad pasa a CTO:

### Necesario:
- Firestore region
- Storage bucket region
- Supabase region

**Debes entrar a la consola y validar en vivo.**

💬 *Cuando tengas esas tres capturas, las adiciono al documento y cierro el riesgo legal.*

---

## 🚨 **INSTRUCCIÓN GENERAL**

**Día 3 se dedica EXCLUSIVAMENTE a Mobile Testing.**

**No se toca ningún otro sistema.**

**No se desarrollan nuevas features.**

**No se optimiza nada que no sea móvil.**

---

## 🟦 **1. TUS TAREAS OBLIGATORIAS DEL DÍA 3**

### **A. Ejecutar el flujo clínico completo en dispositivos reales o simuladores**

**Debes probar de principio a fin:**

1. Login
2. Crear paciente
3. Grabar audio
4. Subir audio
5. Esperar pipeline
6. Recibir SOAP
7. Guardar en Clinical Vault
8. Ir a `/documents`
9. Abrir la nota
10. Copiar texto
11. Usar Feedback Widget

**Debes repetirlo en:**

- iPhone (Safari)
- iPad (Safari)
- Android (Chrome)

---

### **B. Documentar cada paso**

Para cada dispositivo, debes registrar:

- **PASS / FAIL**
- **Captura de pantalla o video**
- **Tiempo total del pipeline**
- **Errores observados**
- **Comportamiento del UI**
- **Lag/scroll/teclado/etc.**

Usa el archivo:

📄 `MOBILE_TESTING_REPORT_TEMPLATE.md`

---

### **C. Corregir SOLO bugs móviles**

Puedes corregir únicamente:

- Permisos de micrófono
- Problemas de grabación
- Layout roto en pantallas pequeñas
- Botones que no responden
- Modales que no cierran
- Scroll bloqueado
- Inputs que no abren el teclado
- Safari quirks (bloqueo de audio, policies)
- Chrome quirks

**Nada más.**

---

## 🟥 **2. LO QUE ESTÁ ESTRICTAMENTE PROHIBIDO**

### ❌ **NO tocar backend**

- No modificar Firebase
- No alterar Supabase
- No cambiar funciones serverless
- No tocar pipeline audio → SOAP (ya está cerrado)

### ❌ **NO tocar Clinical Vault**

### ❌ **NO tocar Command Center**

### ❌ **NO agregar nuevas features**

### ❌ **NO refactorizar componentes**

### ❌ **NO optimizar UI general**

### ❌ **NO mover rutas ni navegación**

### ❌ **NO mezclar tareas del Día 4–14**

**Si encuentras algo fuera de móvil:**

**LO REPORTAS, NO LO TOCAS.**

---

## 🟢 **3. DEFINICIÓN DE DONE (DoD) — DÍA 3**

Tu trabajo será aceptado solo si entregas:

---

### ✔ **1. `MOBILE_TESTING_REPORT.md` COMPLETO**

Debe incluir:

- Estado por dispositivo (iPhone / iPad / Android)
- Capturas o videos
- Tabla de bugs (Critical / High / Medium / Low)
- Tiempos del pipeline
- Observaciones técnicas
- Diagnóstico de usabilidad móvil
- Recomendación final (Go / No-Go móvil)

---

### ✔ **2. Bugs críticos corregidos**

Un bug se considera crítico si:

- impide grabar audio
- impide subir audio
- impide ver el SOAP
- rompe el flujo en Safari/Chrome
- impide acceder al Clinical Vault
- bloquea botones/modales
- o deja la pantalla inutilizable

**TODOS esos deben estar corregidos hoy.**

---

### ✔ **3. Tests creados para lo que sea unit-testable**

- Interacciones táctiles
- Render móvil
- Safari mocks
- Mobile layouts
- Error states táctiles

(Lo que no sea testable, lo documentas.)

---

### ✔ **4. Confirmación final**

Debes entregar:

- `MOBILE_TESTING_REPORT.md`
- `MOBILE_TESTING_BUGS_FIXED.md`
- Test suite móvil
- Checklists marcados (iOS + Android)

**Solo cuando TODO esto esté entregado → Día 3 DONE.**

---

## 🟡 **4. CHECK-INS OBLIGATORIOS**

### ⏱ **12:00**

- Avance de test en iPhone
- Primeros bugs detectados
- Tiempo de pipeline
- Capturas iniciales

### ⏱ **18:00**

- Estado general iOS + Android
- Lista preliminar de bugs
- Correcciones críticas avanzadas
- Riesgos para el cierre

### ⏱ **23:59**

- Entrega completa
- Reportes
- Tests
- Fixes

---

## 🧪 **5. CÓMO SERÁ EVALUADO**

El CTO evaluará:

- ✔ Estabilidad del flujo móvil
- ✔ Calidad del reporte
- ✔ Severidad de bugs descubiertos
- ✔ Profundidad del testing
- ✔ Cumplimiento del DoD
- ✔ Eficiencia en correcciones
- ✔ Calidad de tests
- ✔ Organización del trabajo

**Si algo está fuera del scope: rechazo inmediato.**

---

## 🏁 **6. OBJETIVO FINAL DEL DÍA 3**

**Garantizar que AiDux funciona en móviles 100% desde audio → SOAP → Vault en dispositivos reales.**

**Si esto falla, el piloto falla.**

---

## ✅ **CTO SIGN-OFF**

**Este es el único plan válido para Día 3.**

**Ejecuta exactamente esto. Sin cambios. Sin desvíos. Sin excepciones.**

---

**CTO Signature:** ✅ **APPROVED**

**Effective Date:** November 2025  
**Status:** 🔴 **MANDATORY**

