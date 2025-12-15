# Onboarding Wizard → Professional Profile Audit

**Fecha:** 2025-12-15  
**Request:** Mapeo del onboarding wizard para WO de prompting capability-aware  
**Prioridad:** Alta (bloquea WO de prompting modularización)

---

## 1️⃣ LOCALIZACIÓN DEL ONBOARDING WIZARD

### Archivo Principal (CANÓNICO)
- **Ruta:** `src/pages/OnboardingPage.tsx`
- **Estado:** ✅ Activo (marcado como CANONICAL en comentarios línea 1-8)
- **Lenguaje:** English
- **Estructura:** 3-step wizard
- **Compliance:** PHIPA/PIPEDA compliant

### Componentes del Wizard

1. **PersonalDataStep** (`src/components/wizard/PersonalDataStep.tsx`)
   - Paso 1: "Personal details"

2. **ProfessionalDataStep** (`src/components/wizard/ProfessionalDataStep.tsx`)
   - Paso 2: "Professional profile" / "Professional credentials"

3. **LocationDataStep** (`src/components/wizard/LocationDataStep.tsx`)
   - Paso 3: "Compliance review"

### Rutas

Verificar en `src/router/router.tsx` (no leído aún, pero wizard está activo según código)

### Roles que lo usan

- **`role?: 'physio' | 'admin' | 'assistant'`** (definido en `ProfessionalProfile`)
- El wizard NO distingue roles durante el onboarding
- Todos los registros se tratan como profesionales

---

## 2️⃣ SCHEMA COMPLETO DEL WIZARD

### Types definidos (`src/types/wizard.ts`)

```typescript
export interface PersonalData {
  firstName: string;
  secondName?: string;
  lastName: string;
  secondLastName?: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  birthDate?: string;
  gender?: string;
  password?: string;
  confirmPassword?: string;
  // NOTA: También valida country, province, city en paso "personal"
}

export interface ProfessionalData {
  professionalTitle: string;     // ✅ OBLIGATORIO
  specialty: string;              // ✅ OBLIGATORIO
  specialtyOther?: string;        // ❌ No se usa (campo no renderizado)
  university?: string;            // ✅ OBLIGATORIO (validado pero opcional en type)
  licenseNumber: string;          // ✅ OBLIGATORIO
  workplace?: string;             // ✅ OBLIGATORIO (validado pero opcional en type)
  experienceYears: number;        // ✅ OBLIGATORIO
}

export interface LocationData {
  country: string;                // ✅ OBLIGATORIO
  province: string;               // ✅ OBLIGATORIO
  city: string;                   // ✅ OBLIGATORIO
  phipaConsent?: boolean;         // ✅ OBLIGATORIO (validado)
  pipedaConsent?: boolean;        // ✅ OBLIGATORIO (validado)
}
```

### Campos capturados en el paso "Professional"

**Campos obligatorios (validados):**
1. `professionalTitle` - Texto libre (placeholder: "Physiotherapist, MD, Psychologist…")
2. `specialty` - Texto libre (placeholder: "Pelvic health, Neurology, Sports…")
3. `university` - Texto libre (placeholder: "University of Toronto")
4. `licenseNumber` - Texto libre (placeholder: "CPO-000000")
5. `workplace` - Texto libre (placeholder: "AiduxCare Niagara")
6. `experienceYears` - Number (min: 0)

**Campos NO capturados (que podrían ser útiles para capability-aware):**
- ❌ **Subespecialidades** (solo hay `specialty` principal)
- ❌ **Áreas de foco** (solo specialty general)
- ❌ **Habilidades específicas** (manual therapy, exercise, neuro, etc.)
- ❌ **Tipo de práctica** (clínica privada vs hospital vs domicilio)
- ❌ **Preferencias de estilo** (densidad, profundidad de análisis)
- ❌ **Certificaciones** (no se capturan en wizard)
- ❌ **Comfort level con técnicas específicas**

---

## 3️⃣ PERSISTENCIA (CRÍTICO)

### Dónde se guarda

**Colección:** `users`  
**Document ID:** `{uid}` (generado por `emailActivationService.generateProfessionalId()`)

### Función de guardado

`emailActivationService.registerProfessional()` (líneas 63-210 de `emailActivationService.ts`)

### Flujo de persistencia

1. **OnboardingPage.tsx** → `finish()` (línea 165)
   - Combina datos de los 3 pasos
   - Llama a `emailActivationService.registerProfessional()`

2. **emailActivationService.registerProfessional()**
   - Crea usuario en Firebase Auth
   - Guarda en Firestore: `doc(db, 'users', professionalId)`
   - Estructura del documento (líneas 103-118):

```typescript
const firestoreData = {
  ...professional,  // Spread del objeto ProfessionalRegistration
  registrationDate: ISO string,
  createdAt: ISO string,
  updatedAt: ISO string,
  activationToken: string,
  tokenExpiry: ISO string,
  isPilotUser: boolean,
  pilotPhase?: string,
  lastLogin?: ISO string (si existe)
};
```

### Estructura del documento Firestore (ejemplo anonimizado)

**Documento:** `users/{uid}`

```json
{
  "id": "generated-professional-id",
  "email": "prof@example.com",
  "displayName": "John Doe",
  "professionalTitle": "Physiotherapist",
  "specialty": "Musculoskeletal",
  "country": "Canada",
  "city": "Toronto",
  "province": "Ontario",
  "phone": "+1...",
  "licenseNumber": "CPO-123456",
  "registrationDate": "2025-12-15T...",
  "activationToken": "...",
  "tokenExpiry": "...",
  "isActive": false,
  "emailVerified": false,
  "createdAt": "...",
  "updatedAt": "...",
  "isPilotUser": true,
  "pilotPhase": "pilot_1"
}
```

**NOTA:** Los campos `university`, `workplace`, `experienceYears` **NO aparecen en la interfaz `ProfessionalRegistration`** del `emailActivationService`, pero **SÍ se pasan** desde `OnboardingPage.tsx` (líneas 184-190). Necesito verificar si se guardan o se pierden.

### Verificación de campos guardados

**Campos pasados desde OnboardingPage.tsx (línea 178-191):**
- ✅ `email`
- ✅ `password` (usado solo para crear Auth, no se guarda)
- ✅ `firstName`, `lastName` (combinados en `displayName`)
- ✅ `phone`
- ✅ `professionalTitle`
- ✅ `specialty`
- ✅ `licenseNumber`
- ✅ `workplace` ← **¿Se guarda?**
- ✅ `country`, `province`, `city`

**Campos NO pasados pero capturados en wizard:**
- ❌ `university` ← **NO se pasa a `registerProfessional()`**
- ❌ `experienceYears` ← **NO se pasa a `registerProfessional()`**

**GAP CRÍTICO:** `university` y `experienceYears` se capturan pero **no se persisten**.

**Verificación de interface `ProfessionalRegistration`:**
La interface `ProfessionalRegistration` (líneas 16-34 de `emailActivationService.ts`) NO incluye `university` ni `experienceYears` en sus campos obligatorios. El spread `...professional` en línea 104 solo incluye los campos definidos en la interface.

**Confirmación:** `university` y `experienceYears` **NO se persisten** en el documento Firestore.

### Source of Truth

**✅ SÍ:** El documento `users/{uid}` en Firestore es el source of truth  
**✅ SÍ:** Se versiona con `updatedAt`  
**❌ NO:** No hay versionado histórico explícito

---

## 4️⃣ CONSUMO ACTUAL

### ProfessionalProfileContext

**Ubicación:** `src/context/ProfessionalProfileContext.tsx`

**Carga desde:**
```typescript
const userDoc = await getDoc(doc(db, 'users', uid));
const userData = userDoc.data() as ProfessionalProfile;
setProfile(userData);
```

**Hook disponible:**
- `useProfessionalProfile()` - Expone el profile completo

### Interface ProfessionalProfile (lo que lee el context)

```typescript
export interface ProfessionalProfile {
  uid: string;
  email: string;
  displayName?: string;
  fullName?: string;
  role?: 'physio' | 'admin' | 'assistant';
  specialty?: string;                    // ✅ Existe
  professionalTitle?: string;            // ✅ Existe
  university?: string;                   // ✅ Existe (pero puede no estar persistido)
  licenseNumber?: string;                // ✅ Existe
  workplace?: string;                    // ✅ Existe
  experienceYears?: string;              // ✅ Existe (pero puede no estar persistido)
  clinic?: { 
    name?: string; 
    city?: string; 
    country?: string 
  };
  // ... otros campos
}
```

### Uso en PromptFactory

**Ubicación:** `src/core/ai/PromptFactory-Canada.ts`

**Función:** `buildProfessionalContext(profile?: ProfessionalProfile | null)`

**Campos usados:**
- ✅ `profile.specialty`
- ✅ `profile.professionalTitle`
- ✅ `profile.experienceYears`
- ✅ `profile.clinic?.name` (fallback a `profile.workplace`)
- ✅ `profile.licenseNumber`

**Campos NO usados pero disponibles:**
- ❌ `profile.university`
- ❌ `profile.role`
- ❌ `profile.country`, `profile.province`, `profile.city`

### Uso en Analytics

**Ubicación:** `src/services/analyticsService.ts`

**Campos usados:**
- ✅ `specialty` (líneas 254-256, 333-334)

### Otros consumos

- **KnowledgeBaseService:** Usa `professionalProfileId` para obtener perfil
- **PhysiotherapyPipelineService:** Tiene su propia interface `ProfessionalProfile` (diferente)

---

## 5️⃣ GAP ANALYSIS

### GAP 1: Campos capturados pero NO persistidos

**Crítico:**
- ❌ `university` - Se captura en wizard pero NO se pasa a `registerProfessional()`
- ❌ `experienceYears` - Se captura en wizard pero NO se pasa a `registerProfessional()`

**Impacto:**
- El prompt no puede usar `experienceYears` para ajustar profundidad
- No hay forma de distinguir junior vs senior para capability-aware output

### GAP 2: Campos necesarios para capability-aware pero NO capturados

**Críticos para WO de prompting:**
- ❌ **Subespecialidades / áreas de foco** (solo hay `specialty` principal)
  - Ejemplo: "MSK" vs "MSK + Sports + Manual Therapy"
- ❌ **Habilidades declaradas**
  - `comfortWithManualTherapy?: 'low' | 'medium' | 'high'`
  - `comfortWithExercise?: 'low' | 'medium' | 'high'`
  - `comfortWithNeuro?: 'low' | 'medium' | 'high'`
- ❌ **Tipo de práctica** (no existe explícito)
  - Inferido desde `workplace` pero no es claro
  - Podría ser: `practiceType?: 'clinic' | 'hospital' | 'private' | 'mobile'`
- ❌ **Preferencias de profundidad**
  - `analysisDepth?: 'concise' | 'standard' | 'comprehensive'`
  - `preferredDetailLevel?: 'brief' | 'moderate' | 'detailed'`

### GAP 3: Campos existentes pero NO usados en prompt

**Disponibles en `ProfessionalProfile` pero NO en `buildProfessionalContext`:**
- ❌ `university` (si estuviera persistido)
- ❌ `role` (physio/admin/assistant)
- ❌ `country`, `province`, `city` (geografía)
- ❌ `languages`
- ❌ `preferences` (theme, density)

**Oportunidad:**
- `role` podría ajustar el tipo de output
- `languages` podría afectar el idioma del prompt
- `preferences.density` podría indicar preferencia de concisión

### GAP 4: Inconsistencias entre servicios

**Diferentes interfaces `ProfessionalProfile`:**
1. `src/context/ProfessionalProfileContext.tsx` (el que usa PromptFactory) ✅
2. `src/services/PhysiotherapyPipelineService.ts` (local, diferente)
3. `src/services/ProfessionalProfileService.ts` (local, diferente)

**Impacto:**
- Confusión sobre cuál es el source of truth
- Riesgo de usar interface incorrecta

---

## 6️⃣ RESUMEN EJECUTIVO

### ✅ Lo que SÍ funciona

1. Wizard canónico activo (`OnboardingPage.tsx`)
2. Persistencia en `users/{uid}` en Firestore
3. `ProfessionalProfileContext` lee desde Firestore
4. `PromptFactory-Canada.ts` usa el profile del context
5. Campos básicos llegan al prompt: `specialty`, `professionalTitle`, `licenseNumber`, `workplace`

### ❌ Lo que NO funciona / Gaps

1. **`university` y `experienceYears` se capturan pero NO se persisten** ← CRÍTICO
2. **No hay campos para capability-aware** (subspecialties, skills, practice type, comfort levels)
3. **Campos disponibles pero no usados** (`role`, `languages`, `preferences`)
4. **Inconsistencias en interfaces** entre servicios

### 🎯 Acciones requeridas antes del WO

**CRÍTICO:**
1. Verificar si `university` y `experienceYears` se guardan realmente (auditar Firestore real)
2. Si NO se guardan: corregir `emailActivationService.registerProfessional()` para persistirlos
3. Si SÍ se guardan pero el context no los lee: verificar el mapeo en `ProfessionalProfileContext`

**IMPORTANTE:**
4. Decidir si agregar campos capability-aware al wizard ahora o en WO posterior
5. Unificar interfaces `ProfessionalProfile` (eliminar duplicados)

---

## 7️⃣ PRÓXIMOS PASOS RECOMENDADOS

### Fase 1: Auditoría Firestore Real (INMEDIATO)

```bash
# Conectar a Firestore y verificar un documento real
# Documento: users/{uid}
# Verificar si contienen:
# - university
# - experienceYears
# - workplace
```

### Fase 2: Fix Persistencia (si aplica)

Si `university` y `experienceYears` NO se persisten:
- Modificar `emailActivationService.registerProfessional()` para incluirlos
- Verificar que `ProfessionalProfileContext` los lea correctamente

### Fase 3: Diseño WO Capability-Aware

Una vez confirmado el estado real:
- Decidir qué campos agregar al wizard
- Decidir qué campos usar del profile existente
- Diseñar el "context contract" que ajuste output según capacidades

---

## 📝 NOTAS FINALES

- **Este audit es PRE-IMPLEMENTACIÓN**
- **No hacer cambios aún**
- **Validar con datos reales de Firestore antes de diseñar el WO**

---

**Documento generado:** 2025-12-15  
**Para:** Equipo implementador  
**Objetivo:** Mapeo completo del onboarding → profile → prompt system

