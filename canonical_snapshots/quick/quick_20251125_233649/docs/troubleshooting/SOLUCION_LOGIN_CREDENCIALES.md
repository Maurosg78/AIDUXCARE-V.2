# 🔐 SOLUCIÓN - ERROR DE CREDENCIALES

**Fecha:** Noviembre 16, 2025  
**Problema:** `auth/invalid-credential` con credenciales que existen en Firestore

---

## 🔍 DIAGNÓSTICO

### **El Error:**
```
FirebaseError: Firebase: Error (auth/invalid-credential)
```

### **Causa:**
Firebase Authentication y Firestore son **dos servicios diferentes**:

- **Firebase Authentication** → Guarda credenciales (email/password) para login
- **Firestore** → Guarda datos del profesional (perfil, configuración, etc.)

**El usuario puede existir en Firestore pero NO en Firebase Authentication.**

---

## ✅ SOLUCIÓN

### **Opción 1: Crear Usuario en Firebase Console (RECOMENDADO)**

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar proyecto: `aiduxcare-v2-uat-dev`
3. Ir a **Authentication** → **Users**
4. Click **"Add user"** o **"Agregar usuario"**
5. Ingresar:
   - **Email:** `mauricio@aiduxcare.com`
   - **Password:** `Mauro7812#`
   - **Email verified:** ✅ Marcar (si el email ya está verificado)
6. Click **"Add user"**
7. Intentar login nuevamente

### **Opción 2: Usar Script de Diagnóstico**

```bash
# Verificar si el usuario existe en Authentication
node scripts/verificar-usuario-auth.js mauricio@aiduxcare.com
```

Este script mostrará:
- ✅ Si el usuario existe en Firebase Authentication
- ✅ Si el usuario existe en Firestore
- ⚠️ Qué falta para que el login funcione

### **Opción 3: Crear Usuario Programáticamente (Desarrollo)**

Si estás en desarrollo y necesitas crear el usuario automáticamente:

```typescript
// En Firebase Console → Authentication → Users → Add user
// O usar Firebase Admin SDK (solo backend)
```

---

## 🔍 VERIFICACIÓN

### **Después de crear el usuario en Authentication:**

1. **Verificar en Firebase Console:**
   - Authentication → Users
   - Debe aparecer `mauricio@aiduxcare.com`
   - Email debe estar verificado (si aplica)

2. **Intentar login nuevamente:**
   - Email: `mauricio@aiduxcare.com`
   - Password: `Mauro7812#`
   - Debe funcionar sin errores

3. **Verificar logs en Console:**
   - Debe mostrar: `[LOGIN] Attempting sign-in`
   - Debe mostrar: `Login exitoso: mauricio@aiduxcare.com`
   - NO debe mostrar: `auth/invalid-credential`

---

## 📋 CHECKLIST

- [ ] Usuario creado en Firebase Authentication
- [ ] Email verificado (si aplica)
- [ ] Password correcto
- [ ] Intentar login nuevamente
- [ ] Verificar que no hay error `auth/invalid-credential`
- [ ] Verificar que navega a `/workflow` después del login

---

## ⚠️ NOTAS IMPORTANTES

### **Diferencia entre Firestore y Authentication:**

**Firestore (`professionals` collection):**
- Guarda datos del profesional (nombre, especialidad, etc.)
- Se crea durante el onboarding
- NO se usa para autenticación

**Firebase Authentication:**
- Guarda credenciales (email/password)
- Se usa para login
- DEBE existir para que `signInWithEmailAndPassword` funcione

### **Flujo Correcto:**

1. **Onboarding** → Crea usuario en Firestore
2. **Crear usuario en Authentication** → Manualmente o durante onboarding
3. **Login** → Usa Authentication para verificar credenciales
4. **Obtener datos** → Usa Firestore para obtener perfil del profesional

---

## 🚀 PRÓXIMOS PASOS

1. **Crear usuario en Firebase Authentication** (Opción 1 arriba)
2. **Verificar con script** (Opción 2 arriba)
3. **Intentar login nuevamente**
4. **Si funciona** → El problema está resuelto
5. **Si no funciona** → Verificar:
   - Password correcto (sin espacios extra)
   - Email correcto (case-sensitive en algunos casos)
   - Usuario no está deshabilitado en Authentication

---

**Última actualización:** Noviembre 16, 2025  
**Mantenedor:** CTO Assistant

