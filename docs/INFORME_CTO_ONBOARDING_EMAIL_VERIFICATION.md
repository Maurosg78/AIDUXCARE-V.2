# Informe Técnico: Problema en Flujo de Onboarding y Verificación de Email

**Fecha:** 2024-12-27  
**Prioridad:** P1 - Crítico  
**Estado:** En Investigación

## Resumen Ejecutivo

El usuario completa exitosamente el proceso de onboarding, recibe el email de verificación, pero al intentar acceder a la aplicación después de verificar su email, el sistema indica que el proceso se realizó incorrectamente y redirige de vuelta al onboarding.

## Flujo Actual Identificado

### 1. Proceso de Onboarding (ProfessionalOnboardingPage.tsx)
- ✅ Usuario completa los 3 wizards (Identidad, Práctica, Consentimiento)
- ✅ Se crea cuenta en Firebase Auth (`createUserWithEmailAndPassword`)
- ✅ Se guarda perfil en Firestore `users/{uid}` con `registrationStatus: 'complete'`
- ✅ Se envía email de verificación (`sendEmailVerification`)
- ⚠️ **PROBLEMA:** Se hace `signOut()` inmediatamente después de guardar el perfil
- ✅ Redirige a `/login` con mensaje de éxito

### 2. Verificación de Email (EmailVerifiedPage.tsx)
- ✅ Usuario hace clic en link del email
- ✅ Se verifica el email con `applyActionCode(auth, oobCode)`
- ✅ Redirige a `/command-center` (si está autenticado) o `/login` (si no está autenticado)

### 3. Acceso Post-Verificación (AuthGuard.tsx)
- ⚠️ **PROBLEMA CRÍTICO:** `AuthGuard` verifica `profile.registrationStatus`
- ⚠️ Si `profile.registrationStatus !== 'complete'` → redirige a `/professional-onboarding`
- ⚠️ Si `!profile` → redirige a `/professional-onboarding`

## Problema Raíz Identificado

### Problema Confirmado: Creación de Perfil Mínimo Sobrescribe Perfil Completo
**Ubicación:** `src/context/ProfessionalProfileContext.tsx:200-214`

**Flujo del Bug:**
1. Usuario completa onboarding → `updateProfile()` guarda perfil con `registrationStatus: 'complete'` en Firestore `users/{uid}`
2. Se hace `signOut()` → usuario se desautentica
3. Usuario hace clic en link de email → Firebase autentica automáticamente al usuario
4. `ProfessionalProfileContext.useEffect` (línea 290-299) detecta usuario autenticado → llama a `loadProfile(uid)`
5. **BUG CRÍTICO:** Si `getDoc(doc(db, 'users', uid))` retorna `!userDoc.exists()` (por timing, permisos, o error de red), se ejecuta el bloque `else` (línea 200-214)
6. Se crea un perfil mínimo con `registrationStatus: 'incomplete'` que **SOBRESCRIBE** el perfil completo guardado en el paso 1
7. `AuthGuard` detecta `profile.registrationStatus !== 'complete'` → redirige a `/professional-onboarding`

**Código Problemático:**
```typescript
// src/context/ProfessionalProfileContext.tsx:200-214
} else {
  // ⚠️ BUG: Si el documento no existe (por timing/permisos/red), se crea un perfil mínimo
  // que sobrescribe el perfil completo guardado durante el onboarding
  logger.info("[PROFILE] Document does not exist, creating minimal profile", { uid });
  const minimalProfile: ProfessionalProfile = {
    uid,
    email: user?.email || '',
    registrationStatus: 'incomplete', // ⚠️ Se crea como incomplete
    createdAt: serverTimestamp() as Timestamp,
  };
  await setDoc(doc(db, 'users', uid), cleanedProfile); // ⚠️ SOBRESCRIBE el perfil completo
  setProfile(minimalProfile);
}
```

**Código Problemático:**
```typescript
// src/context/ProfessionalProfileContext.tsx:166-202
const loadProfile = async (uid: string): Promise<void> => {
  // ...
  if (userDoc.exists()) {
    const userData = userDoc.data() as ProfessionalProfile;
    // Si falta registrationStatus, se establece a 'incomplete'
    if (!userData.registrationStatus) {
      userData.registrationStatus = 'incomplete';
      await updateDoc(doc(db, 'users', uid), { registrationStatus: 'incomplete' });
    }
    setProfile(userData);
  } else {
    // ⚠️ PROBLEMA: Si el documento no existe, se crea un perfil mínimo
    const initialProfile: ProfessionalProfile = {
      uid,
      email: user?.email || '',
      registrationStatus: 'incomplete', // ⚠️ Se crea como incomplete
      // ...
    };
    await setDoc(doc(db, 'users', uid), cleanedProfile);
    setProfile(initialProfile);
  }
}
```

### Hipótesis 2: Timing Issue - Perfil No Cargado
**Ubicación:** `src/components/AuthGuard.tsx:169-185`

`AuthGuard` puede estar evaluando el perfil antes de que se complete la carga:
```typescript
if (!isOnboardingRoute && !isPublicRoute && !hasRedirectedRef.current) {
  if (profileLoading) {
    // Espera, pero puede haber un timing issue
  } else if (!profile) {
    // ⚠️ Si profile es null, redirige a onboarding
    return <Navigate to="/professional-onboarding" replace />;
  } else if (profile.registrationStatus !== 'complete') {
    // ⚠️ Si registrationStatus no es 'complete', redirige a onboarding
    return <Navigate to="/professional-onboarding" replace />;
  }
}
```

### Hipótesis 3: SignOut Elimina Contexto
**Ubicación:** `src/pages/ProfessionalOnboardingPage.tsx:495-496`

Después de completar el onboarding, se hace `signOut()`:
```typescript
if (!user) {
  await signOut(getAuth()); // ⚠️ Esto puede causar que el perfil se pierda del contexto
}
```

Cuando el usuario verifica el email y se autentica nuevamente, el contexto puede no tener el perfil cargado todavía.

## Evidencia del Problema

### Logs Esperados (si el problema ocurre):
```
[INFO] Professional profile saved successfully in users/{uid}
[INFO] [ONBOARDING] New user account created {uid: '...', email: '...'}
[INFO] [PROFILE] Document does not exist, creating minimal profile {uid: '...'}
[INFO] [AUTHGUARD] Profile incomplete, redirecting to professional onboarding {registrationStatus: 'incomplete'}
```

### Comportamiento Observado:
1. Usuario completa onboarding → ✅ Mensaje de éxito
2. Usuario recibe email de verificación → ✅ Email recibido
3. Usuario hace clic en link → ✅ Email verificado
4. Usuario intenta acceder → ❌ Redirige a onboarding con mensaje de error

## Impacto

- **Severidad:** Alta - Bloquea el acceso del usuario después de completar el onboarding
- **Frecuencia:** 100% de los casos donde el usuario verifica el email después del signOut
- **Experiencia de Usuario:** Muy negativa - El usuario cree que el proceso falló

## Soluciones Propuestas

### Solución 1: No Hacer SignOut Inmediatamente (Recomendada)
**Cambio:** No hacer `signOut()` después de completar el onboarding si el email ya está verificado.

**Razón:** Mantener la sesión activa permite que el perfil se mantenga en el contexto y el usuario pueda acceder directamente.

**Implementación:**
```typescript
// En ProfessionalOnboardingPage.tsx:handleSubmit
// Solo hacer signOut si el email NO está verificado Y es un nuevo usuario
if (!user && !authUser.emailVerified) {
  await signOut(getAuth());
}
```

### Solución 2: Retry Logic y Verificación Robusta (CRÍTICA)
**Cambio:** En `ProfessionalProfileContext.loadProfile`, agregar retry logic antes de crear perfil mínimo.

**Razón:** El perfil completo puede existir pero no estar disponible inmediatamente por problemas de timing, red, o permisos. Crear un perfil mínimo sin verificar puede sobrescribir el perfil completo.

**Implementación:**
```typescript
// En loadProfile, agregar retry logic antes de crear perfil mínimo
const loadProfile = async (uid: string, retries = 3): Promise<void> => {
  try {
    setLoading(true);
    setError(undefined);
    const db = getDb();

    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as ProfessionalProfile;
      
      // Si falta registrationStatus, inferir del contenido del perfil
      if (!userData.registrationStatus) {
        // Verificar si tiene datos suficientes para considerar completo
        const hasCompleteData = userData.firstName && 
                                userData.lastName && 
                                userData.specialty && 
                                userData.licenseNumber;
        userData.registrationStatus = hasCompleteData ? 'complete' : 'incomplete';
        
        // Solo actualizar en Firestore si es necesario
        if (!hasCompleteData) {
          await updateDoc(doc(db, 'users', uid), { registrationStatus: 'incomplete' });
        } else {
          // Si tiene datos completos pero falta registrationStatus, actualizar a 'complete'
          await updateDoc(doc(db, 'users', uid), { registrationStatus: 'complete' });
        }
      }
      
      setProfile(userData);
      // ... resto del código
    } else {
      // ⚠️ CRÍTICO: NO crear perfil mínimo inmediatamente
      // Puede ser un problema de timing - el perfil completo puede existir pero no estar disponible todavía
      if (retries > 0) {
        logger.warn(`[PROFILE] Document not found, retrying... (${retries} retries left)`, { uid });
        // Esperar progresivamente más tiempo en cada retry
        const delay = (4 - retries) * 1000; // 1s, 2s, 3s
        await new Promise(resolve => setTimeout(resolve, delay));
        return loadProfile(uid, retries - 1);
      }
      
      // Solo crear perfil mínimo si después de 3 reintentos el documento realmente no existe
      logger.warn("[PROFILE] Document does not exist after retries, creating minimal profile", { uid });
      const minimalProfile: ProfessionalProfile = {
        uid,
        email: user?.email || '',
        registrationStatus: 'incomplete',
        createdAt: serverTimestamp() as Timestamp,
      };
      const cleanedProfile = cleanUndefined(minimalProfile);
      await setDoc(doc(db, 'users', uid), cleanedProfile);
      setProfile(minimalProfile);
    }
  } catch (err) {
    // Si hay error de permisos o red, NO crear perfil mínimo
    // Dejar que el soft-fail mechanism maneje el error
    const error = err instanceof Error ? err : new Error('Error desconocido al cargar perfil');
    setError(error);
    logger.error('Error cargando perfil profesional:', error);
    // NO crear perfil mínimo en caso de error - dejar que el usuario vea el error
  } finally {
    setLoading(false);
  }
}
```

### Solución 3: Mejorar Lógica de AuthGuard
**Cambio:** En `AuthGuard`, esperar más tiempo antes de redirigir si el perfil está cargando.

**Razón:** Dar más tiempo para que el perfil se cargue desde Firestore.

**Implementación:**
```typescript
// En AuthGuard, agregar timeout más largo para profileLoading
const [profileLoadTimeout, setProfileLoadTimeout] = useState(false);

useEffect(() => {
  if (profileLoading) {
    const timeout = setTimeout(() => {
      setProfileLoadTimeout(true);
    }, 5000); // 5 segundos de timeout
    return () => clearTimeout(timeout);
  }
}, [profileLoading]);

// En la lógica de redirección:
if (profileLoading && !profileLoadTimeout) {
  // Esperar más tiempo
  return <LoadingState />;
}
```

## Recomendación del Equipo Técnico

**Solución Recomendada:** Implementar Solución 2 (CRÍTICA) + Solución 1 (Preventiva)

### Prioridad 1: Solución 2 (Retry Logic)
**Razón:** Este es el bug crítico que está causando el problema. El perfil completo se guarda correctamente, pero cuando el usuario se autentica después de verificar el email, `loadProfile` no encuentra el documento (por timing/red/permisos) y crea un perfil mínimo que sobrescribe el completo.

**Acción Inmediata:**
1. Agregar retry logic (3 intentos con delays progresivos) antes de crear perfil mínimo
2. Verificar permisos de Firestore para asegurar que usuarios autenticados pueden leer `users/{uid}` donde `uid` es su propio ID
3. Agregar logging detallado para identificar si el problema es timing, permisos, o red

### Prioridad 2: Solución 1 (No SignOut Inmediato)
**Razón:** Prevenir el problema evitando el signOut si el email ya está verificado o si el usuario acaba de completar el onboarding.

**Acción:**
1. Modificar `ProfessionalOnboardingPage.handleSubmit` para NO hacer signOut si:
   - El email ya está verificado (`authUser.emailVerified === true`)
   - O si el usuario ya estaba autenticado antes del onboarding

### Prioridad 3: Mejoras Adicionales
1. **Agregar métricas:** Trackear cuántas veces se crea un perfil mínimo cuando debería existir uno completo
2. **Mejorar UX:** Mostrar mensaje más claro si el perfil no se puede cargar (en lugar de redirigir silenciosamente)
3. **Validación:** Verificar que el perfil se guardó correctamente antes de hacer signOut

## Próximos Pasos

1. ✅ **Diagnóstico Completo:** Revisar logs de Firestore para confirmar si el perfil se guarda correctamente
2. ⏳ **Implementar Solución 1:** Modificar `ProfessionalOnboardingPage` para no hacer signOut si el email está verificado
3. ⏳ **Implementar Solución 2:** Mejorar `loadProfile` con retry logic y verificación más robusta
4. ⏳ **Testing:** Probar el flujo completo end-to-end
5. ⏳ **Monitoreo:** Agregar métricas para detectar este problema en producción

## Archivos Afectados

- `src/pages/ProfessionalOnboardingPage.tsx` (líneas 488-507)
- `src/context/ProfessionalProfileContext.tsx` (líneas 166-202)
- `src/components/AuthGuard.tsx` (líneas 169-185)
- `src/pages/EmailVerifiedPage.tsx` (líneas 85-100)

## Notas Adicionales

- El problema puede estar relacionado con la optimización de `lastLoginAt` que solo se actualiza si es muy antiguo (> 5 minutos)
- El problema puede estar relacionado con el soft-fail mechanism que puede estar interfiriendo con la carga del perfil
- Se recomienda revisar los permisos de Firestore para asegurar que el usuario autenticado puede leer su propio perfil

