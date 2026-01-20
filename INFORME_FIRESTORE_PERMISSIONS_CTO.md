# 📋 INFORME TÉCNICO — Errores de Permisos Firestore
**Fecha:** 2026-01-20  
**Prioridad:** 🔴 CRÍTICA  
**Estado:** Bloqueante para funcionalidad core

---

## 🎯 RESUMEN EJECUTIVO

Durante la corrección de reglas de Firestore para resolver errores de permisos, se identificaron **4 colecciones críticas sin reglas de seguridad**, causando errores `Missing or insufficient permissions` que bloquean funcionalidades esenciales del workflow clínico.

**Impacto:** El sistema funciona parcialmente, pero múltiples features críticas fallan silenciosamente, afectando la experiencia del usuario y la integridad de datos.

---

## 🔴 ERRORES IDENTIFICADOS

### 1. **Colección `episodes`** ❌
**Ubicación:** `src/repositories/episodesRepo.ts`  
**Uso:** Gestión de episodios de tratamiento por paciente  
**Errores observados:**
- `episodesRepo.ts:109` - Error obteniendo episodio activo
- `followUpDetectionService.ts:168` - Error checking consultations
- `followUpDetectionService.ts:199` - Error checking episodes

**Estructura de datos:**
```typescript
{
  patientId: string;
  ownerUid: string;  // UID del fisioterapeuta dueño
  status: 'active' | 'completed' | 'cancelled';
  // ... otros campos
}
```

**Queries utilizadas:**
- `where('patientId', '==', patientId)`
- `where('status', '==', 'active')`
- `where('ownerUid', '==', uid)` (implícito)

---

### 2. **Colección `encounters`** ❌
**Ubicación:** `src/repositories/encountersRepo.ts`  
**Uso:** Gestión de encuentros/visitas clínicas  
**Errores observados:**
- `encountersRepo.ts:147` - Error obteniendo encuentros
- `encountersRepo.ts:126` - Error obteniendo último encuentro
- `usePatientVisitCount.ts:49` - Error obteniendo conteo de visitas
- `useLastEncounter.ts:34` - Error obteniendo último encuentro

**Estructura de datos:**
```typescript
{
  patientId: string;
  authorUid: string;  // UID del fisioterapeuta que creó el encuentro
  episodeId?: string;
  encounterDate: Timestamp;
  // ... otros campos
}
```

**Queries utilizadas:**
- `where('patientId', '==', patientId)`
- `orderBy('encounterDate', 'desc')`
- `limit(10)`

---

### 3. **Colección `consent_verifications`** ❌
**Ubicación:** `src/services/consentVerificationService.ts`  
**Uso:** Estado de verificación de consentimiento por paciente  
**Errores observados:**
- `consentVerificationService.ts:313` - Error getting state (2 ocurrencias)

**Estructura de datos:**
```typescript
{
  patientId: string;  // Document ID = patientId
  patientName: string;
  smsStatus: string;
  consentMethod: string;
  consentTimestamp: Timestamp;
  // ... otros campos
}
```

**Accesos:**
- Lectura: `doc(db, 'consent_verifications', patientId)`
- Escritura: `setDoc(doc(db, 'consent_verifications', state.patientId), ...)`

---

### 4. **Colección `audit_logs`** ❌
**Ubicación:** `src/core/audit/FirestoreAuditLogger.ts`  
**Uso:** Logging de eventos de auditoría (compliance)  
**Errores observados:**
- `FirestoreAuditLogger.ts:53` - Error logging audit event
- `followUpDetectionService.ts:439` - Error al intentar loggear evento de auditoría

**Estructura de datos:**
```typescript
{
  userId: string;
  patientId?: string;
  action: string;
  metadata: string;  // Cifrado
  timestamp: Timestamp;
  // ... otros campos
}
```

**Accesos:**
- Creación: `addDoc(collection(db, 'audit_logs'), ...)`
- Lectura: Queries con filtros por `userId`, `patientId`, `action`

---

## 📊 ANÁLISIS DE IMPACTO

### Funcionalidades Afectadas

| Feature | Severidad | Estado |
|---------|-----------|--------|
| **Follow-up Detection** | 🔴 CRÍTICA | ❌ Roto - No puede detectar si es follow-up |
| **Patient Visit Count** | 🟡 ALTA | ❌ Roto - No muestra historial de visitas |
| **Active Episode Display** | 🟡 ALTA | ❌ Roto - No muestra episodio activo |
| **Last Encounter Display** | 🟡 ALTA | ❌ Roto - No muestra último encuentro |
| **Consent Verification** | 🔴 CRÍTICA | ❌ Roto - No puede verificar estado de consentimiento |
| **Audit Logging** | 🟡 ALTA | ❌ Roto - No puede registrar eventos de auditoría (compliance) |

### Impacto en Workflow Clínico

1. **Workflow Detection:** El sistema no puede determinar automáticamente si una sesión es "Initial Assessment" o "Follow-up", forzando selección manual.
2. **Patient Dashboard:** Información histórica del paciente no se muestra (visitas previas, episodios activos).
3. **Consent Management:** No se puede verificar el estado de consentimiento, afectando compliance.
4. **Audit Trail:** Eventos críticos no se registran, comprometiendo trazabilidad y compliance.

---

## 🔧 SOLUCIÓN PROPUESTA

### Reglas de Firestore Requeridas

#### 1. **Colección `episodes`**
```javascript
match /episodes/{episodeId} {
  // Lectura: Solo episodios del paciente que pertenecen al fisio autenticado
  allow read: if request.auth != null
               && resource.data.ownerUid == request.auth.uid;
  
  // Creación: Solo si el ownerUid coincide con el usuario autenticado
  allow create: if request.auth != null
                 && request.resource.data.ownerUid == request.auth.uid;
  
  // Actualización: Solo el dueño puede actualizar
  allow update: if request.auth != null
                 && resource.data.ownerUid == request.auth.uid
                 && request.resource.data.ownerUid == request.auth.uid;
  
  // No deletes desde cliente
  allow delete: if false;
}
```

#### 2. **Colección `encounters`**
```javascript
match /encounters/{encounterId} {
  // Lectura: Solo encuentros del paciente que pertenecen al fisio autenticado
  allow read: if request.auth != null
               && resource.data.authorUid == request.auth.uid;
  
  // Creación: Solo si el authorUid coincide con el usuario autenticado
  allow create: if request.auth != null
                 && request.resource.data.authorUid == request.auth.uid;
  
  // Actualización: Solo el autor puede actualizar
  allow update: if request.auth != null
                 && resource.data.authorUid == request.auth.uid
                 && request.resource.data.authorUid == request.auth.uid;
  
  // No deletes desde cliente
  allow delete: if false;
}
```

#### 3. **Colección `consent_verifications`**
```javascript
match /consent_verifications/{patientId} {
  // Lectura: Solo si el paciente pertenece al fisio autenticado
  // Necesitamos verificar que el paciente tiene ownerUid == auth.uid
  // Esto requiere una validación más compleja o permitir lectura autenticada
  allow read: if request.auth != null;
  
  // Creación/Actualización: Solo usuarios autenticados
  // El sistema valida internamente que el paciente pertenece al fisio
  allow create, update: if request.auth != null;
  
  // No deletes desde cliente
  allow delete: if false;
}
```

**Nota:** Para `consent_verifications`, la validación de `ownerUid` debe hacerse a nivel de aplicación, ya que Firestore Rules no puede hacer joins entre colecciones.

#### 4. **Colección `audit_logs`**
```javascript
match /audit_logs/{logId} {
  // Lectura: Solo logs del usuario autenticado
  allow read: if request.auth != null
               && resource.data.userId == request.auth.uid;
  
  // Creación: Solo si el userId coincide con el usuario autenticado
  allow create: if request.auth != null
                 && request.resource.data.userId == request.auth.uid;
  
  // Inmutables - no updates ni deletes
  allow update, delete: if false;
}
```

---

## ⚠️ CONSIDERACIONES DE SEGURIDAD

### Validación de Ownership

Las reglas propuestas asumen que:
1. **`episodes`** y **`encounters`** tienen campos `ownerUid`/`authorUid` que coinciden con `request.auth.uid`
2. **`consent_verifications`** requiere validación a nivel de aplicación (no se puede validar ownership directamente en rules)
3. **`audit_logs`** tiene campo `userId` que coincide con `request.auth.uid`

### Recomendaciones

1. **Validar en código:** Asegurar que todos los `create`/`update` establezcan correctamente `ownerUid`/`authorUid`/`userId`
2. **Testing:** Probar reglas con Firebase Emulator antes de deploy
3. **Monitoreo:** Agregar logging para detectar intentos de acceso no autorizados

---

## 📝 PLAN DE ACCIÓN

### Fase 1: Implementación Inmediata (CRÍTICA)
- [ ] Agregar reglas para `episodes`
- [ ] Agregar reglas para `encounters`
- [ ] Agregar reglas para `consent_verifications`
- [ ] Agregar reglas para `audit_logs`
- [ ] Deploy de reglas a Firebase
- [ ] Verificación funcional

### Fase 2: Validación (ALTA)
- [ ] Testing con Firebase Emulator
- [ ] Verificar que queries existentes funcionan
- [ ] Validar que no se rompen funcionalidades existentes

### Fase 3: Monitoreo (MEDIA)
- [ ] Agregar logging para intentos de acceso denegados
- [ ] Monitorear errores de permisos post-deploy
- [ ] Documentar estructura de datos esperada

---

## 🎯 CONCLUSIÓN

**Estado Actual:** 🔴 **BLOQUEANTE**

El sistema tiene **4 colecciones críticas sin reglas de seguridad**, causando fallos silenciosos en features esenciales del workflow clínico. Esto afecta:
- Detección automática de follow-up
- Visualización de historial del paciente
- Verificación de consentimiento
- Trazabilidad de auditoría

**Recomendación:** Implementar reglas propuestas **inmediatamente** antes de continuar con desarrollo o demos.

**Tiempo estimado:** 30-45 minutos (implementación + testing + deploy)

---

**Preparado por:** Cursor AI Assistant  
**Revisado por:** [Pendiente]  
**Aprobado por:** [Pendiente]
