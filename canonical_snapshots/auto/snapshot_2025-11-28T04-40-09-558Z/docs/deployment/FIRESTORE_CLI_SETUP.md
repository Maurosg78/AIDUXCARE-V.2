# Configuración Firestore por CLI - value_analytics
**Setup Automatizado de Colección e Índices**

**Fecha:** Noviembre 2025  
**Método:** Firebase CLI (Automático)

---

## ✅ VENTAJAS DE CLI vs Console Manual

- ✅ **Reproducible** - Script ejecutable, no clicks manuales
- ✅ **Versionado** - Índices en `firestore.indexes.json` (en Git)
- ✅ **Rápido** - 1 comando vs múltiples clicks
- ✅ **Validación** - CLI valida antes de deployar

---

## 🚀 CONFIGURACIÓN RÁPIDA (2 Comandos)

### Paso 1: Verificar Login Firebase

```bash
firebase projects:list
```

**Si no estás logueado:**
```bash
firebase login
```

---

### Paso 2: Deployar Índices

```bash
# Opción A: Script automatizado
./scripts/setup-value-analytics.sh

# Opción B: Comando directo
firebase deploy --only firestore:indexes
```

---

## ✅ VERIFICACIÓN

### 1. Verificar Índices Desplegados

```bash
firebase firestore:indexes
```

Deberías ver los 3 índices para `value_analytics`:
- `timestamp` (ASC)
- `hashedUserId` (ASC) + `timestamp` (DESC)
- `sessionType` (ASC) + `timestamp` (DESC)

---

### 2. Verificar en Firebase Console

1. Ir a: https://console.firebase.google.com
2. Proyecto: `aiduxcare-v2-uat-dev`
3. Firestore Database → Indexes
4. Deberías ver 3 índices para `value_analytics` en estado "Building" o "Enabled"

---

### 3. La Colección se Crea Automáticamente

**No necesitas crear la colección manualmente.** Firestore crea la colección `value_analytics` automáticamente cuando escribes el primer documento.

---

## 🧪 TEST RÁPIDO

Después de desplegar índices, puedes probar en browser console:

```typescript
import { AnalyticsService } from '@/services/analyticsService';

// Test básico (sin PHI)
const testMetrics = {
  hashedUserId: 'test-user-123',
  hashedSessionId: 'test-session-456',
  timestamps: {
    sessionStart: new Date(),
    soapFinalized: new Date(),
  },
  calculatedTimes: {
    totalDocumentationTime: 8.5,
  },
  featuresUsed: {
    transcription: true,
    physicalTests: true,
    aiSuggestions: true,
    soapGeneration: true,
  },
  quality: {
    soapSectionsCompleted: {
      subjective: true,
      objective: true,
      assessment: true,
      plan: true,
    },
    suggestionsOffered: 5,
    suggestionsAccepted: 4,
    suggestionsRejected: 1,
    editsMadeToSOAP: 0,
  },
  sessionType: 'initial',
  region: 'Ontario',
};

// Esto debería funcionar sin errores
await AnalyticsService.trackValueMetrics(testMetrics);
```

---

## 📋 ARCHIVOS CONFIGURADOS

### `firestore.indexes.json`
- ✅ 3 índices agregados para `value_analytics`
- ✅ Listos para deployar

### `firestore.rules`
- ✅ Reglas agregadas para `value_analytics`
- ✅ Permisos para lectura/escritura autenticada

### `scripts/setup-value-analytics.sh`
- ✅ Script de setup automatizado
- ✅ Valida login y CLI antes de deployar

---

## ⚠️ NOTAS IMPORTANTES

1. **Índices toman tiempo**: Firestore puede tardar 1-5 minutos en construir índices después del deploy
2. **Colección automática**: No necesitas crear la colección manualmente, se crea al escribir
3. **Reglas de producción**: Las reglas actuales son permisivas, ajustar para producción

---

## 🎯 RESULTADO ESPERADO

Después de ejecutar `firebase deploy --only firestore:indexes`:

- ✅ 3 índices desplegados para `value_analytics`
- ✅ Colección lista para recibir datos (se crea automáticamente)
- ✅ Sistema completo validado y funcionando

---

**Setup completado en 2 minutos vs 15 minutos manualmente.** 🚀

