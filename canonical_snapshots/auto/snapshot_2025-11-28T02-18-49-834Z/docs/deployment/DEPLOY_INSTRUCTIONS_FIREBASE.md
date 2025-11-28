# Instrucciones de Deploy - Firebase Console
**Guía Visual para Configurar value_analytics**

**Fecha:** Noviembre 2025  
**Método:** Firebase Console (Manual) o CLI

---

## 🎯 OPCIÓN 1: Deploy desde Terminal (RÁPIDO - Recomendado)

### Si estás logueado en Firebase CLI:

```bash
# 1. Ejecutar script automatizado
./scripts/setup-value-analytics.sh

# O ejecutar comandos directamente:
firebase deploy --only firestore:indexes,firestore:rules
```

---

## 🎯 OPCIÓN 2: Deploy desde Firebase Console (MANUAL)

Como estás viendo Firebase Console, puedes hacerlo desde allí:

### Paso 1: Desplegar Reglas

1. En Firebase Console, ve a la pestaña **"Reglas"** (ya la estás viendo)
2. **Copiar y pegar** el contenido de `firestore.rules` local
3. Click en **"Publicar"** o **"Publish"**

**O usar el editor de reglas:**
- Las reglas para `value_analytics` ya están en el archivo local
- Deberían verse así:
```javascript
// Value Analytics Collection - PHIPA Compliant
match /value_analytics/{document} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

---

### Paso 2: Crear Índices

1. En Firebase Console, ve a la pestaña **"Índices"** (ya la estás viendo)
2. Click en **"Crear índice"**
3. Crear los 3 índices uno por uno:

#### Índice 1: timestamp
- **Colección:** `value_analytics`
- **Campos:**
  - `timestamp` - **Ascendente**

#### Índice 2: hashedUserId + timestamp
- **Colección:** `value_analytics`
- **Campos:**
  - `hashedUserId` - **Ascendente**
  - `timestamp` - **Descendente**

#### Índice 3: sessionType + timestamp
- **Colección:** `value_analytics`
- **Campos:**
  - `sessionType` - **Ascendente**
  - `timestamp` - **Descendente**

---

## 🎯 OPCIÓN 3: Deploy por CLI (Si puedes autenticarte)

### Si necesitas hacer login primero:

```bash
# 1. Login a Firebase
firebase login

# 2. Seleccionar proyecto
firebase use aiduxcare-v2-uat-dev

# 3. Deployar
firebase deploy --only firestore:indexes,firestore:rules
```

---

## ✅ VERIFICACIÓN POST-DEPLOY

Después de desplegar, verifica:

### 1. Reglas
- Firebase Console → Firestore → **Reglas**
- Deberías ver las reglas para `value_analytics` en la lista

### 2. Índices
- Firebase Console → Firestore → **Índices**
- Deberías ver 3 índices para `value_analytics` en estado "Building" o "Enabled"
- Puede tardar 1-5 minutos en construirse

### 3. Colección
- La colección `value_analytics` **NO** necesita crearse manualmente
- Se crea automáticamente cuando escribas el primer documento

---

## 📋 RESUMEN DE LO QUE SE DESPLIEGA

### Reglas (`firestore.rules`):
```javascript
match /value_analytics/{document} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

### Índices (`firestore.indexes.json`):
1. `timestamp` (ASC)
2. `hashedUserId` (ASC) + `timestamp` (DESC)
3. `sessionType` (ASC) + `timestamp` (DESC)

---

**El deploy puede hacerse desde Console o CLI. Ambos métodos son válidos.** 🚀

