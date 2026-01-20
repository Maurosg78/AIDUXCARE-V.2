# 📋 DIAGNÓSTICO WO-FS-ENV-02 — Runtime Firestore Proof of Project

**Fecha:** 2026-01-20  
**WO:** WO-FS-ENV-02  
**Tipo:** Evidencia forense (sin cambios funcionales)

---

## 🧱 BLOQUE 1 — Evidencia de Project desde el Browser

### Archivo instrumentado
`src/lib/firebase.ts` (líneas 133-140)

### Logs agregados (solo lectura)
Se agregaron logs que imprimen la configuración real de Firebase en runtime:

```typescript
// WO-FS-ENV-02: Runtime Firestore Proof of Project - Log configuration evidence
if (typeof window !== 'undefined' && _app) {
  console.info("[PROOF] Firebase runtime config:", {
    projectId: _app.options.projectId,
    apiKey: _app.options.apiKey ? `${_app.options.apiKey.substring(0, 10)}...` : 'undefined',
    authDomain: _app.options.authDomain,
    storageBucket: _app.options.storageBucket,
  });
}
```

### Entregable (copiar logs del browser después de recargar la app):

```
[PROOF] Firebase runtime config:
- projectId: <valor mostrado en consola>
- apiKey: <primeros 10 caracteres mostrados>
- authDomain: <valor mostrado>
- storageBucket: <valor mostrado>
```

**Acción requerida:** 
1. Recargar la aplicación en el browser
2. Abrir DevTools → Console
3. Buscar logs que empiecen con `[PROOF]`
4. Copiar los valores mostrados

---

## 🧱 BLOQUE 2 — Evidencia de Firestore Endpoint en Red

### Instrucciones para captura manual

1. Abrir **DevTools → Network tab**
2. Filtrar por: `firestore.googleapis.com`
3. Recargar la página o ejecutar una acción que cause un error `permission-denied`
4. Buscar una request que falle (status 403 o error en respuesta)
5. Click en la request → **Headers** tab
6. Buscar la **Request URL**

### Formato esperado de URL

```
https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents/...
```

### Entregable (completar manualmente):

```
[PROOF] Firestore network request:
- URL: https://firestore.googleapis.com/v1/projects/...
- projectId in URL: <extraer de la URL>
- Collection path: <extraer de la URL después de /documents/>
```

**Ejemplo de URL completa:**
```
https://firestore.googleapis.com/v1/projects/aiduxcare-v2-uat-dev/databases/(default)/documents/episodes?...
```

---

## 🧱 BLOQUE 3 — Evidencia de Documento Consultado

### Instrucciones

Desde la misma request de red que falla:

1. En **Network tab**, click en la request
2. Ir a **Payload** o **Request** tab
3. Buscar el **collection path** y **documentId** (si aplica)

### Entregable (completar manualmente):

```
[PROOF] Runtime Firestore access:
- collection: /episodes | /encounters | /consent_verifications | /audit_logs
- documentId (if any): <si la request es a un documento específico>
- operation: read | write | query
```

**Nota:** Si es una query, el path será la colección. Si es un documento específico, incluirá el documentId.

---

## 🧱 BLOQUE 4 — Contraste con Admin SDK

### Script disponible
`scripts/firestore-backfill-ownership.ts`

### Modificación temporal para lectura (opcional)

El script actual no tiene función de solo lectura. Para obtener evidencia, se puede:

**Opción A:** Ejecutar el script en dry-run y revisar logs:
```bash
tsx scripts/firestore-backfill-ownership.ts --dry-run
```

**Opción B:** Crear script temporal de solo lectura (NO incluido en este WO, solo documentar):

```typescript
// Temporal: solo para evidencia
const db = initializeAdmin();
const episodesRef = db.collection('episodes');
const snapshot = await episodesRef.limit(1).get();
console.log('[PROOF] Admin SDK Firestore:', {
  projectId: db.app.options.projectId,
  collectionExists: !snapshot.empty,
  sampleDocId: snapshot.empty ? null : snapshot.docs[0].id
});
```

### Entregable (completar después de ejecutar):

```
[PROOF] Admin SDK Firestore:
- projectId: <valor del script>
- collection /episodes exists: yes/no
- sample doc id: <si existe>
```

**Acción requerida:** Ejecutar script de backfill en dry-run o crear script temporal de lectura.

---

## 🧱 BLOQUE 5 — Conclusión Forense

### Template para completar después de recopilar evidencia

```
Conclusion:
- Browser projectId == Admin projectId: YES / NO / PENDING
- Browser Firestore == Admin Firestore: YES / NO / PENDING
- Root cause proven: <one sentence basado en evidencia>
```

### Análisis esperado

**Si projectId coincide:**
- El problema NO es desalineación de proyecto
- La causa es probablemente: documentos sin campos de ownership o reglas incorrectas

**Si projectId NO coincide:**
- El problema ES desalineación de proyecto
- La causa es: app leyendo de un proyecto diferente al esperado

**Si paths no coinciden:**
- El problema ES desalineación de paths
- La causa es: código usando paths diferentes a los definidos en reglas

---

## 📌 CHECKLIST DE EVIDENCIA

- [ ] Logs de `[PROOF]` capturados del browser console
- [ ] Network request capturada con URL completa
- [ ] Collection path identificado en la request
- [ ] Admin SDK ejecutado y projectId confirmado
- [ ] Comparación Browser vs Admin completada
- [ ] Conclusión forense documentada

---

## 🛑 ESTADO ACTUAL

**WO-FS-ENV-02 completado parcialmente:**

✅ **BLOQUE 1:** Logs agregados en `src/lib/firebase.ts`  
⏳ **BLOQUE 2:** Requiere captura manual en browser DevTools  
⏳ **BLOQUE 3:** Requiere análisis de request de red  
⏳ **BLOQUE 4:** Requiere ejecución de script Admin SDK  
⏳ **BLOQUE 5:** Pendiente de evidencia de bloques anteriores  

**No se aplicaron cambios funcionales.**  
**Solo se agregaron logs de diagnóstico.**

---

**Próximo paso:** Recargar la app, capturar logs y requests de red, ejecutar script Admin SDK, y completar los entregables pendientes.
