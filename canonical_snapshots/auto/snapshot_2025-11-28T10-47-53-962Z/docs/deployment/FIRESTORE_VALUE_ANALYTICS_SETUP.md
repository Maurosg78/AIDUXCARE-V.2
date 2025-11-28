# Firestore Setup: value_analytics Collection
**Configuración de Colección para Métricas MVP**

**Fecha:** Noviembre 2025  
**Prioridad:** ALTA - Requerido para DÍA 1

---

## 📋 COLECCIÓN A CREAR

**Nombre:** `value_analytics`

**Propósito:** Almacenar métricas de valor agregado (Time-to-Value, Feature Adoption, Quality Signals) de forma PHIPA-compliant.

---

## 🏗️ SCHEMA DE DOCUMENTO

```typescript
{
  // Identificadores pseudonymizados
  hashedUserId: string;           // Hash SHA-256 de user ID
  hashedSessionId: string;        // Hash SHA-256 de session ID
  
  // Timestamps (para cálculos de tiempo)
  timestamps: {
    sessionStart: Timestamp;
    transcriptionStart: Timestamp | null;
    transcriptionEnd: Timestamp | null;
    soapGenerationStart: Timestamp | null;
    soapFinalized: Timestamp;
  };
  
  // Tiempos calculados (en minutos)
  calculatedTimes: {
    totalDocumentationTime: number;
    transcriptionTime: number | null;
    aiGenerationTime: number | null;
    manualEditingTime: number | null;
  };
  
  // Feature Adoption
  featuresUsed: {
    transcription: boolean;
    physicalTests: boolean;
    aiSuggestions: boolean;
    soapGeneration: boolean;
  };
  
  // Quality Signals
  quality: {
    soapSectionsCompleted: {
      subjective: boolean;
      objective: boolean;
      assessment: boolean;
      plan: boolean;
    };
    suggestionsOffered: number;
    suggestionsAccepted: number;
    suggestionsRejected: number;
    editsMadeToSOAP: number;
  };
  
  // Metadata
  sessionType: string;            // "initial" | "follow-up"
  region: string | null;          // Provincia (sin granularidad específica)
  timestamp: Timestamp;            // Timestamp de creación del evento
}
```

---

## 🔍 ÍNDICES REQUERIDOS

### Índice 1: Queries por fecha

**Campos:**
- `timestamp` (ASC)

**Uso:** Para obtener métricas de los últimos N días

**Crear en Firebase Console:**
```
Collection: value_analytics
Fields: timestamp (Ascending)
```

---

### Índice 2: Métricas por usuario

**Campos:**
- `hashedUserId` (ASC)
- `timestamp` (DESC)

**Uso:** Para métricas agregadas por usuario (sin PHI)

**Crear en Firebase Console:**
```
Collection: value_analytics
Fields: 
  - hashedUserId (Ascending)
  - timestamp (Descending)
```

---

### Índice 3: Comparar initial vs follow-up

**Campos:**
- `sessionType` (ASC)
- `timestamp` (DESC)

**Uso:** Para comparar métricas entre visitas iniciales y follow-up

**Crear en Firebase Console:**
```
Collection: value_analytics
Fields:
  - sessionType (Ascending)
  - timestamp (Descending)
```

---

## 📝 INSTRUCCIONES DE CREACIÓN

### Paso 1: Crear Colección

1. Ir a Firebase Console: https://console.firebase.google.com
2. Seleccionar proyecto: `aiduxcare-v2-uat-dev`
3. Ir a Firestore Database
4. Click en "Start collection" (si es primera vez) o "Add collection"
5. Collection ID: `value_analytics`
6. Document ID: Auto-generate
7. Click "Save" (crear colección vacía primero)

---

### Paso 2: Crear Índices

**Opción A: Desde Firebase Console**

1. Ir a Firestore Database → Indexes
2. Click "Create Index"
3. Collection: `value_analytics`
4. Agregar campos según índices arriba
5. Click "Create"

**Opción B: Desde Link de Error**

Cuando ejecutes la primera query, Firestore te dará un link para crear el índice automáticamente. Click en el link y crea el índice.

---

## ✅ VALIDACIÓN

Después de crear la colección, verificar:

- [ ] Colección `value_analytics` existe
- [ ] Índice 1 creado (`timestamp` ASC)
- [ ] Índice 2 creado (`hashedUserId` ASC + `timestamp` DESC)
- [ ] Índice 3 creado (`sessionType` ASC + `timestamp` DESC)

---

## 🔒 SEGURIDAD

**Reglas de Firestore:**

```javascript
// Agregar a firestore.rules
match /value_analytics/{document} {
  // Solo lectura para usuarios autenticados
  // Escritura solo desde backend/server
  allow read: if request.auth != null;
  allow write: if false; // Solo desde código (server-side)
}
```

**Nota:** Por ahora, las reglas pueden ser más permisivas para desarrollo, pero en producción deben ser restrictivas.

---

## 📊 PRIMER DOCUMENTO DE PRUEBA

Para validar que todo funciona, puedes crear un documento de prueba manualmente:

```json
{
  "hashedUserId": "test-hash-123",
  "hashedSessionId": "test-session-456",
  "timestamps": {
    "sessionStart": "2025-11-15T10:00:00Z",
    "transcriptionStart": "2025-11-15T10:01:00Z",
    "transcriptionEnd": "2025-11-15T10:05:00Z",
    "soapGenerationStart": "2025-11-15T10:05:30Z",
    "soapFinalized": "2025-11-15T10:08:00Z"
  },
  "calculatedTimes": {
    "totalDocumentationTime": 8.0,
    "transcriptionTime": 4.0,
    "aiGenerationTime": 2.5,
    "manualEditingTime": 1.5
  },
  "featuresUsed": {
    "transcription": true,
    "physicalTests": true,
    "aiSuggestions": true,
    "soapGeneration": true
  },
  "quality": {
    "soapSectionsCompleted": {
      "subjective": true,
      "objective": true,
      "assessment": true,
      "plan": true
    },
    "suggestionsOffered": 5,
    "suggestionsAccepted": 4,
    "suggestionsRejected": 1,
    "editsMadeToSOAP": 2
  },
  "sessionType": "initial",
  "region": "Ontario",
  "timestamp": "2025-11-15T10:08:00Z"
}
```

---

## 🎯 PRÓXIMOS PASOS

Después de crear la colección:

1. ✅ Validar que índices se crearon correctamente
2. ✅ Probar query básica desde código
3. ✅ Continuar con DÍA 2 (integración en workflow)

---

**Documento de referencia para configuración de Firestore.**

