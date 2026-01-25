# 🔴 INFORME TÉCNICO: Modal de Consentimiento Verbal Reaparece Después de Registro

**Fecha:** 2026-01-25  
**Prioridad:** ALTA  
**Estado:** PENDIENTE ANÁLISIS CTO  
**WO Relacionado:** WO-CONSENT-VERBAL-MODAL-REAPARECE-01

---

## 📋 RESUMEN EJECUTIVO

El modal de consentimiento verbal (`VerbalConsentModal`) **reaparece después de que el usuario registra exitosamente el consentimiento**, creando un loop de UX que impide al fisioterapeuta continuar con el workflow clínico.

### Síntoma Principal
- Usuario presiona "Read & Record Verbal Consent"
- Usuario marca casilla "I confirm that I have read..."
- Usuario presiona "Record Patient's Response"
- Usuario presiona "Patient GRANTS Consent"
- ✅ Consentimiento se registra exitosamente en Firestore
- ❌ **El modal vuelve a aparecer** mostrando la misma pantalla

---

## 🔍 ANÁLISIS TÉCNICO

### Flujo Actual del Código

#### 1. Registro de Consentimiento Verbal
**Archivo:** `src/components/consent/VerbalConsentModal.tsx` (líneas 61-99)

```typescript
const handleGrantConsent = async () => {
  // ... validaciones ...
  
  // ✅ Escribe en Firestore
  await PatientConsentService.recordVerbalConsent({
    patientId,
    professionalId: user?.uid || '',
    patientName,
    consentStatus: 'granted',
    // ...
  });

  console.log('[VerbalConsent] ✅ Consent granted and recorded:', patientId);
  
  // ✅ Llama callback
  onConsentGranted();
  
  // ✅ Cierra modal después de 500ms
  setTimeout(() => {
    onClose();
  }, 500);
};
```

**Observación:** El código registra el consentimiento y cierra el modal correctamente.

---

#### 2. Verificación Inmediata Post-Registro
**Archivo:** `src/components/consent/ConsentGateScreen.tsx` (líneas 242-275)

```typescript
const handleVerbalConsentComplete = async () => {
  console.log('[ConsentGate] Verbal consent completed');
  setProcessingVerbalConsent(true);
  setShowVerbalModal(false);
  
  // ✅ Retry con delay creciente (1s, 2s, 3s)
  const checkWithRetry = async (attempts = 3, delay = 1000) => {
    for (let i = 0; i < attempts; i++) {
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      const consentResult = await checkConsentViaServer(patientId);
      if (consentResult.hasValidConsent) {
        // ✅ Cierra gate
        consentGrantedRef.current = true;
        setHasConsent(true);
        if (onConsentVerified) {
          onConsentVerified();
        }
        return true;
      }
    }
    return false;
  };
  
  const found = await checkWithRetry();
  if (!found) {
    console.log('[ConsentGate] Consent not found immediately, polling will detect it');
  }
  setProcessingVerbalConsent(false);
};
```

**Observación:** El código intenta verificar el consentimiento inmediatamente con retry, pero si no lo encuentra, depende del polling.

---

#### 3. Polling de Consentimiento
**Archivo:** `src/components/consent/ConsentGateScreen.tsx` (líneas 81-160)

```typescript
useEffect(() => {
  // ... setup polling ...
  
  consentPollingRef.current = setInterval(async () => {
    // ✅ Regla: Never re-check if consent already granted
    if (consentGrantedRef.current === true) {
      console.log('[ConsentGate] Consent already granted, skipping poll check');
      return;
    }

    const consentResult = await checkConsentViaServer(patientId);

    if (consentResult.hasValidConsent) {
      consentGrantedRef.current = true;
      console.log('[ConsentGate] ✅ Consent detected! Closing modal permanently...');
      setHasConsent(true);
      // ... cierra polling y gate ...
    }
  }, 3000); // Poll every 3 seconds
}, [patientId, user?.uid]);
```

**Observación:** El polling tiene un guard (`consentGrantedRef.current`) pero puede haber race conditions.

---

#### 4. Guard del Modal Verbal
**Archivo:** `src/components/consent/ConsentGateScreen.tsx` (líneas 500-510)

```typescript
{/* Verbal Consent Modal */}
{showVerbalModal && !hasConsent && !consentGrantedRef.current && !processingVerbalConsent && (
  <VerbalConsentModal
    patientId={patientId}
    patientName={patientName || 'Patient'}
    onClose={() => {
      console.log('[ConsentGate] Verbal modal closed');
      setShowVerbalModal(false);
    }}
    onConsentGranted={handleVerbalConsentComplete}
  />
)}
```

**Observación:** El guard debería prevenir que el modal se muestre, pero hay múltiples condiciones que pueden fallar.

---

### 🔴 POSIBLES CAUSAS RAÍZ

#### Causa 1: Delay de Firestore + Cloud Function
**Hipótesis:** El consentimiento se escribe en Firestore, pero la Cloud Function `getConsentStatus` no lo lee inmediatamente debido a:
- **Eventual consistency** de Firestore (puede tomar 1-3 segundos)
- **Cold start** de la Cloud Function (puede tomar 2-5 segundos)
- **Cache** de la Cloud Function

**Evidencia:**
- Los logs muestran `hasValidConsent: false` repetidamente después de registrar
- El retry (1s, 2s, 3s) puede no ser suficiente si hay cold start

**Impacto:** ALTO - El modal se cierra pero el gate no detecta el consentimiento, y el polling puede no detectarlo a tiempo.

---

#### Causa 2: Race Condition en Estado React
**Hipótesis:** Múltiples actualizaciones de estado pueden causar que:
- `setShowVerbalModal(false)` se ejecuta
- Pero `setProcessingVerbalConsent(false)` se ejecuta antes de que el consentimiento se detecte
- El modal se vuelve a mostrar porque `processingVerbalConsent` vuelve a `false`

**Evidencia:**
- El código tiene `setProcessingVerbalConsent(false)` al final de `handleVerbalConsentComplete`
- Si el retry falla, `processingVerbalConsent` vuelve a `false` inmediatamente
- El modal puede volver a mostrarse si `showVerbalModal` se vuelve a `true` por alguna razón

**Impacto:** MEDIO - Puede causar que el modal reaparezca si hay un re-render.

---

#### Causa 3: El Modal se Cierra pero el Estado se Resetea
**Hipótesis:** El `setTimeout(() => { onClose(); }, 500)` en `VerbalConsentModal` puede ejecutarse después de que el componente se desmonte, o puede haber un re-render que resetea el estado.

**Evidencia:**
- El modal tiene dos formas de cerrarse: `onConsentGranted()` y `setTimeout(() => onClose(), 500)`
- Si hay un re-render del componente padre, el estado puede resetearse

**Impacto:** MEDIO - Puede causar comportamiento inconsistente.

---

#### Causa 4: El Polling No Detecta el Consentimiento
**Hipótesis:** La Cloud Function `getConsentStatus` puede no estar encontrando el consentimiento verbal porque:
- El consentimiento se guarda con `consentMethod: 'verbal'`
- Pero la Cloud Function puede estar filtrando incorrectamente
- O hay un problema con los campos `consentStatus` vs `status`

**Evidencia:**
- Los logs muestran `hasValidConsent: false` continuamente
- El consentimiento se registra con `consentStatus: 'granted'` y `status: 'granted'`
- La Cloud Function filtra por `status === 'granted'` o `consentStatus === 'granted'`

**Impacto:** ALTO - Si el polling no detecta el consentimiento, el gate nunca se cierra.

---

### 📊 LOGS OBSERVADOS

```
[VerbalConsent] ✅ Consent granted and recorded: lxljTKdL29epqm470PWc
[ConsentGate] Verbal consent completed
[ConsentGate] Consent not found immediately, polling will detect it
[ConsentServer] Consent status retrieved: {patientId: 'lxljTKdL29epqm470PWc', hasValidConsent: false, status: null, consentMethod: null}
[ConsentServer] Consent status retrieved: {patientId: 'lxljTKdL29epqm470PWc', hasValidConsent: false, status: null, consentMethod: null}
... (repetido múltiples veces)
```

**Análisis:**
- ✅ El consentimiento se registra exitosamente
- ❌ La verificación inmediata no encuentra el consentimiento (3 intentos fallan)
- ❌ El polling continúa mostrando `hasValidConsent: false`
- ❌ El modal vuelve a aparecer

---

## 🎯 RECOMENDACIONES TÉCNICAS

### Opción 1: Optimistic UI Update (RECOMENDADO)
**Descripción:** Asumir que el consentimiento se registró exitosamente y cerrar el gate inmediatamente, sin esperar verificación.

**Implementación:**
```typescript
const handleVerbalConsentComplete = async () => {
  console.log('[ConsentGate] Verbal consent completed');
  setProcessingVerbalConsent(true);
  setShowVerbalModal(false);
  
  // ✅ OPTIMISTIC: Cerrar gate inmediatamente
  consentGrantedRef.current = true;
  setHasConsent(true);
  if (onConsentVerified) {
    onConsentVerified();
  }
  
  // ✅ Verificar en background (solo para logging/audit)
  // Si falla, el polling lo detectará, pero el gate ya está cerrado
  checkWithRetry().catch(err => {
    console.warn('[ConsentGate] Background verification failed, but gate is closed:', err);
  });
};
```

**Pros:**
- UX inmediata - no hay delay
- El usuario puede continuar trabajando
- El polling verifica en background

**Contras:**
- Si el registro falla silenciosamente, el gate se cierra incorrectamente
- Requiere manejo de errores robusto

---

### Opción 2: Aumentar Retry y Delay
**Descripción:** Aumentar el número de intentos y el delay para dar más tiempo a Firestore/Cloud Function.

**Implementación:**
```typescript
const checkWithRetry = async (attempts = 5, delay = 2000) => {
  // 5 intentos con delay de 2s, 4s, 6s, 8s, 10s = máximo 30 segundos
  for (let i = 0; i < attempts; i++) {
    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    // ... verificación ...
  }
};
```

**Pros:**
- Más tiempo para que Firestore/Cloud Function procese
- Menos cambios al código existente

**Contras:**
- UX más lenta (hasta 30 segundos de espera)
- No resuelve el problema si hay un error real

---

### Opción 3: Usar Firestore Listener (NO RECOMENDADO)
**Descripción:** Usar un listener de Firestore en lugar de polling para detectar cambios inmediatamente.

**Pros:**
- Detección inmediata de cambios
- No requiere polling

**Contras:**
- ❌ Viola WO-CONSENT-CLEANUP-03 (no usar listeners de Firestore)
- ❌ Requiere cambios en las reglas de seguridad
- ❌ Más complejo de implementar

---

### Opción 4: Verificar Directamente en Firestore (TEMPORAL)
**Descripción:** Como fallback, verificar directamente en Firestore si la Cloud Function no responde.

**Implementación:**
```typescript
// Fallback: verificar directamente en Firestore si Cloud Function falla
const checkDirectly = async () => {
  const consentRef = collection(db, 'patient_consent');
  const q = query(
    consentRef,
    where('patientId', '==', patientId),
    where('professionalId', '==', user?.uid),
    where('consentStatus', '==', 'granted'),
    orderBy('consentDate', 'desc'),
    limit(1)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};
```

**Pros:**
- Verificación más rápida que Cloud Function
- No depende de cold start

**Contras:**
- ❌ Viola WO-CONSENT-CLEANUP-03 (no leer Firestore directamente)
- ❌ Puede fallar por reglas de seguridad
- ❌ Solo como último recurso

---

## 🔧 ACCIONES INMEDIATAS SUGERIDAS

### 1. Agregar Logging Detallado
Agregar logs en cada paso del flujo para identificar exactamente dónde falla:

```typescript
console.log('[ConsentGate] Step 1: Modal closed, processingVerbalConsent:', processingVerbalConsent);
console.log('[ConsentGate] Step 2: Checking consent, attempt:', i);
console.log('[ConsentGate] Step 3: Consent result:', consentResult);
console.log('[ConsentGate] Step 4: Setting hasConsent:', consentResult.hasValidConsent);
```

### 2. Verificar Cloud Function
Revisar los logs de la Cloud Function `getConsentStatus` para ver si:
- Está recibiendo las requests
- Está encontrando el consentimiento en Firestore
- Hay errores en la función

### 3. Verificar Firestore
Revisar directamente en Firestore si el consentimiento se está guardando correctamente:
- Colección: `patient_consent`
- Campos: `patientId`, `professionalId`, `consentStatus: 'granted'`
- Timestamp: `consentDate`

### 4. Implementar Opción 1 (Optimistic UI)
Implementar la Opción 1 como solución inmediata, ya que:
- Mejora la UX significativamente
- El polling verifica en background
- Si hay un error real, el polling lo detectará

---

## 📝 PREGUNTAS PARA EL CTO

1. **¿Es aceptable usar Optimistic UI Update?** (Asumir éxito y verificar en background)
2. **¿Cuál es el SLA esperado para la detección de consentimiento?** (¿Cuántos segundos es aceptable esperar?)
3. **¿Hay algún problema conocido con la Cloud Function `getConsentStatus`?** (Cold start, timeouts, etc.)
4. **¿Debemos verificar directamente en Firestore como fallback?** (Viola WO-CONSENT-CLEANUP-03 pero puede ser necesario)
5. **¿Hay algún problema con las reglas de Firestore que impida leer el consentimiento?** (Aunque la Cloud Function debería tener permisos)

---

## 📎 ARCHIVOS RELACIONADOS

- `src/components/consent/ConsentGateScreen.tsx` (líneas 242-275, 500-510)
- `src/components/consent/VerbalConsentModal.tsx` (líneas 61-99)
- `src/services/patientConsentService.ts` (líneas 611-665)
- `functions/src/consent/getConsentStatus.js` (líneas 110-135)
- `src/services/consentServerService.ts` (líneas 40-121)

---

## 🏷️ TAGS

`consent` `verbal-consent` `modal` `ux-bug` `firestore` `cloud-function` `polling` `race-condition`

---

**Preparado por:** AI Assistant (Cursor)  
**Revisión requerida por:** CTO  
**Fecha de creación:** 2026-01-25
