# 🔴 ANÁLISIS DE ERRORES: CORS y Modal de Consentimiento Verbal

**Fecha:** 2026-01-25  
**Prioridad:** CRÍTICA  
**Estado:** DIAGNÓSTICO COMPLETO

---

## 📋 RESUMEN EJECUTIVO

El sistema presenta **dos problemas críticos** que impiden el funcionamiento en desarrollo local:

1. **Error de CORS:** La Cloud Function `getConsentStatus` rechaza requests desde `localhost:5002`
2. **Modal reaparece:** A pesar del Optimistic UI Update, el modal verbal vuelve a aparecer

---

## 🔍 ANÁLISIS DETALLADO DE ERRORES

### Error 1: CORS Policy Violation

#### Mensaje de Error
```
Access to fetch at 'https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/getConsentStatus' 
from origin 'http://localhost:5002' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
The 'Access-Control-Allow-Origin' header has a value 'https://aiduxcare-v2-uat-dev.web.app' 
that is not equal to the supplied origin.
```

#### Causa Raíz
La Cloud Function `getConsentStatus` está configurada para **solo aceptar requests desde producción**:
- ✅ Acepta: `https://aiduxcare-v2-uat-dev.web.app`
- ❌ Rechaza: `http://localhost:5002`

#### Estado Actual del Código
**Archivo:** `functions/src/consent/getConsentStatus.js` (líneas 33-59)

```javascript
// ✅ Código ACTUAL (con fix para localhost)
const origin = req.headers.origin || req.headers.referer || '';
const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('localhost:5002');
const isProduction = origin === 'https://aiduxcare-v2-uat-dev.web.app';

if (isLocalhost || isProduction) {
  res.set('Access-Control-Allow-Origin', origin || '*');
} else {
  res.set('Access-Control-Allow-Origin', 'https://aiduxcare-v2-uat-dev.web.app');
}
```

**Problema:** El código tiene el fix, pero **la Cloud Function desplegada NO tiene este código**.

#### Verificación
El deploy anterior mostró:
- `✔ functions[getConsentStatus(northamerica-northeast1)] Successful update operation.`
- Pero luego: `Error: An unexpected error has occurred.`

**Conclusión:** El deploy puede haber fallado silenciosamente, o la función desplegada tiene una versión anterior.

---

### Error 2: Modal Verbal Reaparece

#### Síntoma
Después de registrar consentimiento verbal:
1. ✅ Usuario presiona "Patient GRANTS Consent"
2. ✅ Consentimiento se registra en Firestore
3. ✅ Modal se cierra inicialmente
4. ❌ **Modal vuelve a aparecer** mostrando la misma pantalla

#### Causa Raíz (Hipótesis)

**Hipótesis A: El componente se desmonta y vuelve a montar**
- `ConsentGateScreen` se renderiza condicionalmente en `ProfessionalWorkflowPage`
- Condición: `hasValidConsentForUI === false`
- Si el estado se resetea o hay un re-render, el componente se vuelve a montar
- Al montarse de nuevo, todos los estados se resetean (`showVerbalModal = false` → puede volver a `true`)

**Hipótesis B: El polling sigue activo y resetea el estado**
- Aunque el código detiene el polling, puede haber un delay
- El polling puede estar ejecutándose en paralelo y reseteando `hasConsent`

**Hipótesis C: El `onConsentVerified` navega pero el componente se vuelve a renderizar**
- `navigate('/command-center')` puede causar un re-render
- Si `hasValidConsentForUI` no se actualiza a tiempo, el gate vuelve a aparecer

---

## 🔧 SOLUCIONES REQUERIDAS

### Solución 1: Deploy Manual de Cloud Function (URGENTE)

**Problema:** La Cloud Function en producción NO tiene el fix de CORS.

**Acción requerida:**
```bash
cd /Users/mauriciosobarzo/Projects/AIDUXCARE-V.2-clean
firebase deploy --only functions:getConsentStatus
```

**Verificación:**
Después del deploy, prueba desde `localhost:5002`:
```bash
curl -X POST https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/getConsentStatus \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5002" \
  -d '{"patientId":"test"}' \
  -v
```

Deberías ver `Access-Control-Allow-Origin: http://localhost:5002` en los headers.

---

### Solución 2: Mejorar el Guard del Modal (CRÍTICO)

**Problema:** El modal puede reaparecer si el componente se re-monta.

**Solución:** Usar `sessionStorage` para persistir el estado de consentimiento otorgado:

```typescript
// En handleVerbalConsentComplete
const handleVerbalConsentComplete = async () => {
  console.log('[ConsentGate] Verbal consent completed (OPTIMISTIC)');

  // ✅ Persistir en sessionStorage para sobrevivir re-mounts
  sessionStorage.setItem(`consent_granted_${patientId}`, 'true');
  sessionStorage.setItem(`consent_granted_timestamp_${patientId}`, Date.now().toString());

  // ... resto del código ...
};

// Al inicio del componente, verificar sessionStorage
useEffect(() => {
  const consentKey = `consent_granted_${patientId}`;
  const wasGranted = sessionStorage.getItem(consentKey);
  if (wasGranted === 'true') {
    console.log('[ConsentGate] Consent was granted in this session, skipping gate');
    consentGrantedRef.current = true;
    setHasConsent(true);
    if (onConsentVerified) {
      onConsentVerified();
    }
  }
}, [patientId]);
```

---

### Solución 3: Mejorar el Manejo de Errores de CORS

**Problema:** Si CORS falla, el sistema sigue intentando verificar consentimiento.

**Solución:** En desarrollo local, si CORS falla, asumir que el consentimiento es válido si fue registrado localmente:

```typescript
// En checkConsentViaServer, si hay error de CORS en localhost
catch (error: any) {
  const isCorsError = error?.message?.includes('CORS') || error?.message?.includes('Failed to fetch');
  const isLocalhost = window.location.origin.includes('localhost');
  
  if (isCorsError && isLocalhost) {
    console.warn('[ConsentServer] CORS error in localhost - this is expected if Cloud Function is not deployed with localhost support');
    // En desarrollo, no bloquear si hay error de CORS
    // El Optimistic UI Update ya manejó el consentimiento
    return {
      success: false,
      hasValidConsent: false, // Mantener false para que el polling continúe
      status: null,
      consentMethod: null,
      error: 'CORS_ERROR_LOCALHOST',
      message: 'CORS error in localhost (expected in development)'
    };
  }
  // ... resto del manejo de errores ...
}
```

---

## 📊 IMPACTO DE LOS ERRORES

### Error de CORS
- **Impacto:** ALTO
- **Afecta:** Desarrollo local, testing, debugging
- **Bloquea:** Verificación de consentimiento desde localhost
- **Workaround:** Optimistic UI Update permite continuar, pero sin verificación

### Modal Reaparece
- **Impacto:** CRÍTICO
- **Afecta:** UX del fisioterapeuta, flujo clínico
- **Bloquea:** Continuar con el workflow después de registrar consentimiento
- **Workaround:** Ninguno efectivo actualmente

---

## 🎯 PLAN DE ACCIÓN INMEDIATO

### Paso 1: Deploy Cloud Function (5 minutos)
```bash
firebase deploy --only functions:getConsentStatus
```

### Paso 2: Implementar sessionStorage Guard (10 minutos)
Agregar persistencia en `sessionStorage` para prevenir re-mounts.

### Paso 3: Mejorar Manejo de Errores CORS (5 minutos)
Hacer que los errores de CORS en localhost no bloqueen el flujo.

### Paso 4: Testing (5 minutos)
1. Limpiar cache del navegador
2. Probar flujo completo de consentimiento verbal
3. Verificar que el modal NO reaparezca
4. Verificar que no haya errores de CORS

---

## 🧪 CRITERIOS DE ÉXITO

✅ **CORS:**
- Requests desde `localhost:5002` son aceptados
- No hay errores de CORS en la consola
- La Cloud Function responde correctamente

✅ **Modal:**
- Modal NO reaparece después de registrar consentimiento
- Gate se cierra inmediatamente
- Navegación a command-center funciona
- No hay loops de re-render

---

## 📝 NOTAS TÉCNICAS

### Por qué el Deploy Puede Haber Fallado

1. **Timeout:** El deploy puede haber tardado demasiado
2. **Permisos:** Puede faltar permisos de IAM
3. **Cache:** Firebase CLI puede estar usando una versión cacheada
4. **Región:** La función está en `northamerica-northeast1`, puede haber problemas de latencia

### Verificación del Deploy

Para verificar si el deploy fue exitoso:
```bash
# Ver logs de la función
firebase functions:log --only getConsentStatus

# O verificar en la consola de Firebase
# https://console.firebase.google.com/project/aiduxcare-v2-uat-dev/functions
```

---

**Preparado por:** AI Assistant (Cursor)  
**Revisión requerida por:** CTO  
**Fecha:** 2026-01-25
