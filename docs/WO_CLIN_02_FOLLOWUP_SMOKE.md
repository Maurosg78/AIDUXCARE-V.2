# WO-CLIN-02 – Script de smoke test para follow-up basado en ETP

**Estado:** 🟡 **PENDIENTE**

**Fecha:** 2025-12-07

**Owner:** Equipo Implementador (backend / Cloud Functions)

---

## 🎯 Objetivo

Validar que un follow-up:
- Lee el ETP previo correctamente
- Genera nota de seguimiento que respeta el plan
- Mantiene continuidad clínica entre sesiones

---

## 📋 Entregable

**Script:** `functions/scripts/test-followup-smoke.js`

**Funcionalidad:**
- Busca o crea:
  - Paciente dummy
  - Episodio con ETP ya creado (puede usar el generado por WO-CLIN-01)
- Llama a la función correspondiente al follow-up
- Verifica que:
  - `followupNote` existe
  - Hace referencia al ETP correcto
  - Respeta objetivos del plan previo

---

## 🔧 Implementación

### Estructura del script

```javascript
'use strict';

const admin = require('firebase-admin');
// TODO: Importar función de follow-up

async function main() {
  // 1. Inicializar Firebase Admin
  // 2. Buscar episodio con ETP previo (o crear uno)
  // 3. Leer ETP previo
  // 4. Construir payload de follow-up
  // 5. Llamar a función de procesamiento
  // 6. Verificar que nota hace referencia al ETP
  // 7. Verificar que respeta objetivos
  // 8. Mostrar resumen
}

main();
```

### Payload mínimo

```javascript
const payload = {
  patientId: 'TEST-PATIENT-001',
  episodeId: 'TEST-EPISODE-001',
  visitType: 'follow-up',
  transcript: `
    Patient reports 50% improvement in pain.
    Can now sit for 30 minutes without pain.
    Still has some stiffness in the morning.
    Following home exercise program 3x/week.
  `,
  previousETP: {
    // ETP del episodio previo
  },
  professionalProfile: {
    // Profile mínimo
  },
};
```

### Verificaciones

1. **Nota de follow-up creada:**
   - Colección: `notes` o `clinicalNotes`
   - Campo: `noteType: 'follow-up'`
   - Campo: `episodeId` coincide con episodio previo

2. **Referencia al ETP:**
   - Nota menciona objetivos del ETP previo
   - Nota documenta progreso vs. baseline

3. **Continuidad clínica:**
   - Nota no propone nuevos tests físicos (solo en initial)
   - Nota respeta plan previo
   - Nota sugiere ajustes si es necesario

---

## ✅ Definition of Done (DoD)

- [ ] Script `test-followup-smoke.js` existe y ejecuta sin errores
- [ ] Script encuentra/crea episodio con ETP previo
- [ ] Script llama a función de follow-up correctamente
- [ ] Nota de follow-up se guarda en Firestore con:
  - [ ] `noteId` presente
  - [ ] `noteType: 'follow-up'`
  - [ ] Referencia al `episodeId` correcto
- [ ] Nota hace referencia al ETP previo
- [ ] Nota respeta objetivos del plan
- [ ] Logs no muestran errores 500
- [ ] Output muestra resumen claro:
  ```
  ✅ Follow-up pipeline OK
  • Note ID: ...
  • References ETP: ✅
  • Respects plan: ✅
  ```

---

## 🚨 Troubleshooting

### Error: "No previous ETP found"
- Verificar que episodio tiene ETP previo
- Ejecutar WO-CLIN-01 primero para crear ETP
- Verificar estructura de datos en Firestore

### Error: "ETP structure invalid"
- Verificar formato del ETP en Firestore
- Verificar que campos requeridos están presentes

### Error: "Follow-up note doesn't reference ETP"
- Verificar prompt de follow-up incluye contexto de ETP
- Verificar que función recibe ETP previo correctamente

---

**Última actualización:** 2025-12-07  
**Estado:** 🟡 **PENDIENTE** - Requiere implementación

