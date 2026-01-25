# 🔍 INFORME DE INVESTIGACIÓN - Error Consent Portal

**Fecha:** 2026-01-24  
**Error observado:** "Failed to record consent. Please check your connection and try again."  
**Ubicación:** `src/pages/PatientConsentPortalPage.tsx` línea 180  
**Contexto:** Portal del paciente intentando aceptar consentimiento vía Cloud Function

---

## 📋 RESUMEN EJECUTIVO

El error se produce en el `catch` block del `handleAcceptConsent`, lo que indica que **el `fetch` a la Cloud Function está fallando** antes de recibir una respuesta HTTP válida.

**Código relevante:**
```typescript
catch (err) {
  console.error('[ConsentPortal] Error accepting consent:', err);
  setError('Failed to record consent. Please check your connection and try again.');
}
```

Esto significa que **NO es un error HTTP 4xx/5xx**, sino una **excepción de red o JavaScript**.

---

## 🔍 POSIBLES CAUSAS IDENTIFICADAS

### 🔴 CAUSA 1: Cloud Function NO está deployada (MÁS PROBABLE)

**Evidencia:**
- La función `acceptPatientConsentByToken` fue creada en código
- Último deploy visible: `apiConsentVerify` (función diferente)
- No hay evidencia de deploy de `acceptPatientConsentByToken` en los logs

**Síntoma esperado:**
- `fetch` lanza `TypeError: Failed to fetch` o `NetworkError`
- URL retorna 404 o 403
- Error en consola del navegador: "net::ERR_NAME_NOT_RESOLVED" o similar

**URL construida:**
```
https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/acceptPatientConsentByToken
```

**Verificación requerida:**
```bash
# Verificar si la función existe
firebase functions:list --project aiduxcare-v2-uat-dev | grep acceptPatientConsentByToken

# O verificar en Cloud Console
# https://console.cloud.google.com/functions/list?project=aiduxcare-v2-uat-dev
```

**Probabilidad:** 🔴 **ALTA** (90%)

---

### 🟠 CAUSA 2: Permisos IAM - Función no es pública

**Evidencia:**
- La función está configurada como `https.onRequest` (pública)
- Pero puede requerir permisos IAM explícitos para acceso público
- Firebase Functions Gen 1 requiere `--allow-unauthenticated` flag

**Síntoma esperado:**
- `fetch` retorna 403 Forbidden
- Error: "Permission denied" o "Unauthenticated"
- En Cloud Console: función existe pero muestra "Requires authentication"

**Verificación requerida:**
```bash
# Verificar permisos IAM
gcloud functions get-iam-policy acceptPatientConsentByToken \
  --region=northamerica-northeast1 \
  --project=aiduxcare-v2-uat-dev

# Debe mostrar: allUsers: invoker
```

**Probabilidad:** 🟠 **MEDIA** (60%)

---

### 🟡 CAUSA 3: URL incorrecta por variables de entorno

**Evidencia:**
- Código usa: `import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'northamerica-northeast1'`
- Si `VITE_FIREBASE_FUNCTIONS_REGION` está mal configurado en build, URL será incorrecta
- Variables de entorno se inyectan en **build time**, no runtime

**Síntoma esperado:**
- URL construida apunta a región incorrecta
- Ejemplo: `us-central1` en lugar de `northamerica-northeast1`
- Función existe pero en otra región → 404

**URLs posibles (incorrectas):**
```
https://us-central1-aiduxcare-v2-uat-dev.cloudfunctions.net/acceptPatientConsentByToken  ❌
```

**Verificación requerida:**
```bash
# Verificar variables en build
npm run build 2>&1 | grep -i "VITE_FIREBASE"

# Verificar en código compilado
grep -r "northamerica-northeast1\|us-central1" dist/
```

**Probabilidad:** 🟡 **MEDIA-BAJA** (40%)

---

### 🟡 CAUSA 4: CORS preflight failure

**Evidencia:**
- Función tiene CORS configurado (líneas 34-37)
- Pero si el navegador hace OPTIONS request y falla, el POST nunca se ejecuta
- Navegadores móviles pueden ser más estrictos con CORS

**Síntoma esperado:**
- Error en consola: "CORS policy" o "preflight request failed"
- Network tab muestra OPTIONS request con error
- POST request nunca se envía

**Verificación requerida:**
- Abrir DevTools → Network tab
- Filtrar por "acceptPatientConsentByToken"
- Verificar si hay request OPTIONS y su respuesta

**Probabilidad:** 🟡 **MEDIA-BAJA** (30%)

---

### 🟢 CAUSA 5: Error de red / timeout

**Evidencia:**
- Usuario en móvil (según imagen)
- Conexión móvil puede ser inestable
- Cloud Functions pueden tener cold start (5-10 segundos)

**Síntoma esperado:**
- `fetch` timeout (default: sin timeout explícito)
- Error: "Network request failed"
- Intermitente (funciona a veces, falla otras)

**Probabilidad:** 🟢 **BAJA** (20%)

---

### 🟢 CAUSA 6: Error interno en Cloud Function (si está deployada)

**Evidencia:**
- Función puede estar deployada pero fallar internamente
- Error en validación de token
- Error en escritura a Firestore
- Error en formato de datos

**Síntoma esperado:**
- `fetch` retorna 500 Internal Server Error
- Pero el código actual captura esto en `if (!response.ok)` (línea 147)
- **NO debería llegar al catch** a menos que el error sea antes de recibir respuesta

**Probabilidad:** 🟢 **BAJA** (10%) - porque el catch solo se ejecuta si fetch falla completamente

---

### 🔵 CAUSA 7: Problema de formato de datos

**Evidencia:**
- Código envía: `{ token, decision: 'granted' }`
- Función espera: `{ token, decision }`
- Si `token` es `undefined` o `null`, validación falla

**Síntoma esperado:**
- Función retorna 400 Bad Request
- Pero esto debería ser capturado en `if (!response.ok)` (línea 147)
- **NO debería llegar al catch**

**Probabilidad:** 🔵 **MUY BAJA** (5%)

---

## 🎯 DIAGNÓSTICO POR PRIORIDAD

### Prioridad 1: Verificar si función está deployada

**Comando:**
```bash
firebase functions:list --project aiduxcare-v2-uat-dev
```

**Buscar:**
- `acceptPatientConsentByToken` en la lista
- Región: `northamerica-northeast1`
- Estado: `ACTIVE`

**Si NO existe:**
- **Causa confirmada:** Función no deployada
- **Solución:** Deploy de la función

---

### Prioridad 2: Verificar URL en código compilado

**Comando:**
```bash
# Verificar URL en dist/
grep -r "acceptPatientConsentByToken" dist/
grep -r "northamerica-northeast1\|us-central1" dist/assets/*.js | head -5
```

**Buscar:**
- URL completa construida
- Región correcta (`northamerica-northeast1`)

**Si URL incorrecta:**
- **Causa confirmada:** Variables de entorno mal configuradas en build
- **Solución:** Rebuild con variables correctas

---

### Prioridad 3: Verificar permisos IAM

**Comando:**
```bash
gcloud functions get-iam-policy acceptPatientConsentByToken \
  --region=northamerica-northeast1 \
  --project=aiduxcare-v2-uat-dev
```

**Buscar:**
- `allUsers` con rol `roles/cloudfunctions.invoker`

**Si falta:**
- **Causa confirmada:** Función requiere autenticación
- **Solución:** Hacer función pública:
  ```bash
  gcloud functions add-iam-policy-binding acceptPatientConsentByToken \
    --region=northamerica-northeast1 \
    --member="allUsers" \
    --role="roles/cloudfunctions.invoker" \
    --project=aiduxcare-v2-uat-dev
  ```

---

### Prioridad 4: Verificar logs de Cloud Function

**Comando:**
```bash
firebase functions:log --only acceptPatientConsentByToken --project aiduxcare-v2-uat-dev
```

**Buscar:**
- Requests recibidos
- Errores internos
- Stack traces

**Si hay logs:**
- Función está recibiendo requests
- Error es interno (validación, Firestore, etc.)

**Si NO hay logs:**
- Función no está recibiendo requests
- Problema de red/URL/permisos

---

## 🔬 ANÁLISIS DEL CÓDIGO ACTUAL

### Flujo de error en `handleAcceptConsent`:

```typescript
try {
  const response = await fetch(functionsUrl, {...});  // ← Puede fallar aquí
  
  if (!response.ok) {  // ← Si llega aquí, fetch fue exitoso pero HTTP error
    // Maneja errores HTTP (400, 404, 500, etc.)
    return;
  }
  
  const result = await response.json();  // ← Puede fallar aquí (JSON parse)
  
  if (result.success) {
    // Success
  }
} catch (err) {  // ← Solo se ejecuta si fetch falla completamente
  // Error de red, CORS, timeout, URL incorrecta
  setError('Failed to record consent. Please check your connection and try again.');
}
```

**Conclusión:**
El error "Please check your connection" **solo aparece si:**
1. `fetch` lanza excepción (no HTTP error)
2. `response.json()` falla (raro, pero posible)

**Errores HTTP (400, 404, 500) NO llegan al catch** - se manejan en `if (!response.ok)`.

---

## 📊 MATRIZ DE PROBABILIDAD

| Causa | Probabilidad | Impacto | Verificación |
|-------|--------------|----------|--------------|
| Función no deployada | 🔴 90% | 🔴 CRÍTICO | `firebase functions:list` |
| Permisos IAM | 🟠 60% | 🔴 CRÍTICO | `gcloud functions get-iam-policy` |
| URL incorrecta (env vars) | 🟡 40% | 🟠 ALTO | `grep` en `dist/` |
| CORS preflight | 🟡 30% | 🟠 ALTO | DevTools Network tab |
| Error de red/timeout | 🟢 20% | 🟡 MEDIO | Intermitente |
| Error interno CF | 🟢 10% | 🟡 MEDIO | `firebase functions:log` |
| Formato de datos | 🔵 5% | 🟢 BAJO | Ya validado en código |

---

## 🧪 PLAN DE VERIFICACIÓN (Orden de ejecución)

### Paso 1: Verificar deploy
```bash
firebase functions:list --project aiduxcare-v2-uat-dev | grep -i consent
```

**Resultado esperado:**
```
acceptPatientConsentByToken  northamerica-northeast1  ACTIVE
```

**Si NO aparece:**
- ✅ **Causa confirmada:** Función no deployada
- **Acción:** Deploy inmediato

---

### Paso 2: Verificar URL en build
```bash
# Verificar qué URL se construyó en el build
grep -o "northamerica-northeast1[^\"]*acceptPatientConsentByToken" dist/assets/*.js
```

**Resultado esperado:**
```
https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/acceptPatientConsentByToken
```

**Si URL incorrecta:**
- ✅ **Causa confirmada:** Variables de entorno incorrectas
- **Acción:** Rebuild con `.env.local` correcto

---

### Paso 3: Test manual de la función
```bash
# Test directo (si función está deployada)
curl -X POST \
  https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/acceptPatientConsentByToken \
  -H "Content-Type: application/json" \
  -d '{"token":"test-token","decision":"granted"}'
```

**Resultado esperado:**
- Si 404: Función no existe
- Si 403: Permisos IAM
- Si 400: Función existe pero token inválido (✅ bueno)
- Si 500: Error interno (revisar logs)

---

### Paso 4: Verificar permisos IAM
```bash
gcloud functions get-iam-policy acceptPatientConsentByToken \
  --region=northamerica-northeast1 \
  --project=aiduxcare-v2-uat-dev
```

**Resultado esperado:**
```yaml
bindings:
- members:
  - allUsers
  role: roles/cloudfunctions.invoker
```

**Si falta `allUsers`:**
- ✅ **Causa confirmada:** Función requiere autenticación
- **Acción:** Hacer pública

---

### Paso 5: Verificar logs en tiempo real
```bash
# En una terminal, monitorear logs
firebase functions:log --only acceptPatientConsentByToken --project aiduxcare-v2-uat-dev --follow

# En otra terminal/ventana, intentar aceptar consent desde el portal
```

**Resultado esperado:**
- Si aparecen logs: Función está recibiendo requests
- Si NO aparecen logs: Request no llega (URL/permisos/red)

---

## 🎯 CONCLUSIÓN DEL DIAGNÓSTICO

### Causa más probable (90%):
**La función `acceptPatientConsentByToken` NO está deployada.**

**Evidencia:**
1. Función fue creada en código recientemente
2. Último deploy visible fue de `apiConsentVerify` (función diferente)
3. No hay evidencia de deploy de `acceptPatientConsentByToken`
4. El error en `catch` es consistente con función inexistente (404 → NetworkError)

### Causa secundaria (60%):
**Función deployada pero sin permisos IAM públicos.**

**Evidencia:**
1. Firebase Functions Gen 1 requiere `--allow-unauthenticated` explícito
2. El deploy puede haber sido sin este flag
3. Error 403 se convierte en NetworkError en algunos navegadores

---

## 📝 RECOMENDACIONES

### Inmediato:
1. **Verificar si función está deployada:**
   ```bash
   firebase functions:list --project aiduxcare-v2-uat-dev
   ```

2. **Si NO está deployada:**
   ```bash
   firebase deploy --only functions:acceptPatientConsentByToken
   ```

3. **Verificar permisos IAM:**
   ```bash
   gcloud functions get-iam-policy acceptPatientConsentByToken \
     --region=northamerica-northeast1 \
     --project=aiduxcare-v2-uat-dev
   ```

4. **Si falta permisos públicos:**
   ```bash
   gcloud functions add-iam-policy-binding acceptPatientConsentByToken \
     --region=northamerica-northeast1 \
     --member="allUsers" \
     --role="roles/cloudfunctions.invoker" \
     --project=aiduxcare-v2-uat-dev
   ```

### Verificación post-deploy:
1. Test manual con `curl`
2. Verificar logs en tiempo real
3. Probar desde móvil real
4. Verificar que UI se desbloquea automáticamente

---

## 🔍 INFORMACIÓN ADICIONAL

### Variables de entorno requeridas:
- `VITE_FIREBASE_FUNCTIONS_REGION` (opcional, default: `northamerica-northeast1`)
- `VITE_FIREBASE_PROJECT_ID` (opcional, default: `aiduxcare-v2-uat-dev`)

### URL esperada:
```
https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/acceptPatientConsentByToken
```

### Formato de request esperado:
```json
{
  "token": "uuid-string",
  "decision": "granted" | "declined"
}
```

### Formato de response esperado:
```json
{
  "success": true
}
```

---

**Fin del informe**
