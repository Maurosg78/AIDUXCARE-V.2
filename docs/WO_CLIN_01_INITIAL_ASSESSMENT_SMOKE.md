# WO-CLIN-01 – Script de smoke test para initial assessment

**Estado:** 🟡 **PENDIENTE**

**Fecha:** 2025-12-07

**Owner:** Equipo Implementador (backend / Cloud Functions)

---

## 🎯 Objetivo

Poder lanzar un test de extremo a extremo de la nota inicial sin depender del frontend.

**Validar que:**
- Se puede crear/usar paciente dummy
- Se puede llamar a la función principal (processWithVertexAI + endpoints apiCreateNote)
- Se guarda una nota con campos básicos en Firestore
- No hay errores 500 en funciones críticas

---

## 📋 Entregable

**Script:** `functions/scripts/test-initial-assessment-smoke.js`

**Funcionalidad:**
- Construye data minimal (patientId, episodio dummy, texto de entrada)
- Llama a la función HTTP/callable correspondiente
- Muestra:
  - `noteId`
  - `status` (draft / signed)
  - Presencia de `soap` / `etp` en Firestore

---

## 🔧 Implementación

### Estructura del script

```javascript
'use strict';

const admin = require('firebase-admin');
const { processImagingReport } = require('../../functions-min/src/processImagingReport.js');
// TODO: Importar función de initial assessment

async function main() {
  // 1. Inicializar Firebase Admin
  // 2. Crear/obtener paciente dummy
  // 3. Crear episodio dummy
  // 4. Construir payload de initial assessment
  // 5. Llamar a función de procesamiento
  // 6. Verificar resultado en Firestore
  // 7. Mostrar resumen
}

main();
```

### Payload mínimo

```javascript
const payload = {
  patientId: 'TEST-PATIENT-001',
  episodeId: 'TEST-EPISODE-001',
  visitType: 'initial',
  transcript: `
    Patient presents with lower back pain for 3 weeks.
    Pain started after lifting heavy box.
    Pain is worse in the morning, better with movement.
    No radicular symptoms.
    No red flags.
  `,
  professionalProfile: {
    // Profile mínimo
  },
};
```

### Verificaciones

1. **Nota creada en Firestore:**
   - Colección: `notes` o `clinicalNotes`
   - Campos: `patientId`, `episodeId`, `noteType: 'initial'`

2. **SOAP presente:**
   - Campo `soap` o `soapPlan` no vacío
   - Estructura válida

3. **ETP presente:**
   - Campo `etp` o `treatmentPlan` no vacío
   - Objetivos presentes

4. **Sin errores en logs:**
   - No errores 500 en `processWithVertexAI`
   - No errores 500 en `apiCreateNote`

---

## ✅ Definition of Done (DoD)

- [ ] Script `test-initial-assessment-smoke.js` existe y ejecuta sin errores
- [ ] Script crea/usa paciente dummy correctamente
- [ ] Script llama a función de initial assessment correctamente
- [ ] Nota se guarda en Firestore con:
  - [ ] `noteId` presente
  - [ ] `status` presente (draft o signed)
  - [ ] `soap` / `soapPlan` presente y no vacío
  - [ ] `etp` / `treatmentPlan` presente y no vacío
- [ ] Logs no muestran errores 500 en funciones críticas
- [ ] Output muestra resumen claro:
  ```
  ✅ Initial assessment pipeline OK
  • Note ID: ...
  • Status: draft
  • SOAP present: ✅
  • ETP present: ✅
  ```

---

## 🚨 Troubleshooting

### Error: "Function not found"
- Verificar que la función está desplegada
- Verificar nombre de función correcto
- Verificar región correcta

### Error: "Patient not found"
- Verificar que paciente dummy se crea correctamente
- Verificar permisos de Firestore

### Error: "Transcript too short"
- Aumentar longitud del transcript de prueba
- Verificar validaciones mínimas

### Error: "Vertex AI timeout"
- Verificar que Vertex AI está disponible
- Verificar que el prompt no es demasiado largo
- Verificar cuota de API

---

**Última actualización:** 2025-12-07  
**Estado:** 🟡 **PENDIENTE** - Requiere implementación

