# 📋 DIAGNÓSTICO WO-FS-ENV-01 — Firestore Project, Paths & Runtime Alignment

**Fecha:** 2026-01-20  
**WO:** WO-FS-ENV-01  
**Tipo:** Diagnóstico (sin cambios)

---

## 🧱 BLOQUE 1 — Confirmar Project Activo en Runtime

### Archivo revisado
`src/lib/firebase.ts`

### ProjectId identificado
- **Source:** `import.meta.env.VITE_FIREBASE_PROJECT_ID` (línea 40)
- **Configuración:** Variable de entorno en `.env.local`
- **Log en runtime:** Línea 133 muestra: `"✅ Firebase inicializado en modo CLOUD (sin emuladores). Proyecto:", firebaseConfig.projectId`

### Entregable
```
Runtime Firebase projectId: <valor de VITE_FIREBASE_PROJECT_ID en .env.local>
Source: src/lib/firebase.ts:40 (firebaseConfig.projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID)
Log confirmation: src/lib/firebase.ts:133 (console.info muestra projectId en runtime)
```

**Nota:** El valor exacto de `VITE_FIREBASE_PROJECT_ID` debe verificarse en `.env.local` (archivo no accesible por gitignore, pero según logs anteriores del usuario: `aiduxcare-v2-uat-dev`)

---

## 🧱 BLOQUE 2 — Confirmar Project en Firebase CLI

### Comandos ejecutados
```bash
firebase use
firebase projects:list
```

### Resultado
```
Error: EPERM: operation not permitted
```

**Causa:** Restricciones de sandbox en el entorno de ejecución. Los comandos de Firebase CLI requieren permisos fuera del sandbox.

### Entregable
```
Firebase CLI active project: <NO DISPONIBLE - requiere ejecución manual fuera de sandbox>
```

**Acción requerida:** Ejecutar manualmente:
```bash
firebase use
firebase projects:list
```

---

## 🧱 BLOQUE 3 — Mapear Paths Reales Usados por el Código

### Archivos inspeccionados
- `src/repositories/episodesRepo.ts`
- `src/repositories/encountersRepo.ts`
- `src/services/consentVerificationService.ts`
- `src/core/audit/FirestoreAuditLogger.ts`

### Entregable (tabla)

| File | Operation | Firestore path | Collection Type |
|------|-----------|----------------|-----------------|
| `episodesRepo.ts` | read/write | `/episodes` | Root collection |
| `episodesRepo.ts` | read (query) | `/episodes` (where: `patientId`, `status`) | Root collection |
| `encountersRepo.ts` | read/write | `/encounters` | Root collection |
| `encountersRepo.ts` | read (query) | `/encounters` (where: `patientId`, orderBy: `encounterDate`) | Root collection |
| `consentVerificationService.ts` | read/write | `/consent_verifications/{patientId}` | Root collection (documentId = patientId) |
| `FirestoreAuditLogger.ts` | create/read | `/audit_logs` | Root collection |

### Observaciones
- **Todas las colecciones son root collections** (no subcolecciones)
- **No se encontraron paths alternativos** (ej: `consents`, `consent_tokens`)
- **No hay subcolecciones** bajo `patients/{id}/episodes` o similar
- **Paths coinciden exactamente** con las reglas definidas en `firestore.rules`

---

## 🧱 BLOQUE 4 — Verificación Manual en Firebase Console

### Instrucciones para verificación manual

En el project identificado (verificar en `.env.local` o logs de runtime):

1. Abrir Firebase Console: https://console.firebase.google.com/project/[PROJECT_ID]/firestore
2. Verificar existencia de colecciones:

### Entregable (template para completar manualmente)

```
Collection | Exists | Notes
-----------|--------|------
/episodes | <PENDIENTE> | Verificar si hay documentos y si tienen campo `ownerUid`
/encounters | <PENDIENTE> | Verificar si hay documentos y si tienen campo `authorUid`
/consent_verifications | <PENDIENTE> | Verificar si hay documentos y si tienen campo `ownerUid`
/audit_logs | <PENDIENTE> | Verificar si hay documentos y si tienen campo `userId`
```

**Acción requerida:** Verificar manualmente en Firebase Console y completar la tabla.

---

## 🧱 BLOQUE 5 — Conclusión Técnica

### Análisis realizado

1. **ProjectId Runtime:**
   - Configurado desde `VITE_FIREBASE_PROJECT_ID` en `.env.local`
   - Log en runtime confirma que se inicializa correctamente
   - Valor esperado: `aiduxcare-v2-uat-dev` (según logs anteriores)

2. **Paths Firestore:**
   - Todos los paths son **root collections** (no subcolecciones)
   - Paths coinciden exactamente con reglas en `firestore.rules`:
     - `/episodes` ✅
     - `/encounters` ✅
     - `/consent_verifications` ✅
     - `/audit_logs` ✅
   - **No hay desalineación de paths** detectada en el código

3. **Estructura de datos:**
   - El código usa paths correctos
   - Las reglas están definidas para estos paths
   - **No hay evidencia de paths alternativos o subcolecciones**

### Conclusión

```
Conclusion:
- Project alignment: PENDIENTE (requiere verificación manual de Firebase CLI y Console)
- Path alignment: OK (paths del código coinciden con reglas de Firestore)
- Likely root cause: Los errores `permission-denied` NO son causados por desalineación de paths.
                     La causa más probable es que los documentos legacy no tienen los campos
                     de ownership requeridos (ownerUid, authorUid, userId) que las reglas
                     ahora exigen. Esto se alinea con el WO-FS-DATA-01 (backfill script).
```

### Evidencia

- ✅ Paths del código = Paths en reglas
- ✅ No hay subcolecciones o paths alternativos
- ⚠️ Pendiente: Verificar projectId en Firebase CLI y existencia de datos en Console
- ⚠️ Pendiente: Verificar si documentos tienen campos de ownership

---

## 📌 PRÓXIMOS PASOS RECOMENDADOS

1. **Ejecutar manualmente:**
   ```bash
   firebase use
   firebase projects:list
   ```
   Para confirmar project activo en CLI.

2. **Verificar en Firebase Console:**
   - Abrir Firestore Database
   - Verificar existencia de colecciones: `episodes`, `encounters`, `consent_verifications`, `audit_logs`
   - Verificar si documentos tienen campos: `ownerUid`, `authorUid`, `userId`

3. **Si documentos no tienen campos de ownership:**
   - Ejecutar script de backfill: `tsx scripts/firestore-backfill-ownership.ts --dry-run`
   - Revisar resultados y ejecutar sin `--dry-run` si es necesario

---

**WO-FS-ENV-01 completado.**  
**No se aplicaron cambios.**  
**Diagnóstico documentado.**
