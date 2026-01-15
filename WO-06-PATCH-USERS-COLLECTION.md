# ✅ WO-06 PATCH #2: Users Collection Rules

**Fecha**: 2026-01-14  
**Estado**: ✅ COMPLETADO Y DESPLEGADO

---

## 🔴 PROBLEMA REAL IDENTIFICADO

El código usa la colección **`users`**, no `professional_profiles`.

**Evidencia del código:**
```typescript
// ProfessionalProfileContext.tsx línea 154
const userDoc = await getDoc(doc(db, 'users', uid));
```

**Error en consola:**
```
[WARN] [PROFILE] getDoc failed after 3 retries
FirebaseError: Missing or insufficient permissions
```

---

## ✅ FIX APLICADO

### Reglas Agregadas para `users/{userId}`

```javascript
// ----------------------------
// Users / Professional Profiles
// ----------------------------
match /users/{userId} {
  // The owner can read their own profile
  allow read: if request.auth != null
              && request.auth.uid == userId;

  // Profile creation / updates (onboarding)
  allow create, update: if request.auth != null
                         && request.auth.uid == userId;

  // No deletes from client
  allow delete: if false;
}
```

### También se mantiene `professional_profiles` (por si acaso)

```javascript
match /professional_profiles/{userId} {
  // Same rules as users
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create, update: if request.auth != null && request.auth.uid == userId;
  allow delete: if false;
}
```

---

## 📊 DEPLOY RESULTADO

```
✔ cloud.firestore: rules file firestore.rules compiled successfully
✔ firestore: released rules firestore.rules to cloud.firestore
✔ Deploy complete!
```

---

## ✅ RESULTADO ESPERADO

Después de **hard refresh** (Cmd+Shift+R):

- ✅ Perfil carga correctamente desde `users/{uid}`
- ✅ "Unable to Load Profile" desaparece
- ✅ Onboarding / workflow continúa
- ✅ Analytics sigue funcionando
- ✅ Seguridad intacta (owner-only)

---

## 🔍 VERIFICACIÓN

**Hard refresh en navegador:**
- Mac: `Cmd + Shift + R`
- O abrir nueva pestaña incógnito

**Verificar en consola:**
- ✅ No más errores de "permission-denied" para `users`
- ✅ Perfil carga sin errores
- ✅ App funciona normalmente

---

## 📝 NOTAS

- El código usa `users/{uid}` como colección principal
- Se agregaron reglas para ambas colecciones (`users` y `professional_profiles`) por seguridad
- Owner-only access mantenido
- Compatible con onboarding y actualizaciones

---

**WO-06 PATCH #2: COMPLETADO** ✅

