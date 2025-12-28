# Inventory: Personalization System (Onboarding + Profile + Prompting + Memory)

**Fecha:** 2025-12-23  
**Objetivo:** Mapear estado actual del sistema de personalización antes de implementar mejoras

---

## A. Onboarding - Dónde vive hoy

### Rutas/Páginas

1. **`src/pages/ProfessionalOnboardingPage.tsx`** (Principal)
   - Ruta: `/professional-onboarding` (inferido)
   - Componente principal de captura de datos profesionales
   - Wizard de 3 pasos: Personal → Profesional → Compliance

2. **`src/pages/OnboardingPage.tsx`** (Legacy/Alternativo)
   - Ruta: `/onboarding` (inferido)
   - Formulario de registro general

3. **`src/pages/OnboardingConfirmationPage.tsx`**
   - Página de confirmación post-onboarding

4. **`src/pages/ResumeOnboardingPage.tsx`**
   - Permite retomar onboarding incompleto

### Componentes Principales

- **`src/components/wizard/onboardingConstants.ts`** - Constantes y configuración del wizard
- **`src/_deprecated/features_onboarding/`** - Versiones deprecadas (no usar)

### Datos Capturados (Shape)

**ProfessionalOnboardingPage.tsx** captura:

```typescript
{
  // Paso 1: Información Personal
  firstName: string;
  secondName: string;
  lastName: string;
  secondLastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseIssueDate: string;
  licenseRenewalType: 'annual' | 'biennial' | 'other';
  licenseRenewalPeriod: number; // meses
  country: string;
  state: string;
  city: string;
  licenseExpiryNotification: boolean;

  // Paso 2: Información Profesional
  profession: string; // Dropdown
  specialty: string; // Texto libre
  certifications: string; // Texto libre
  yearsOfExperience: number;

  // Paso 3: Compliance
  hipaaConsent: boolean;
  gdprConsent: boolean;
  dataProcessingConsent: boolean;
  auditTrailEnabled: boolean;
  mfaEnabled: boolean;
  licenseNotifications: boolean;
  latamConsent: boolean;
  canadaConsent: boolean;
  pipedaConsent: boolean;
}
```

### Persistencia (Firestore)

**NO se guarda directamente en Firestore desde ProfessionalOnboardingPage.**

El flujo actual:
1. `ProfessionalOnboardingPage.tsx` mapea datos a estructura de `ProfessionalProfileService`
2. Llama a `ProfessionalProfileService.getInstance().createProfile(mappedProfileData)`
3. **`ProfessionalProfileService.ts`** (línea 232) guarda en **Map en memoria** (`this.profiles.set(id, profile)`)
4. **NO hay persistencia Firestore** en este servicio (solo memoria)

**Alternativa encontrada:**
- **`src/context/ProfessionalProfileContext.tsx`** (línea 143) guarda en Firestore:
  - Collection: `users`
  - Document: `{uid}`
  - Shape: `ProfessionalProfile` (ver sección B)

**EmailActivationService** (registro alternativo):
- Collection: `users` (inferido de `setDoc(userDoc, ...)`)
- Document: `{userId}`
- Shape: `ProfessionalRegistration` (incluye `mskSkills`, `experienceYears`, `university`, etc.)

---

## B. Profile - Dónde vive hoy

### Modelos de Datos (Múltiples Implementaciones)

#### 1. `src/types/professionalProfile.ts` (Type Definition)
```typescript
interface ProfessionalProfile {
  id?: string;
  userId: string;
  personalInfo: { firstName, lastName, email, phone, dateOfBirth };
  professionalInfo: { profession, specialization, licenseNumber, country, yearsOfExperience, institution };
  complianceInfo: { gdprConsent, dataProcessingConsent, mfaEnabled, hipaaConsent, latamConsent, canadaConsent, pipedaConsent };
  timestamps: { createdAt, updatedAt, emailVerifiedAt };
  status: { isActive, isEmailVerified, isProfileComplete };
}
```

#### 2. `src/context/ProfessionalProfileContext.tsx` (Contexto React - Firestore)
```typescript
interface ProfessionalProfile {
  uid: string;
  email: string;
  displayName?: string;
  fullName?: string;
  role?: 'physio' | 'admin' | 'assistant';
  specialty?: string;
  professionalTitle?: string;
  university?: string;
  licenseNumber?: string;
  workplace?: string;
  experienceYears?: string;
  clinic?: { name?, city?, country? };
  timezone?: string;
  languages?: string[];
  phone?: string;
  country?: string;
  province?: string;
  city?: string;
  consentGranted?: boolean;
  preferredSalutation?: string;
  lastNamePreferred?: string;
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
  lastSeenAt?: Timestamp;
  preferences?: { theme: 'inside' | 'outside', density: 'comfortable' | 'compact' };
  registrationStatus?: 'incomplete' | 'complete';
}
```

**Persistencia:**
- Collection: `users`
- Document: `{uid}`
- Guardado en: `src/context/ProfessionalProfileContext.tsx:143` (`setDoc(doc(db, 'users', uid), ...)`)
- Actualización: `src/context/ProfessionalProfileContext.tsx:161, 184, 192, 225`

#### 3. `src/services/ProfessionalProfileService.ts` (Service - Memoria)
```typescript
interface ProfessionalProfile {
  id: string;
  license: string;
  country: string;
  city: string;
  state?: string;
  specialties: string[];
  certifications: string[];
  practiceType: 'clínica' | 'hospital' | 'consultorio' | 'domicilio';
  licenseExpiry: Date;
  isActive: boolean;
  complianceSettings: ComplianceSettings;
  createdAt: Date;
  updatedAt: Date;
}
```

**Persistencia:** Solo en memoria (`Map<string, ProfessionalProfile>`), NO Firestore

#### 4. `src/core/services/ProfessionalProfileService.ts` (Core Service - Firestore)
```typescript
// Usa ProfessionalProfile de src/core/domain/professionalType.ts
// Collection: 'professional_profiles'
// Document: `prof_{timestamp}_{random}`
// Incluye cifrado de datos sensibles y auditoría
```

**Persistencia:**
- Collection: `professional_profiles`
- Document: `prof_{timestamp}_{random}`
- Guardado en: `src/core/services/ProfessionalProfileService.ts:62` (`setDoc(docRef, ...)`)
- Incluye: cifrado, auditoría, versionado (metadata.version)

### Versionado

**Solo en `src/core/services/ProfessionalProfileService.ts`:**
- `metadata.version: number` (inicia en 1)
- `metadata.updatedAt: Date`
- `metadata.createdAt: Date`

**NO hay versionado en:**
- `ProfessionalProfileContext` (users collection)
- `ProfessionalProfileService` (memoria)

### Hooks/Servicios de Acceso

- **`src/hooks/useProfessionalProfile.ts`** - Hook para acceder al contexto
- **`src/context/ProfessionalProfileContext.tsx`** - Provider React
- **`src/services/ProfessionalProfileService.ts`** - Service singleton (memoria)
- **`src/core/services/ProfessionalProfileService.ts`** - Service core (Firestore con cifrado)

---

## C. Prompting Pipeline - Dónde vive hoy

### Funciones que Construyen Prompts

#### 1. `src/core/ai/PromptFactory-Canada.ts` (Principal - Canadá)
**Función:** `buildCanadianPrompt(params: CanadianPromptParams): string`

**Inputs:**
```typescript
{
  contextoPaciente: string;
  instrucciones?: string;
  transcript: string;
  professionalProfile?: ProfessionalProfile | null; // ← INYECCIÓN DE PROFILE
  visitType?: 'initial' | 'follow-up';
}
```

**Dónde se inyecta profile:**
- Línea 95-114: `buildCapabilityContext(professionalProfile)` - Deriva seniority, domainFocus, languageTone
- Línea 116-171: `buildProfessionalContext(professionalProfile)` - Construye contexto con specialty, title, experience, clinic, license
- Línea 180-181: Se agrega al prompt final como `[Clinician Capability Context]` y `[Clinician Profile]`

**Output:** String de prompt completo con header, capability context, professional context, visit type, patient context, instructions, transcript

#### 2. `src/core/ai/PromptFactory-v3.ts` (Wrapper)
**Función:** `PromptFactory.create(params)`

Wrapper que llama a `CanadianPromptFactory.create()` con los mismos parámetros.

#### 3. `src/core/prompts/v3/builders/buildPromptV3.ts` (V3 Builder)
**Función:** `buildPromptV3(args: { flags: IntentFlags, context: {...} }): string`

**Inputs:** NO incluye `professionalProfile` (solo flags y context básico)

**Output:** Template `DECIDE_TREATMENT_FOLLOWUP_LOW`

#### 4. `src/core/ai/promptBrain/ca/PromptBrainCA.ts`
**Función:** `buildCanadianSystemPrompt(context: PromptBrainContext): string`

**Inputs:** `PromptBrainContext` con `caseFamily`, etc. (NO incluye profile directamente)

#### 5. `src/core/soap/SOAPPromptFactory.ts` / `src/core/soap/FollowUpSOAPPromptBuilder.ts`
Builders para prompts SOAP (no revisados en detalle)

### Dónde se Llama al Modelo

**Búsqueda de llamadas a Vertex/Assistant:**
- `src/core/assistant/` - Assistant adapter (no implementado completamente según tests)
- `src/services/OptimizedClinicalBrainService.ts` - Usa `ProfessionalProfileService` para obtener profile (línea 332)
- `src/services/KnowledgeBaseService.ts` - Usa `ProfessionalProfileService` para obtener profile (líneas 341, 390, 449, 484)

### Flujo Actual de Inyección

1. **Profile se obtiene de:**
   - `ProfessionalProfileContext` (React context) → `useProfessionalProfile()`
   - O `ProfessionalProfileService.getInstance().getProfile(profileId)` (memoria)

2. **Profile se pasa a:**
   - `buildCanadianPrompt({ professionalProfile, ... })`
   - `buildCapabilityContext(profile)` → Deriva capabilities
   - `buildProfessionalContext(profile)` → Construye texto de contexto

3. **Se inyecta en prompt como:**
   - `[Clinician Capability Context]` (seniority, domain, tone)
   - `[Clinician Profile]` (specialty, title, experience, clinic, license)

4. **Se envía a modelo:**
   - Vertex AI / Assistant (a través de adapter, no completamente implementado)

---

## D. Memoria / Perfil - Dónde vive hoy

### Patient Memory / Episode Memory

#### 1. Episodes (Episodios de Tratamiento)

**`src/repositories/episodesRepo.ts`** (Repository)
```typescript
interface Episode {
  id: string;
  patientId: string;
  ownerUid: string;
  status: 'active' | 'completed' | 'cancelled';
  reason: string;
  diagnosis?: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  expectedDuration?: number; // semanas
  currentWeek?: number;
  totalWeeks?: number;
  goals?: { shortTerm, longTerm, milestones };
  progress?: { painLevel, functionalScore, lastAssessment };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Persistencia:**
- Collection: `episodes` (línea 66)
- Queries: Por `patientId` + `status='active'`

**`src/services/episodeService.ts`** (Service - Hospital/Inpatient)
```typescript
interface Episode {
  episodeId: string; // EP-20251127-001
  patientTraceNumber: string; // AUX-HSC-789234
  patientId?: string;
  physiotherapistId: string;
  hospitalId: string;
  status: 'admitted' | 'discharged' | 'transferred';
  episodeType: 'inpatient' | 'outpatient' | 'mixed';
  dates: { admissionDate, dischargeDate, transferDate };
  access: { currentPortal, inpatientUrl, outpatientUrl, canAccessInpatient, canAccessOutpatient };
  notes: { count, noteIds };
  metadata: { ward, roomNumber, diagnosis, transferReason };
  audit: { createdBy, lastModified, accessLog };
}
```

**Persistencia:**
- Collection: `patient_episodes` (línea 90)

#### 2. Patient Data (Datos de Paciente)

**`src/repositories/patientsRepo.ts`** (Repository)
- Collection: `patients`
- Document: `{patientId}`
- Incluye: datos demográficos, historial médico, alergias, medicamentos

**`src/services/patientService.ts`** (Service)
```typescript
interface Patient {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  medicalHistory: string;
  allergies: string;
  medications: string;
  previousInjuries: string;
  referringPhysician: string;
  // ... más campos
}
```

**Persistencia:**
- Collection: `patients` (inferido)

#### 3. Session Memory (Memoria de Sesión)

**`src/services/session-storage.ts`** (LocalStorage)
- Guarda en `localStorage` con key `aidux_{patientId}`
- Incluye: `timestamp`, `version: '1.0'`
- NO persiste en Firestore

**`src/services/feedbackService.ts`** (Contexto de Sesión)
- Obtiene contexto de `localStorage.getItem('aidux_{patientId}')`
- Incluye: `patientType`, `visitNumber`, `sessionType`

#### 4. Follow-up Detection

**`src/services/followUpDetectionService.ts`** (Service)
- Detecta si una visita es follow-up vs initial
- Usado para ajustar prompts (visitType: 'initial' | 'follow-up')

### Versionado de Memoria

**NO hay versionado explícito de:**
- Patient summaries
- Episode plans
- Session context

**Solo versionado implícito:**
- `Episode.createdAt` / `updatedAt` (timestamps)
- `localStorage` session data con `version: '1.0'` (hardcoded)

### Clinical Vault / Delta Mechanism

**NO se encontró:**
- "Clinical Vault" como concepto explícito
- "Delta mechanism" para follow-ups
- "Plan-based" memory system

**Lo que SÍ existe:**
- Episodes con goals y progress tracking
- Session storage en localStorage
- Follow-up detection service

---

## Resumen de Archivos Clave

### Onboarding
- `src/pages/ProfessionalOnboardingPage.tsx` - Wizard principal
- `src/services/ProfessionalProfileService.ts` - Service (memoria)
- `src/context/ProfessionalProfileContext.tsx` - Contexto React (Firestore: `users/{uid}`)

### Profile
- `src/types/professionalProfile.ts` - Type definition
- `src/context/ProfessionalProfileContext.tsx` - Contexto React (Firestore: `users/{uid}`)
- `src/services/ProfessionalProfileService.ts` - Service memoria
- `src/core/services/ProfessionalProfileService.ts` - Service core (Firestore: `professional_profiles/{id}`)

### Prompting
- `src/core/ai/PromptFactory-Canada.ts` - Builder principal (inyecta profile)
- `src/core/ai/PromptFactory-v3.ts` - Wrapper
- `src/core/ai/capabilities/deriveProfessionalCapabilities.ts` - Deriva capabilities de profile
- `src/core/prompts/v3/builders/buildPromptV3.ts` - Builder V3 (NO usa profile)

### Memoria
- `src/repositories/episodesRepo.ts` - Episodes repository (Firestore: `episodes`)
- `src/services/episodeService.ts` - Episode service (Firestore: `patient_episodes`)
- `src/repositories/patientsRepo.ts` - Patients repository (Firestore: `patients`)
- `src/services/patientService.ts` - Patient service
- `src/services/session-storage.ts` - Session localStorage
- `src/services/followUpDetectionService.ts` - Follow-up detection

---

## Notas Importantes

1. **Múltiples implementaciones de Profile:** Hay 4 definiciones diferentes de `ProfessionalProfile` en distintos archivos. No hay un "source of truth" único.

2. **Persistencia fragmentada:** 
   - Onboarding guarda en `ProfessionalProfileService` (memoria) pero NO en Firestore
   - `ProfessionalProfileContext` guarda en Firestore `users/{uid}`
   - `core/services/ProfessionalProfileService` guarda en Firestore `professional_profiles/{id}`

3. **Profile en Prompts:** Solo `PromptFactory-Canada.ts` inyecta profile actualmente. `buildPromptV3` NO lo usa.

4. **Memoria de Paciente:** Existe en episodios y pacientes, pero NO hay "patient memory" o "episode memory" como sistema explícito de resúmenes/contexto persistido.

5. **Versionado:** Solo existe en `core/services/ProfessionalProfileService` (metadata.version), NO en otros sistemas.

