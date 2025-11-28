# Configuración de Índices de Firestore
## Requeridos para ProfessionalWorkflowPage

**Fecha:** 2025-11-25  
**Proyecto:** aiduxcare-v2-uat-dev  
**Prioridad:** 🔴 CRÍTICA - La aplicación no funciona sin estos índices

---

## ⚠️ PROBLEMA ACTUAL

La aplicación está generando errores de Firestore porque faltan índices compuestos necesarios para las queries. Estos errores impiden que se carguen:
- **Último encuentro del paciente** (columna "LAST SESSION")
- **Episodio activo del paciente** (columna "TODAY'S PLAN")

---

## 📋 ÍNDICES REQUERIDOS

### Índice 1: Encounters - Último Encuentro por Paciente

**Colección:** `encounters`  
**Campos del Índice:**
1. `patientId` (Ascending)
2. `status` (Ascending) 
3. `encounterDate` (Descending)

**Query que lo requiere:**
```typescript
// src/repositories/encountersRepo.ts:104-110
query(
  encountersRef,
  where('patientId', '==', patientId),
  where('status', 'in', ['completed', 'signed']),
  orderBy('encounterDate', 'desc'),
  limit(1)
)
```

**URL de creación directa:**
```
https://console.firebase.google.com/v1/r/project/aiduxcare-v2-uat-dev/firestore/indexes?create_composite=Cldwcm9qZWN0cy9haWR1eGNhcmUtdjItdWF0LWRldi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZW5jb3VudGVycy9pbmRleGVzL18QARoNCglwYXRpZW50SWQQARoKCgZzdGF0dXMQARoRCg1lbmNvdW50ZXJEYXRlEAIaDAoIX19uYW1lX18QAg
```

**Pasos manuales:**
1. Ir a [Firebase Console](https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/firestore/indexes)
2. Click en "Create Index"
3. Colección: `encounters`
4. Agregar campos:
   - `patientId` - Ascending
   - `status` - Ascending
   - `encounterDate` - Descending
5. Click "Create"

---

### Índice 2: Episodes - Episodio Activo por Paciente

**Colección:** `episodes`  
**Campos del Índice:**
1. `patientId` (Ascending)
2. `status` (Ascending)
3. `startDate` (Descending)

**Query que lo requiere:**
```typescript
// src/repositories/episodesRepo.ts:88-94
query(
  episodesRef,
  where('patientId', '==', patientId),
  where('status', '==', 'active'),
  orderBy('startDate', 'desc'),
  limit(1)
)
```

**URL de creación directa:**
```
https://console.firebase.google.com/v1/r/project/aiduxcare-v2-uat-dev/firestore/indexes?create_composite=ClVwcm9qZWN0cy9haWR1eGNhcmUtdjItdWF0LWRldi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZXBpc29kZXMvaW5kZXhlcy9fEAEaDQoJcGF0aWVudElkEAEaCgoGc3RhdHVzEAEaDQoJc3RhcnREYXRlEAIaDAoIX19uYW1lX18QAg
```

**Pasos manuales:**
1. Ir a [Firebase Console](https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/firestore/indexes)
2. Click en "Create Index"
3. Colección: `episodes`
4. Agregar campos:
   - `patientId` - Ascending
   - `status` - Ascending
   - `startDate` - Descending
5. Click "Create"

---

## 🚀 MÉTODO RÁPIDO: Usar URLs Directas

### Opción 1: Click en los Links de Error (Más Fácil)

Los errores en la consola del navegador incluyen links directos. Simplemente:

1. Abre la consola del navegador (F12)
2. Busca el error que dice: `The query requires an index. You can create it here:`
3. **Click en el link** - Te llevará directamente a la página de creación del índice
4. Click en "Create Index"
5. Espera 1-2 minutos a que se construya el índice

### Opción 2: Crear Ambos Índices Manualmente

1. Ve a: https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/firestore/indexes
2. Click en "Create Index" dos veces (una para cada índice)
3. Completa los campos según las especificaciones arriba

---

## ⏱️ TIEMPO DE CONSTRUCCIÓN

Los índices pueden tardar:
- **Índices pequeños (< 10,000 documentos):** 1-2 minutos
- **Índices medianos (10,000 - 100,000 documentos):** 5-10 minutos
- **Índices grandes (> 100,000 documentos):** 15-30 minutos

**Estado:** Puedes verificar el progreso en la misma página de índices. El estado cambiará de "Building" a "Enabled" cuando esté listo.

---

## ✅ VERIFICACIÓN

Una vez creados los índices, verifica que funcionan:

1. Recarga la página del workflow
2. Abre la consola del navegador (F12)
3. Los errores de Firestore deberían desaparecer
4. Las columnas "LAST SESSION" y "TODAY'S PLAN" deberían cargar correctamente

---

## 🔍 TROUBLESHOOTING

### Error: "Index already exists"
- El índice ya fue creado previamente
- Verifica en la lista de índices que esté en estado "Enabled"

### Error: "Collection does not exist"
- Las colecciones `encounters` y `episodes` deben existir primero
- Crea al menos un documento en cada colección antes de crear los índices

### Los índices están "Building" por mucho tiempo
- Normal para colecciones grandes
- Puedes seguir usando la aplicación, pero las queries fallarán hasta que se completen
- Verifica el progreso en la consola de Firebase

### Los errores persisten después de crear los índices
1. Verifica que los índices estén en estado "Enabled" (no "Building")
2. Recarga completamente la página (Ctrl+Shift+R o Cmd+Shift+R)
3. Limpia la caché del navegador
4. Verifica que estás en el proyecto correcto: `aiduxcare-v2-uat-dev`

---

## 📝 NOTAS ADICIONALES

### ¿Por qué se necesitan estos índices?

Firestore requiere índices compuestos cuando una query:
- Usa múltiples filtros `where()`
- Combina filtros con `orderBy()` en campos diferentes
- Usa `in` con `orderBy()`

En este caso:
- `where('patientId', '==', ...)` + `where('status', 'in', ...)` + `orderBy('encounterDate', ...)` requiere índice compuesto
- `where('patientId', '==', ...)` + `where('status', '==', ...)` + `orderBy('startDate', ...)` requiere índice compuesto

### Prevención Futura

Para evitar este problema en el futuro:
1. Usa el emulador de Firestore localmente para detectar queries que requieren índices
2. Documenta todas las queries complejas
3. Considera crear índices como parte del proceso de deployment

---

## 📞 SOPORTE

Si después de seguir estos pasos los errores persisten:
1. Verifica que estás en el proyecto correcto: `aiduxcare-v2-uat-dev`
2. Verifica que los nombres de las colecciones sean exactos: `encounters` y `episodes`
3. Verifica que los nombres de los campos sean exactos (case-sensitive)
4. Contacta al equipo de desarrollo con screenshots de los errores

---

**Última actualización:** 2025-11-25

