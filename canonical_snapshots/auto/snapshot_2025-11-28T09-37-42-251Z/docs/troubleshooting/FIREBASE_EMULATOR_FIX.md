# 🔧 SOLUCIÓN: Firebase Emulator Connection Refused

**Error**: `ERR_CONNECTION_REFUSED` al intentar autenticarse  
**Causa**: Auth Emulator no está corriendo (puerto 9099)  
**Fecha**: 28 Nov 2025

---

## 🎯 PROBLEMA IDENTIFICADO

El código está configurado para usar emuladores (`VITE_FIREBASE_USE_EMULATOR === 'true'`), pero:
- ✅ Firestore Emulator está corriendo (puerto 8080)
- ❌ Auth Emulator NO está corriendo (puerto 9099)

**Error en consola**:
```
POST http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key 
net::ERR_CONNECTION_REFUSED
```

---

## ✅ SOLUCIÓN 1: Iniciar Auth Emulator (Recomendado para desarrollo)

### **Opción A: Iniciar todos los emuladores**
```bash
npm run emulators:start
```

Esto iniciará:
- Auth Emulator en puerto 9099
- Firestore Emulator en puerto 8080
- Functions Emulator en puerto 5001
- Emulator UI en puerto 4000

### **Opción B: Solo Auth Emulator**
```bash
firebase emulators:start --only auth --project aiduxcare-v2-uat-dev
```

### **Verificar que está corriendo**
```bash
# Verificar puerto 9099
lsof -ti:9099 && echo "✅ Auth emulator corriendo" || echo "❌ Auth emulator NO corriendo"

# Verificar puerto 8080
lsof -ti:8080 && echo "✅ Firestore emulator corriendo" || echo "❌ Firestore emulator NO corriendo"
```

---

## ✅ SOLUCIÓN 2: Desactivar Modo Emulador (Usar Cloud)

Si prefieres usar Firebase Cloud en lugar de emuladores:

### **Paso 1: Verificar archivo .env.local**
```bash
cat .env.local | grep VITE_FIREBASE_USE_EMULATOR
```

### **Paso 2: Desactivar modo emulador**
```bash
# Editar .env.local y cambiar:
VITE_FIREBASE_USE_EMULATOR=false

# O eliminar la línea completamente
```

### **Paso 3: Reiniciar dev server**
```bash
# Detener el servidor actual (Ctrl+C)
# Reiniciar
npm run dev
```

### **Paso 4: Verificar en consola**
Deberías ver:
```
✅ Firebase inicializado en modo CLOUD (sin emuladores). Proyecto: aiduxcare-v2-uat-dev
```

**NO deberías ver**:
```
✅ Firebase inicializado en modo EMULATOR. Auth: ...
```

---

## 🔍 DIAGNÓSTICO

### **Verificar estado actual**
```bash
# Verificar procesos de emuladores
ps aux | grep -E "firebase|emulator" | grep -v grep

# Verificar puertos
lsof -ti:9099,8080,5001,4000

# Verificar variables de entorno
env | grep VITE_FIREBASE
```

### **Verificar configuración Firebase**
```bash
# Ver firebase.json
cat firebase.json | grep -A 10 "emulators"

# Ver código de inicialización
cat src/lib/firebase.ts | grep -A 15 "VITE_FIREBASE_USE_EMULATOR"
```

---

## 📋 CHECKLIST DE VERIFICACIÓN

- [ ] Auth Emulator corriendo en puerto 9099
- [ ] Firestore Emulator corriendo en puerto 8080 (opcional si usas Cloud)
- [ ] Variable `VITE_FIREBASE_USE_EMULATOR` configurada correctamente
- [ ] Variable `VITE_FIREBASE_AUTH_EMULATOR_HOST` configurada (si usas emuladores)
- [ ] Dev server reiniciado después de cambios en .env
- [ ] Consola muestra modo correcto (CLOUD o EMULATOR)

---

## 🚀 RECOMENDACIÓN

**Para desarrollo local**: Usar emuladores (Solución 1)
- Permite desarrollo sin afectar datos de producción
- Más rápido para testing
- Permite resetear datos fácilmente

**Para testing con datos reales**: Usar Cloud (Solución 2)
- Acceso a datos reales de UAT
- Testing más cercano a producción
- Requiere credenciales válidas

---

## ⚠️ NOTAS IMPORTANTES

1. **No mezclar modos**: Si inicias emuladores, asegúrate de que `VITE_FIREBASE_USE_EMULATOR=true`
2. **Reiniciar dev server**: Cualquier cambio en `.env.local` requiere reiniciar el servidor
3. **Puertos ocupados**: Si los puertos están ocupados, detén otros procesos o cambia los puertos en `firebase.json`
4. **Credenciales de emulador**: Los emuladores usan credenciales de prueba, no las de producción

---

## 🔗 REFERENCIAS

- `package.json`: Script `emulators:start`
- `firebase.json`: Configuración de emuladores
- `src/lib/firebase.ts`: Lógica de inicialización
- `.env.local`: Variables de entorno (no versionado)

---

**Última actualización**: 28 Nov 2025  
**Estado**: ✅ Solución documentada


