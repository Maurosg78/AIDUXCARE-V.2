# 📩 **CTO → IMPLEMENTER: TESTING REQUIREMENTS**

**Date:** November 2025  
**From:** CTO  
**To:** Implementation Team  
**Subject:** Aidux North — All deliverables must include TESTS + test logic explanation

---

Hola,

Gracias por el informe de implementación de Día 1.

El avance es muy bueno, pero a partir de ahora **ninguna entrega se considera completa sin tests y sin explicación de la lógica de esos tests.**

Quiero que revises lo que ya hiciste hoy y lo complementes con pruebas claras.

---

## 🧪 **1. CLINICAL VAULT MVP** (`DocumentsPage.tsx`, ruta `/documents`)

Has marcado este punto como **100% completo**, pero necesito que también esté **testeado**.

### **1.1. Tests Obligatorios (Mínimo)**

**Unit Tests** (ej. `DocumentsPage.test.tsx`):

- ✅ Renderiza sin errores con una lista de notas.
- ✅ Ordena las notas por fecha (más reciente primero).
- ✅ El buscador:
  - Filtra por `patientId`.
  - Filtra por contenido dentro de S/O/A/P.
- ✅ El botón "Copy to clipboard":
  - Llama a la función de copiar.
  - El texto copiado incluye secciones: Subjective, Objective, Assessment, Plan.
- ✅ El modal de preview:
  - Se abre al hacer clic en una nota.
  - Se cierra correctamente.
  - Muestra todas las secciones del SOAP.

**Integration / UI Tests** (React Testing Library o Cypress, lo que uses):

- ✅ Flujo completo: abrir `/documents` → ver lista → buscar un paciente → abrir preview → copiar texto.

### **1.2. Lo que quiero en el próximo informe**

En `docs/north/IMPLEMENTER_FINAL_REPORT.md` agrega una sección:

> **Clinical Vault — Testing & Logic**
>
> - Tipo de tests realizados (unit/integration).
> - Archivos de test creados (paths).
> - Casos de uso cubiertos.
> - Edge cases probados (sin notas, muchas notas, búsqueda sin resultados).
> - Por qué consideras que estos tests son suficientes para el MVP.

---

## 🧪 **2. FEEDBACK SYSTEM** (`FAQPage.tsx`, `FeedbackWidget`, ruta `/faq`)

Lo marcas como **100% completo**. Necesito ver **tests**.

### **2.1. Tests Obligatorios**

**Unit Tests**:

- ✅ `FAQPage`:
  - Renderiza las 4 categorías.
  - Cambiar de categoría filtra correctamente las FAQs.
  - Contenido clave de privacidad y soporte está presente.
- ✅ `FeedbackWidget`:
  - Renderiza correctamente.
  - Llama al handler / API de envío al hacer submit (mock).
  - Maneja estados de carga y éxito/error.

**Integration Tests**:

- ✅ Navegación básica:
  - Command Center → FAQ → volver → Documents.
- ✅ Abrir FeedbackWidget en Command Center y enviar un feedback simulado.

### **2.2. En el informe**

Agrega:

> **Feedback System — Testing & Logic**
>
> - Qué has testeado en FAQ.
> - Cómo verificaste que el FeedbackWidget no rompe el flujo.
> - Qué pasa si el envío falla (simulación).

---

## 🧪 **3. DATA RESIDENCY** (`DATA_RESIDENCY_VERIFICATION.md` + Functions region)

Aquí el "test" es más de **verificación y evidencia**, pero igual lo quiero formalizado.

### **3.1. Lo que falta**

- ⚠️ Verificar región de **Firestore** en la consola.
- ⚠️ Verificar región de **Storage**.
- ⚠️ Verificar región de **Supabase**.

### **3.2. Qué quiero en el doc**

En `docs/north/DATA_RESIDENCY_VERIFICATION.md` agrega:

- ✅ Capturas de pantalla (o descripciones precisas) de:
  - Firestore location.
  - Storage bucket location.
  - Supabase región.
- ✅ La región exacta (ej: `northamerica-northeast1`).
- ✅ Fecha de verificación.
- ✅ Pasos para replicar la verificación.

Y en el informe:

> **Data Residency — Testing & Logic**
>
> - Cómo se verificó cada servicio.
> - Cómo puede un auditor repetir la verificación.

---

## 🧪 **4. AUDIO PIPELINE ROBUSTNESS** (Día 2 en adelante)

Antes de implementarlo, en el informe de Día 2 quiero **TU PLAN DE TESTS**:

- ✅ Cómo vas a testear:
  - Retries (3 intentos, backoff).
  - Fallos de red (simulados).
  - Errores de almacenamiento.
- ✅ Qué unit tests vas a hacer sobre la función de upload.
- ✅ Qué integración vas a hacer para flujo audio → upload → error/éxito.

Luego, cuando lo implementes, quiero la sección:

> **Audio Pipeline — Testing & Logic**
> con mismos puntos: tipos de test, escenarios, edge cases.

---

## 🧪 **5. MOBILE TESTING** (cuando empieces)

En cuanto arranques mobile, en el informe del día correspondiente quiero:

- ✅ Lista de dispositivos probados (modelo + navegador).
- ✅ Escenarios de prueba:
  - Login → grabar → SOAP → Vault → copiar.
- ✅ Resultado (OK / NOK) y notas.
- ✅ Cualquier bug abierto.

---

## 📌 **NORMA GENERAL A PARTIR DE AHORA**

Cada sección de tu informe debe tener un bloque:

> **Testing & Logic**
>
> - Tipo de tests (unit, integration, manual, etc.)
> - Herramientas usadas
> - Escenarios cubiertos
> - Casos límite
> - Justificación: por qué esos tests son suficientes para esta fase

---

## ✅ **ACCIÓN REQUERIDA**

**Para Día 1 (Retroactivo):**
1. Crear tests para Clinical Vault MVP
2. Crear tests para Feedback System
3. Actualizar informe con secciones "Testing & Logic"
4. Completar verificación de Data Residency con evidencia

**Para Día 2 (Proactivo):**
1. Incluir plan de tests antes de implementar Audio Pipeline
2. Documentar estrategia de testing en informe

---

**Gracias,**

**El criterio es simple: AiDux North va a usarse con datos clínicos reales en Canadá — nada se considera "done" sin pruebas y sin una explicación clara de cómo se ha testeado.**

---

**CTO Approval:** ✅ **REQUIRED**

