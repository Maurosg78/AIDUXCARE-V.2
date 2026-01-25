# 📋 FLUJO COMPLETO: Plan de Tratamiento en Follow-up
## Fecha: 2026-01-21 | Estado: ✅ FUNCIONAL (con mejoras necesarias)

---

## 🎯 OBJETIVO

Explicar cómo funciona el flujo completo de recuperación y actualización del plan de tratamiento entre sesiones, para que el fisioterapeuta siempre sepa "¿qué habíamos diseñado para este paciente?"

---

## 🔄 FLUJO ACTUAL

### 1. **GUARDADO DEL PLAN (Initial Assessment o Follow-up)**

**Cuándo se guarda:**
- Cuando se **finaliza el SOAP** (`handleFinalizeSOAP`)
- Se guarda en la colección `treatment_plans` de Firestore

**Código:**
```typescript
// src/pages/ProfessionalWorkflowPage.tsx (línea 3011-3026)
if (soap.plan) {
  await treatmentPlanService.saveTreatmentPlan(
    patientId,
    patientName,
    clinicianId,
    soap.plan,        // Texto completo del plan del SOAP
    visitType         // 'initial' o 'follow-up'
  );
}
```

**Estructura guardada:**
```typescript
{
  id: string,
  patientId: string,
  patientName: string,
  clinicianId: string,
  planText: string,              // Texto completo del plan
  acceptedAt: string,             // Timestamp ISO
  visitType: 'initial' | 'follow-up',
  authorUid: string,              // ✅ Requerido por Firestore rules
  
  // Datos estructurados extraídos del plan:
  interventions?: string[],       // ["Progress UCL exercises", "Continue manual therapy"]
  modalities?: string[],          // ["TENS", "US"]
  homeExercises?: string[],       // ["ROM exercises", "Strengthening"]
  patientEducation?: string[],    // ["Ergonomics", "Activity pacing"]
  goals?: string[],               // ["Increase grip strength to 10kg"]
  nextAppointment?: string,       // "Reassess in 2 weeks"
  nextSessionFocus?: string,      // "Reassess grip strength and pain levels"
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Extracción automática:**
- El servicio `treatmentPlanService` **extrae automáticamente** los datos estructurados del texto del plan
- Usa regex para encontrar secciones como "Interventions:", "Modalities:", "Next Session Focus:", etc.

---

### 2. **RECUPERACIÓN DEL PLAN (Follow-up Visit)**

**Cuándo se recupera:**
- Cuando `visitType === 'follow-up'` (automático al detectar follow-up)
- Se carga al iniciar la sesión de follow-up

**Código:**
```typescript
// src/pages/ProfessionalWorkflowPage.tsx (línea 2363-2396)
useEffect(() => {
  if (visitType === 'follow-up') {
    const loadTreatmentPlan = async () => {
      const plan = await treatmentPlanService.getTreatmentPlan(patientId);
      if (plan) {
        setPreviousTreatmentPlan(plan);  // ✅ Se guarda en estado
      }
    };
    loadTreatmentPlan();
  }
}, [visitType, patientIdFromUrl]);
```

**Query actual:**
```typescript
// src/services/treatmentPlanService.ts (línea 222-244)
const q = query(
  plansRef,
  where('patientId', '==', patientId),
  orderBy('acceptedAt', 'desc'),
  limit(1)  // Solo el más reciente
);
```

**⚠️ PROBLEMA IDENTIFICADO:**
- La query **NO filtra por `authorUid`**
- Esto puede violar PHIPA/PIPEDA si hay múltiples fisioterapeutas
- Necesita corrección para seguridad

---

### 3. **VISUALIZACIÓN DEL PLAN (UI)**

**Dónde se muestra:**
- En `AnalysisTab.tsx` (pestaña "Analysis" del workflow)
- Se muestra en la sección "Today's Plan" cuando hay `previousTreatmentPlan`

**Información mostrada:**
1. **Focus for today** (más importante):
   - Muestra `previousTreatmentPlan.nextSessionFocus`
   - Ejemplo: "Reassess grip strength and pain levels, evaluate exercise progression"

2. **Interventions**:
   - Muestra hasta 3 intervenciones
   - Ejemplo: "Progress UCL exercises", "Add resistance", "Continue manual therapy"

3. **Modalities**:
   - Muestra modalidades prescritas
   - Ejemplo: "TENS, US"

4. **Home Exercises**:
   - Muestra hasta 2 ejercicios
   - Ejemplo: "Progress UCL exercises with resistance", "Continue ROM exercises"

5. **Goals**:
   - Muestra hasta 2 objetivos
   - Ejemplo: "Increase grip strength to 10kg", "Maintain current progress"

**Código UI:**
```typescript
// src/components/workflow/tabs/AnalysisTab.tsx (línea 410-480)
{previousTreatmentPlan && (
  <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
    {/* Next Session Focus - Most Important */}
    {previousTreatmentPlan.nextSessionFocus && (
      <div>
        <p className="text-xs font-semibold text-emerald-700">Focus for today:</p>
        <p className="text-xs text-slate-700">
          {previousTreatmentPlan.nextSessionFocus}
        </p>
      </div>
    )}
    
    {/* Interventions, Modalities, Home Exercises, Goals */}
    ...
  </div>
)}
```

---

### 4. **ACTUALIZACIÓN DEL PLAN (Después de la Terapia)**

**Cuándo se actualiza:**
- Cuando se **finaliza el nuevo SOAP** de follow-up
- Se guarda un **nuevo documento** en `treatment_plans` (no se actualiza el anterior)
- El nuevo plan se convierte en el "más reciente" para la próxima sesión

**Flujo:**
1. Fisioterapeuta ve el plan anterior en "Today's Plan"
2. Realiza la terapia según el plan
3. Genera nuevo SOAP con actualizaciones del plan
4. Finaliza el SOAP → se guarda nuevo plan
5. **Próxima sesión** → se carga el nuevo plan (más reciente)

**Ventaja:**
- ✅ Historial completo de planes (cada sesión tiene su plan)
- ✅ El fisioterapeuta siempre ve el plan más reciente
- ✅ Puede ver evolución del plan a lo largo del tiempo

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. **Seguridad: Query sin `authorUid`**

**Problema:**
```typescript
// ❌ ACTUAL: No filtra por authorUid
const q = query(
  plansRef,
  where('patientId', '==', patientId),
  orderBy('acceptedAt', 'desc'),
  limit(1)
);
```

**Riesgo:**
- Si múltiples fisioterapeutas tienen el mismo paciente, podrían ver planes de otros
- Viola PHIPA/PIPEDA (acceso no autorizado)

**Solución necesaria:**
```typescript
// ✅ CORRECTO: Filtrar por authorUid
const q = query(
  plansRef,
  where('patientId', '==', patientId),
  where('authorUid', '==', currentUser.uid),  // ✅ Agregar este filtro
  orderBy('acceptedAt', 'desc'),
  limit(1)
);
```

---

### 2. **Índice Compuesto Faltante**

**Problema:**
- La query requiere índice compuesto: `(patientId, authorUid, acceptedAt desc)`
- Actualmente no existe en `firestore.indexes.json`

**Solución necesaria:**
- Agregar índice a `firestore.indexes.json`
- Deploy con `firebase deploy --only firestore:indexes`

---

## ✅ MEJORAS PROPUESTAS

### 1. **Corregir Query de Seguridad**

```typescript
// src/services/treatmentPlanService.ts
async getTreatmentPlan(patientId: string): Promise<TreatmentPlan | null> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }
    
    const plansRef = collection(db, this.COLLECTION_NAME);
    const q = query(
      plansRef,
      where('patientId', '==', patientId),
      where('authorUid', '==', currentUser.uid),  // ✅ Agregar filtro de seguridad
      orderBy('acceptedAt', 'desc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as TreatmentPlan;
  } catch (error) {
    console.error('Error fetching treatment plan:', error);
    return null;
  }
}
```

### 2. **Agregar Índice Compuesto**

```json
// firestore.indexes.json
{
  "collectionGroup": "treatment_plans",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "patientId", "order": "ASCENDING" },
    { "fieldPath": "authorUid", "order": "ASCENDING" },
    { "fieldPath": "acceptedAt", "order": "DESCENDING" }
  ]
}
```

### 3. **Mejorar Visualización del Plan**

**Sugerencia:**
- Mostrar fecha del plan anterior: "Plan from Jan 15, 2026"
- Mostrar plan completo en tooltip o modal expandible
- Agregar botón "View Full Plan" para ver todo el texto

---

## 📊 RESUMEN DEL FLUJO

```
┌─────────────────────────────────────────────────────────┐
│ 1. INITIAL ASSESSMENT                                    │
│    - Fisio genera SOAP con plan                         │
│    - Finaliza SOAP → Guarda plan en treatment_plans     │
│    - Plan incluye: interventions, modalities, goals,     │
│      nextSessionFocus                                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. FOLLOW-UP VISIT (Siguiente sesión)                   │
│    - Sistema detecta follow-up                          │
│    - Carga plan más reciente (getTreatmentPlan)         │
│    - Muestra en "Today's Plan":                         │
│      • Focus for today (nextSessionFocus)               │
│      • Interventions                                    │
│      • Modalities                                        │
│      • Home Exercises                                    │
│      • Goals                                            │
│    - Fisio ve qué hacer sin tener que recordar          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. DURANTE LA TERAPIA                                    │
│    - Fisio realiza intervenciones según plan            │
│    - Evalúa progreso                                    │
│    - Genera nuevo SOAP con actualizaciones               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. FINALIZACIÓN                                          │
│    - Finaliza nuevo SOAP → Guarda nuevo plan            │
│    - Nuevo plan incluye actualizaciones:                │
│      • Nuevas intervenciones                            │
│      • Progresiones de ejercicios                        │
│      • Nuevo nextSessionFocus para próxima sesión       │
│    - Próxima sesión cargará este nuevo plan             │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 CUMPLIMIENTO PHIPA/PIPEDA

**Actual:**
- ⚠️ Query no filtra por `authorUid` (riesgo de acceso no autorizado)

**Después de corrección:**
- ✅ Solo el autor puede ver sus propios planes
- ✅ Reglas de Firestore ya requieren `authorUid == auth.uid`
- ✅ Cumple PHIPA s.10(1) y PIPEDA Principle 4.7.1

---

**Generado:** 2026-01-21  
**Estado:** ✅ FUNCIONAL - Requiere corrección de seguridad
