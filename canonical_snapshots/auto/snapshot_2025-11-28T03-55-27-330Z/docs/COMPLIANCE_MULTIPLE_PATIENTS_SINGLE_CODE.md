# 🔐 Análisis de Compliance - Código Único para Múltiples Pacientes

## 📋 Requisito del Usuario

Permitir que un fisioterapeuta que ve 3 pacientes pueda usar **un solo código** para acceder a las 3 notas clínicas, facilitando el copy-paste al EMR.

**Workflow propuesto:**
1. Fisio ve 3 pacientes en el hospital
2. Genera notas con AiDuxCare (cada una con su código único)
3. Recibe **un código maestro** que le permite acceder a las 3 notas
4. Mantiene la pestaña abierta por ~5 minutos mientras copia al EMR
5. Copia cada nota al EMR correspondiente

---

## 🔍 Análisis de Compliance ISO 27001 / PHIPA

### ✅ Aspectos Positivos (Cumplen con Compliance)

#### 1. **A.9.4.2 - Secure Log-on Procedures**
- ✅ **Doble autenticación mantenida**: Código maestro + password personal
- ✅ **Audit trail completo**: Cada acceso a cada nota queda registrado
- ✅ **Rate limiting**: Se mantiene por código maestro
- ✅ **Session timeout**: 5 minutos se mantiene

#### 2. **A.12.4.1 - Event Logging**
- ✅ **Cada acceso auditado**: Acceso a nota 1, nota 2, nota 3 = 3 eventos separados
- ✅ **Metadata completo**: IP, timestamp, código usado, nota accedida
- ✅ **Trazabilidad completa**: Se puede rastrear qué nota fue accedida cuándo

#### 3. **A.12.4.2 - Protection of Log Information**
- ✅ **Logs encriptados**: Metadata encriptada en todos los eventos
- ✅ **Inmutabilidad**: Logs no pueden modificarse
- ✅ **Retención**: Mínimo 6 años (HIPAA)

#### 4. **A.8.2.3 - Handling of Assets**
- ✅ **Ciclo de vida controlado**: Cada nota mantiene su auto-delete individual
- ✅ **Acceso granular**: Se puede ver qué nota fue accedida

---

## ⚠️ Consideraciones de Seguridad

### 1. **Principio de Mínimo Privilegio**

**Riesgo**: Un código maestro que accede a múltiples pacientes podría violar el principio de mínimo privilegio si:
- El código se compromete, expone múltiples pacientes de una vez
- No hay control granular de qué notas se pueden acceder

**Mitigación**:
- ✅ El código maestro solo permite acceso a notas generadas en la misma sesión/horario
- ✅ Timeout de 5 minutos limita la ventana de exposición
- ✅ Cada acceso queda auditado individualmente
- ✅ Auto-logout después de copy action

### 2. **Audit Trail Granular**

**Requisito**: Cada acceso a cada nota debe quedar registrado por separado.

**Implementación**:
```typescript
// Evento 1: Acceso a nota del paciente A
auditLog({
  type: 'hospital_portal_note_accessed',
  noteId: 'ABC123', // Código de la nota individual
  masterCode: 'MASTER789', // Código maestro usado
  patientId: 'patient-A',
  action: 'view'
});

// Evento 2: Acceso a nota del paciente B
auditLog({
  type: 'hospital_portal_note_accessed',
  noteId: 'DEF456',
  masterCode: 'MASTER789',
  patientId: 'patient-B',
  action: 'view'
});
```

### 3. **Ventana Temporal**

**Requisito**: El código maestro debe tener una ventana temporal limitada.

**Implementación**:
- ✅ Código maestro válido solo por 1 hora desde creación
- ✅ Session timeout de 5 minutos por acceso
- ✅ Auto-logout después de cada copy action

---

## ✅ Conclusión de Compliance

### **VIABLE CON IMPLEMENTACIÓN ADECUADA**

El uso de un código maestro para múltiples pacientes es **viable desde el punto de vista de compliance** SI:

1. ✅ **Cada acceso queda auditado individualmente**
2. ✅ **El código maestro tiene ventana temporal limitada** (1 hora)
3. ✅ **Session timeout se mantiene** (5 minutos)
4. ✅ **Auto-logout después de copy** se mantiene
5. ✅ **Rate limiting se aplica al código maestro**
6. ✅ **Solo permite acceso a notas de la misma sesión/horario**

---

## 🏗️ Arquitectura Propuesta

### Estructura de Datos

```typescript
interface MasterCode {
  masterCodeId: string; // Código maestro único (ej: "MASTER789")
  physiotherapistId: string;
  createdAt: Timestamp;
  expiresAt: Timestamp; // 1 hora desde creación
  noteCodes: string[]; // ['ABC123', 'DEF456', 'GHI789']
  sessionId: string; // ID de la sesión de trabajo
  accessLog: MasterCodeAccessLog[];
}

interface MasterCodeAccessLog {
  timestamp: Timestamp;
  noteCode: string; // Código de la nota individual accedida
  patientId?: string;
  action: 'view' | 'copy';
  ipAddress: string;
  userAgent: string;
}
```

### Flujo de Autenticación

1. **Fisio genera notas** para 3 pacientes → Cada nota tiene su código individual
2. **Sistema genera código maestro** → Vincula los 3 códigos individuales
3. **Fisio usa código maestro** → Accede a lista de notas disponibles
4. **Fisio selecciona nota** → Accede con doble auth (código maestro + password)
5. **Fisio copia nota** → Auto-logout de esa nota específica
6. **Fisio repite** para las otras notas

---

## 📊 Eventos de Auditoría Requeridos

### Por cada acceso:

```typescript
// Evento 1: Autenticación con código maestro
{
  type: 'hospital_portal_master_auth_success',
  masterCodeId: 'MASTER789',
  noteCodes: ['ABC123', 'DEF456', 'GHI789'],
  securityLevel: 'high'
}

// Evento 2: Acceso a nota individual
{
  type: 'hospital_portal_note_accessed',
  masterCodeId: 'MASTER789',
  noteCode: 'ABC123',
  patientId: 'patient-A',
  action: 'view',
  securityLevel: 'medium'
}

// Evento 3: Copy de nota
{
  type: 'hospital_portal_note_copied',
  masterCodeId: 'MASTER789',
  noteCode: 'ABC123',
  patientId: 'patient-A',
  action: 'copy',
  securityLevel: 'high'
}
```

---

## ✅ Checklist de Implementación

- [ ] Implementar estructura `MasterCode` en Firestore
- [ ] Generar código maestro al crear múltiples notas en sesión
- [ ] Autenticación con código maestro + password
- [ ] Lista de notas disponibles con código maestro
- [ ] Acceso individual a cada nota (con audit)
- [ ] Auto-logout después de copy por nota
- [ ] Rate limiting en código maestro
- [ ] Expiración de código maestro (1 hora)
- [ ] Audit logging granular (cada acceso individual)
- [ ] Verificación de compliance ISO 27001

---

## 🎯 Recomendación Final

**✅ APROBADO PARA IMPLEMENTACIÓN**

El uso de un código maestro para múltiples pacientes es **compliance-friendly** siempre que:
- Cada acceso quede auditado individualmente
- La ventana temporal sea limitada
- Los controles de seguridad se mantengan

**Beneficios**:
- ✅ Mejora UX para fisioterapeutas
- ✅ Reduce fricción en workflow hospitalario
- ✅ Mantiene compliance completo
- ✅ Facilita integración con EMR

---

**Estado**: ✅ **VIABLE**  
**Nivel de riesgo**: **BAJO** (con implementación adecuada)  
**Requisitos adicionales**: Audit logging granular obligatorio

