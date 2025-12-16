# 📋 Propuesta de Implementación: Scheduling de Plan de Tratamiento

## 🎯 Objetivo

Transformar el componente `TreatmentPlanScheduler` de creación directa de citas a un **sistema de propuestas** que:
1. Presente una propuesta de scheduling basada en el plan de tratamiento SOAP
2. Permita al fisioterapeuta revisar, modificar y aceptar/rechazar
3. Solo cree citas reales cuando sea aceptada
4. Solo funcione para pacientes **outpatient** (inpatient se trabajará más adelante)

---

## 🔍 Análisis del Estado Actual

### Componente Actual: `TreatmentPlanScheduler.tsx`

**Problemas identificados:**
- ❌ Crea citas directamente sin revisión previa
- ❌ No permite modificar fechas/horarios antes de crear
- ❌ No diferencia entre outpatient/inpatient
- ❌ No hay estado de "propuesta" vs "aceptada"
- ❌ Una vez creadas, no hay forma de cancelar fácilmente

**Flujo actual:**
```
SOAP Plan → Parse → Generate Dates → Create Appointments (directo)
```

---

## 🏗️ Arquitectura Propuesta

### 1. **Modelo de Datos: `TreatmentPlanProposal`**

```typescript
// src/types/treatmentPlanProposal.ts

export interface TreatmentPlanProposal {
  id: string; // Auto-generado
  patientId: string;
  clinicianUid: string;
  sessionId?: string; // ID de la sesión SOAP que generó esta propuesta
  
  // Información parseada del plan
  parsedPlan: ParsedTreatmentPlan; // Ya existe en treatmentPlanParser.ts
  
  // Propuesta de sesiones
  proposedSessions: ProposedSession[];
  
  // Estado de la propuesta
  status: 'pending' | 'accepted' | 'modified' | 'rejected';
  
  // Fecha de creación y modificación
  createdAt: Date;
  updatedAt: Date;
  
  // Notas del fisioterapeuta (opcional)
  clinicianNotes?: string;
  
  // Tipo de paciente (solo outpatient por ahora)
  patientType: 'outpatient'; // 'inpatient' se agregará más adelante
}

export interface ProposedSession {
  sessionNumber: number; // 1, 2, 3...
  proposedDateTime: Date;
  durationMinutes: number; // Default 45
  notes?: string;
  
  // Estado individual (para permitir modificar sesiones específicas)
  status: 'proposed' | 'modified' | 'accepted' | 'excluded';
  
  // Si fue modificada, guardar la fecha/hora original
  originalDateTime?: Date;
}
```

### 2. **Repositorio: `treatmentPlanProposalsRepo.ts`**

```typescript
// src/repositories/treatmentPlanProposalsRepo.ts

import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import type { TreatmentPlanProposal, ProposedSession } from '../types/treatmentPlanProposal';

const COLLECTION_NAME = 'treatmentPlanProposals';

export async function createProposal(
  proposal: Omit<TreatmentPlanProposal, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const db = getFirestore();
  const ref = await addDoc(collection(db, COLLECTION_NAME), {
    ...proposal,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProposal(
  proposalId: string,
  updates: Partial<TreatmentPlanProposal>
): Promise<void> {
  const db = getFirestore();
  await updateDoc(doc(db, COLLECTION_NAME, proposalId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function getProposal(proposalId: string): Promise<TreatmentPlanProposal | null> {
  const db = getFirestore();
  const docSnap = await getDoc(doc(db, COLLECTION_NAME, proposalId));
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    proposedSessions: data.proposedSessions.map((s: any) => ({
      ...s,
      proposedDateTime: s.proposedDateTime?.toDate() || new Date(),
      originalDateTime: s.originalDateTime?.toDate(),
    })),
  } as TreatmentPlanProposal;
}

export async function getProposalsByPatient(
  patientId: string
): Promise<TreatmentPlanProposal[]> {
  const db = getFirestore();
  const q = query(
    collection(db, COLLECTION_NAME),
    where('patientId', '==', patientId),
    where('status', 'in', ['pending', 'accepted', 'modified'])
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as TreatmentPlanProposal[];
}
```

### 3. **Servicio: `treatmentPlanProposalService.ts`**

```typescript
// src/services/treatmentPlanProposalService.ts

import { 
  createProposal, 
  updateProposal, 
  getProposal,
  getProposalsByPatient 
} from '../repositories/treatmentPlanProposalsRepo';
import { createAppointment } from '../repositories/appointmentsRepo';
import { parseTreatmentPlan, generateSessionDates, type ParsedTreatmentPlan } from './treatmentPlanParser';
import type { TreatmentPlanProposal, ProposedSession } from '../types/treatmentPlanProposal';

export class TreatmentPlanProposalService {
  /**
   * Crea una propuesta de scheduling basada en el plan de tratamiento SOAP
   * Solo para pacientes outpatient
   */
  static async createProposalFromSOAPPlan(
    planText: string,
    patientId: string,
    clinicianUid: string,
    sessionId?: string,
    patientType: 'outpatient' = 'outpatient'
  ): Promise<string> {
    // Validar que sea outpatient
    if (patientType !== 'outpatient') {
      throw new Error('Treatment plan scheduling is only available for outpatient patients');
    }
    
    // Parsear el plan
    const parsedPlan = parseTreatmentPlan(planText);
    
    if (!parsedPlan.frequencyPerWeek || !parsedPlan.durationWeeks) {
      throw new Error('Could not extract frequency and duration from treatment plan');
    }
    
    // Generar fechas propuestas (default: mañana a las 10:00 AM)
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() + 1);
    defaultStartDate.setHours(10, 0, 0, 0);
    
    const sessionDates = generateSessionDates(parsedPlan, defaultStartDate);
    
    // Crear sesiones propuestas
    const proposedSessions: ProposedSession[] = sessionDates.map((date, index) => ({
      sessionNumber: index + 1,
      proposedDateTime: date,
      durationMinutes: 45,
      status: 'proposed',
      notes: `Session ${index + 1} of ${sessionDates.length} - Treatment plan`,
    }));
    
    // Crear propuesta
    const proposalId = await createProposal({
      patientId,
      clinicianUid,
      sessionId,
      parsedPlan,
      proposedSessions,
      status: 'pending',
      patientType: 'outpatient',
    });
    
    return proposalId;
  }
  
  /**
   * Modifica una sesión específica dentro de la propuesta
   */
  static async modifySession(
    proposalId: string,
    sessionNumber: number,
    newDateTime: Date,
    newDurationMinutes?: number,
    notes?: string
  ): Promise<void> {
    const proposal = await getProposal(proposalId);
    if (!proposal) throw new Error('Proposal not found');
    
    const session = proposal.proposedSessions.find(s => s.sessionNumber === sessionNumber);
    if (!session) throw new Error('Session not found');
    
    // Actualizar sesión
    const updatedSessions = proposal.proposedSessions.map(s => {
      if (s.sessionNumber === sessionNumber) {
        return {
          ...s,
          originalDateTime: s.proposedDateTime, // Guardar original
          proposedDateTime: newDateTime,
          durationMinutes: newDurationMinutes ?? s.durationMinutes,
          notes: notes ?? s.notes,
          status: 'modified' as const,
        };
      }
      return s;
    });
    
    await updateProposal(proposalId, {
      proposedSessions: updatedSessions,
      status: 'modified',
    });
  }
  
  /**
   * Excluye una sesión de la propuesta (no se creará cita)
   */
  static async excludeSession(
    proposalId: string,
    sessionNumber: number
  ): Promise<void> {
    const proposal = await getProposal(proposalId);
    if (!proposal) throw new Error('Proposal not found');
    
    const updatedSessions = proposal.proposedSessions.map(s => {
      if (s.sessionNumber === sessionNumber) {
        return { ...s, status: 'excluded' as const };
      }
      return s;
    });
    
    await updateProposal(proposalId, {
      proposedSessions: updatedSessions,
      status: 'modified',
    });
  }
  
  /**
   * Acepta la propuesta y crea las citas reales en la agenda
   * Solo crea citas para sesiones con status 'proposed' o 'modified'
   */
  static async acceptProposal(proposalId: string): Promise<{
    created: number;
    skipped: number;
    errors: string[];
  }> {
    const proposal = await getProposal(proposalId);
    if (!proposal) throw new Error('Proposal not found');
    
    if (proposal.status === 'accepted') {
      throw new Error('Proposal already accepted');
    }
    
    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[],
    };
    
    // Crear citas solo para sesiones aceptadas/modificadas (no excluidas)
    for (const session of proposal.proposedSessions) {
      if (session.status === 'excluded') {
        results.skipped++;
        continue;
      }
      
      try {
        await createAppointment({
          clinicianUid: proposal.clinicianUid,
          patientId: proposal.patientId,
          date: session.proposedDateTime,
          durationMin: session.durationMinutes,
          notes: session.notes || `Session ${session.sessionNumber} - Treatment plan proposal ${proposalId}`,
          status: 'scheduled',
        });
        results.created++;
      } catch (error: any) {
        results.errors.push(`Session ${session.sessionNumber}: ${error.message}`);
      }
    }
    
    // Marcar propuesta como aceptada
    await updateProposal(proposalId, {
      status: 'accepted',
    });
    
    return results;
  }
  
  /**
   * Rechaza la propuesta (no se crean citas)
   */
  static async rejectProposal(
    proposalId: string,
    reason?: string
  ): Promise<void> {
    await updateProposal(proposalId, {
      status: 'rejected',
      clinicianNotes: reason,
    });
  }
}
```

### 4. **Componente Refactorizado: `TreatmentPlanProposalModal.tsx`**

```typescript
// src/components/TreatmentPlanProposalModal.tsx

/**
 * Modal que muestra la propuesta de scheduling y permite:
 * - Ver todas las sesiones propuestas
 * - Modificar fechas/horarios individuales
 * - Excluir sesiones específicas
 * - Aceptar o rechazar la propuesta completa
 */

interface TreatmentPlanProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: TreatmentPlanProposal | null;
  onAccept: (proposalId: string) => Promise<void>;
  onReject: (proposalId: string, reason?: string) => Promise<void>;
  onModifySession: (proposalId: string, sessionNumber: number, newDateTime: Date) => Promise<void>;
  onExcludeSession: (proposalId: string, sessionNumber: number) => Promise<void>;
}

// Estados del modal:
// 1. "Review Proposal" - Vista inicial con todas las sesiones
// 2. "Modify Session" - Editar una sesión específica
// 3. "Accepting..." - Loading al aceptar
// 4. "Success" - Confirmación de citas creadas
```

### 5. **Integración en `ProfessionalWorkflowPage.tsx`**

```typescript
// En el tab SOAP, después de generar el SOAP note:

// 1. Detectar si el plan tiene información de scheduling
const planText = localSoapNote?.plan || '';
const hasSchedulingInfo = parseTreatmentPlan(planText).frequencyPerWeek !== null;

// 2. Si tiene información y es outpatient, mostrar botón "Schedule Sessions"
{hasSchedulingInfo && currentPatient?.patientType === 'outpatient' && (
  <button onClick={handleCreateProposal}>
    📅 Create Scheduling Proposal
  </button>
)}

// 3. Al hacer clic, crear propuesta y mostrar modal
const handleCreateProposal = async () => {
  const proposalId = await TreatmentPlanProposalService.createProposalFromSOAPPlan(
    planText,
    currentPatient.id,
    user.uid,
    sessionId,
    'outpatient'
  );
  setProposalId(proposalId);
  setShowProposalModal(true);
};
```

---

## 🔄 Flujo de Usuario Propuesto

### Escenario 1: Aceptar Propuesta Sin Modificaciones

```
1. Fisio genera SOAP note con plan de tratamiento
2. Sistema detecta: "2x/week for 4 weeks"
3. Botón aparece: "📅 Create Scheduling Proposal"
4. Fisio hace clic → Se crea propuesta con 8 sesiones
5. Modal muestra:
   - Resumen: Frequency 2x/week, Duration 4 weeks, Total 8 sessions
   - Lista de sesiones propuestas (fechas/horarios)
   - Botones: "Accept All" | "Modify" | "Reject"
6. Fisio revisa y hace clic en "Accept All"
7. Sistema crea 8 citas en la agenda del fisio
8. Modal muestra: "✅ Successfully scheduled 8 sessions"
9. Fisio puede cerrar modal y continuar con el workflow
```

### Escenario 2: Modificar Sesiones Antes de Aceptar

```
1-4. Igual que Escenario 1
5. Modal muestra lista de sesiones
6. Fisio hace clic en "Modify" en la sesión #3
7. Se abre editor de fecha/hora para esa sesión
8. Fisio cambia fecha de "Nov 30, 10:00 AM" a "Dec 1, 2:00 PM"
9. Sistema guarda modificación (status: 'modified')
10. Fisio hace clic en "Accept All"
11. Sistema crea 8 citas (sesión #3 con fecha modificada)
12. Modal muestra: "✅ Successfully scheduled 8 sessions (1 modified)"
```

### Escenario 3: Excluir Sesiones Específicas

```
1-5. Igual que Escenario 1
6. Fisio hace clic en "Exclude" en sesiones #7 y #8
7. Sistema marca esas sesiones como 'excluded'
8. Fisio hace clic en "Accept All"
9. Sistema crea solo 6 citas (sesiones 1-6)
10. Modal muestra: "✅ Successfully scheduled 6 sessions (2 excluded)"
```

### Escenario 4: Rechazar Propuesta

```
1-5. Igual que Escenario 1
6. Fisio hace clic en "Reject"
7. Modal pregunta: "Reason for rejection? (optional)"
8. Fisio escribe: "Patient prefers different schedule"
9. Sistema marca propuesta como 'rejected'
10. Modal se cierra
11. No se crean citas
12. Fisio puede crear nueva propuesta más adelante o agendar manualmente
```

---

## 📊 Estructura de Datos en Firestore

### Collection: `treatmentPlanProposals`

```javascript
{
  id: "proposal_abc123",
  patientId: "patient_xyz789",
  clinicianUid: "clinician_123",
  sessionId: "session_456", // Opcional
  
  parsedPlan: {
    frequencyPerWeek: 2,
    durationWeeks: 4,
    totalSessions: 8,
    followUpDays: 28,
    rawText: "Treatment plan: 2x/week for 4 weeks..."
  },
  
  proposedSessions: [
    {
      sessionNumber: 1,
      proposedDateTime: Timestamp("2025-11-27T10:00:00Z"),
      durationMinutes: 45,
      status: "proposed",
      notes: "Session 1 of 8 - Treatment plan"
    },
    {
      sessionNumber: 2,
      proposedDateTime: Timestamp("2025-11-30T10:00:00Z"),
      durationMinutes: 45,
      status: "modified", // Fue modificada
      originalDateTime: Timestamp("2025-11-29T10:00:00Z"),
      proposedDateTime: Timestamp("2025-12-01T14:00:00Z"),
      notes: "Session 2 of 8 - Modified by clinician"
    },
    // ... más sesiones
  ],
  
  status: "pending", // "pending" | "accepted" | "modified" | "rejected"
  patientType: "outpatient",
  clinicianNotes: "Patient prefers afternoon sessions",
  
  createdAt: Timestamp("2025-11-26T15:30:00Z"),
  updatedAt: Timestamp("2025-11-26T15:35:00Z")
}
```

---

## 🎨 UI/UX Considerations

### Modal de Propuesta

**Header:**
- Título: "Treatment Plan Scheduling Proposal"
- Subtítulo: "Review and modify session schedule before creating appointments"
- Badge: "Outpatient Only" (para claridad)

**Body:**
- **Resumen Cards** (igual que ahora):
  - Frequency: 2x/week
  - Duration: 4 weeks
  - Total Sessions: 8
  - Follow-up: In 28 days

- **Lista de Sesiones** (mejorada):
  ```
  Session 1: Nov 27, 2025 at 10:00 AM [Modify] [Exclude]
  Session 2: Nov 30, 2025 at 10:00 AM [Modify] [Exclude]
  Session 3: Dec 03, 2025 at 10:00 AM [Modify] [Exclude] ⚠️ Modified
  ...
  ```

- **Acciones:**
  - Botón primario: "Accept & Schedule All Sessions" (gradiente azul-púrpura)
  - Botón secundario: "Reject Proposal" (rojo claro)
  - Botón terciario: "Save as Draft" (gris) - para revisar más tarde

### Estados Visuales

- **Pending**: Badge azul "Pending Review"
- **Modified**: Badge amarillo "Modified - Review Required"
- **Accepted**: Badge verde "Scheduled" + contador de citas creadas
- **Rejected**: Badge rojo "Rejected" + razón (si existe)

---

## 🔒 Validaciones y Reglas de Negocio

1. **Solo Outpatient:**
   ```typescript
   if (patient.patientType !== 'outpatient') {
     // No mostrar opción de scheduling
     return null;
   }
   ```

2. **Validar Conflictos de Horario:**
   - Antes de aceptar, verificar si hay citas existentes en esas fechas
   - Mostrar advertencia si hay conflictos
   - Permitir modificar solo las sesiones con conflictos

3. **Límites de Sesiones:**
   - Máximo 20 sesiones por propuesta (evitar propuestas muy largas)
   - Si el plan sugiere más, mostrar advertencia y permitir dividir

4. **Fecha Mínima:**
   - Primera sesión no puede ser en el pasado
   - Validar al modificar fechas individuales

---

## 📈 Métricas y Analytics

Trackear:
- Número de propuestas creadas
- Tasa de aceptación vs rechazo
- Número promedio de modificaciones por propuesta
- Tiempo promedio desde creación hasta aceptación
- Sesiones excluidas vs incluidas

---

## 🚀 Plan de Implementación (Fases)

### **Fase 1: Modelo de Datos y Repositorio** (1-2 días)
- [ ] Crear tipos `TreatmentPlanProposal` y `ProposedSession`
- [ ] Implementar `treatmentPlanProposalsRepo.ts`
- [ ] Crear collection en Firestore con reglas de seguridad

### **Fase 2: Servicio de Propuestas** (2-3 días)
- [ ] Implementar `TreatmentPlanProposalService`
- [ ] Métodos: create, modify, exclude, accept, reject
- [ ] Tests unitarios

### **Fase 3: Componente Modal** (3-4 días)
- [ ] Crear `TreatmentPlanProposalModal.tsx`
- [ ] Vista de lista de sesiones
- [ ] Editor de fecha/hora individual
- [ ] Estados de loading/success/error

### **Fase 4: Integración en Workflow** (1-2 días)
- [ ] Integrar en `ProfessionalWorkflowPage.tsx`
- [ ] Detectar cuando mostrar botón de propuesta
- [ ] Manejar flujo completo

### **Fase 5: Testing y Refinamiento** (2-3 días)
- [ ] Tests E2E del flujo completo
- [ ] Validaciones de conflictos
- [ ] Ajustes de UI/UX basados en feedback

**Total estimado: 9-14 días**

---

## ❓ Preguntas para el CTO

1. **¿Debemos guardar propuestas rechazadas o eliminarlas?**
   - Propuesta: Guardar con status 'rejected' para auditoría

2. **¿Qué pasa si el fisio modifica el SOAP después de crear la propuesta?**
   - Propuesta: Crear nueva propuesta, marcar anterior como 'superseded'

3. **¿Debemos notificar al paciente cuando se acepta la propuesta?**
   - Propuesta: No en Fase 1, agregar en Fase 2 con SMS/Email

4. **¿Cómo manejamos propuestas para pacientes inpatient?**
   - Propuesta: No implementar ahora, dejar preparado para futuro

5. **¿Debemos permitir crear múltiples propuestas para el mismo paciente?**
   - Propuesta: Sí, pero mostrar advertencia si hay propuestas pendientes

---

## 📝 Notas Adicionales

- **Inpatient:** Se trabajará más adelante con lógica diferente (probablemente integración con sistema hospitalario)
- **Re-agendamiento:** Al evitar creación directa, eliminamos el problema de tener que cancelar/re-agendar
- **Auditoría:** Todas las propuestas quedan registradas para cumplimiento PHIPA
- **Escalabilidad:** El modelo permite agregar más funcionalidades (notificaciones, recordatorios, etc.)

---

**¿Alguna pregunta o sugerencia antes de comenzar la implementación?**

