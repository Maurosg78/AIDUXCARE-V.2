# 🎓 GUÍA PASO A PASO - Deploy Manual en Firebase Console
**Para: Mauricio Sobarzo**  
**Fecha:** Noviembre 2025  
**Objetivo:** Configurar `value_analytics` collection (Índices + Reglas)

---

## 📋 ANTES DE EMPEZAR

### ✅ Lo que vas a hacer:
1. **Agregar reglas de seguridad** para `value_analytics` (2 minutos)
2. **Crear 3 índices compuestos** para `value_analytics` (3 minutos)

### ✅ Lo que NO necesitas hacer:
- ❌ Crear la colección manualmente (se crea automáticamente)
- ❌ Configurar algo en el código (ya está listo)

---

## 🔒 PASO 1: AGREGAR REGLAS DE SEGURIDAD

### 📍 Ubicación: Firebase Console → Firestore → **Reglas**

### Instrucciones:

1. **Abre la pestaña "Reglas"** en Firebase Console (ya la estás viendo)

2. **Encuentra el final de las reglas existentes** (después de `audit_logs`)

3. **Agrega este código ANTES del cierre final** (`}` antes de `}`):

```javascript
    // Value Analytics Collection - PHIPA Compliant
    // Only pseudonymized data, no PHI
    match /value_analytics/{document} {
      allow read: if request.auth != null; // Authenticated users can read
      allow write: if request.auth != null; // Authenticated users can write (for now, restrict in production)
    }
```

### 📸 Ejemplo Visual de dónde agregar:

```javascript
    match /audit_logs/{logId} {
      allow read, write: if isAuthenticated();
    }
    
    // 👇 AQUÍ AGREGA EL CÓDIGO NUEVO 👇
    // Value Analytics Collection - PHIPA Compliant
    match /value_analytics/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    // 👆 HASTA AQUÍ 👆
  }
}
```

4. **Click en "Publicar"** o **"Publish"**

5. **Espera confirmación** (tarda 5-10 segundos)

---

## 📊 PASO 2: CREAR ÍNDICES COMPUESTOS

### 📍 Ubicación: Firebase Console → Firestore → **Índices** → **Compuestos**

### Instrucciones:

Crea los 3 índices **uno por uno**:

---

### 📌 ÍNDICE 1: `timestamp` (Simple)

1. **Click en "Crear índice"**

2. **Completar el formulario:**
   - **Colección:** `value_analytics` (escribir manualmente)
   - **Query scope:** Dejar "Colección" (default)

3. **Agregar campos:**
   - **Campo 1:** 
     - Nombre: `timestamp`
     - Orden: **Ascendente** ⬆️
   - **No agregar más campos** (solo este)

4. **Click en "Crear"**

5. **Espera** (aparecerá en estado "Building" - puede tardar 1-5 minutos)

---

### 📌 ÍNDICE 2: `hashedUserId` + `timestamp`

1. **Click en "Crear índice"** (nuevo)

2. **Completar el formulario:**
   - **Colección:** `value_analytics`
   - **Query scope:** "Colección" (default)

3. **Agregar campos:**
   - **Campo 1:** 
     - Nombre: `hashedUserId`
     - Orden: **Ascendente** ⬆️
   - **Campo 2:**
     - Nombre: `timestamp`
     - Orden: **Descendente** ⬇️

4. **Click en "Crear"**

5. **Espera** (aparecerá en estado "Building")

---

### 📌 ÍNDICE 3: `sessionType` + `timestamp`

1. **Click en "Crear índice"** (nuevo)

2. **Completar el formulario:**
   - **Colección:** `value_analytics`
   - **Query scope:** "Colección" (default)

3. **Agregar campos:**
   - **Campo 1:** 
     - Nombre: `sessionType`
     - Orden: **Ascendente** ⬆️
   - **Campo 2:**
     - Nombre: `timestamp`
     - Orden: **Descendente** ⬇️

4. **Click en "Crear"**

5. **Espera** (aparecerá en estado "Building")

---

## ✅ PASO 3: VERIFICACIÓN

### Verificar Reglas:
1. Ve a **Firestore → Reglas**
2. Busca en el código por `value_analytics`
3. Deberías ver las reglas que agregaste

### Verificar Índices:
1. Ve a **Firestore → Índices → Compuestos**
2. Busca índices con colección `value_analytics`
3. Deberías ver 3 índices:
   - Uno con estado "Building" o "Enabled"
   - ⚠️ Si dice "Building", espera 1-5 minutos hasta que cambie a "Enabled"

---

## 🎯 RESUMEN VISUAL

```
✅ PASO 1: REGLAS (2 minutos)
   Firebase Console → Firestore → Reglas
   → Agregar código para value_analytics
   → Click "Publicar"

✅ PASO 2: ÍNDICES (3 minutos)
   Firebase Console → Firestore → Índices → Compuestos
   → Crear Índice 1: timestamp (ASC)
   → Crear Índice 2: hashedUserId (ASC) + timestamp (DESC)
   → Crear Índice 3: sessionType (ASC) + timestamp (DESC)

✅ PASO 3: VERIFICAR (1 minuto)
   → Revisar que reglas estén publicadas
   → Revisar que 3 índices estén en "Building" o "Enabled"
```

---

## ❓ TROUBLESHOOTING

### Problema: "No puedo encontrar dónde agregar las reglas"
**Solución:** Las reglas están en la pestaña "Reglas" (no "Datos"). Busca el editor de código en el panel derecho.

### Problema: "El índice dice 'Error'"
**Solución:** 
- Verifica que escribiste `value_analytics` correctamente (con guion bajo)
- Verifica que los nombres de campos son exactos: `timestamp`, `hashedUserId`, `sessionType`

### Problema: "El índice está en 'Building' hace mucho"
**Solución:** Normal. Puede tardar hasta 5 minutos. Si pasa de 10 minutos, cancela y créalo de nuevo.

---

## 🚀 SIGUIENTE PASO

Una vez que veas los 3 índices en estado "Enabled" (o al menos "Building"):

✅ **¡DÍA 1 COMPLETO!** El código ya está listo, solo falta que escribas el primer documento para crear la colección automáticamente.

**Test rápido:**
```typescript
import { AnalyticsService } from './services/analyticsService';

// Esto creará la colección automáticamente
AnalyticsService.trackValueMetrics({
  hashedUserId: 'test',
  hashedSessionId: 'test-session',
  // ... resto de campos
});
```

---

**¿Necesitas ayuda en algún paso específico? Pregunta y te guío paso a paso.** 🎓

