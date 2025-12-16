# Prompt Professional Context: Estado Actual

**Para:** WO de modularización y capability-aware output  
**Fecha:** 2025-12-15

---

## 1️⃣ FUNCIÓN QUE CONSTRUYE EL CONTEXTO PROFESIONAL

### `buildProfessionalContext` (líneas 90-145 de `PromptFactory-Canada.ts`)

```typescript
const buildProfessionalContext = (profile?: ProfessionalProfile | null): string => {
  if (!profile) {
    console.log('🔍 [PROMPT] No professional profile provided');
    return '';
  }
  
  console.log('🔍 [PROMPT] Building professional context from profile:', {
    specialty: profile.specialty,
    professionalTitle: profile.professionalTitle,
    experienceYears: profile.experienceYears,
    clinic: profile.clinic?.name,
    workplace: profile.workplace,
    licenseNumber: profile.licenseNumber
  });
  
  const parts: string[] = [];
  
  // Specialty
  if (profile.specialty) {
    parts.push(`Specialty: ${profile.specialty}`);
  }
  
  // Professional Title
  if (profile.professionalTitle) {
    parts.push(`Title: ${profile.professionalTitle}`);
  }
  
  // Years of Experience
  if (profile.experienceYears) {
    parts.push(`Experience: ${profile.experienceYears} years`);
  }
  
  // Workplace/Clinic
  if (profile.clinic?.name) {
    parts.push(`Clinic: ${profile.clinic.name}`);
  } else if (profile.workplace) {
    parts.push(`Workplace: ${profile.workplace}`);
  }
  
  // License Number (if available)
  if (profile.licenseNumber) {
    parts.push(`License: ${profile.licenseNumber}`);
  }
  
  const context = parts.length > 0 
    ? `\n[Clinician Profile]\n${parts.join('\n')}\n`
    : '';
  
  if (context) {
    console.log('✅ [PROMPT] Professional context added:', context);
  } else {
    console.log('⚠️ [PROMPT] No professional context data available');
  }
  
  return context;
};
```

**Logs que aparecen:**
- `🔍 [PROMPT] Building professional context from profile: {...}`
- `✅ [PROMPT] Professional context added: ...`
- `⚠️ [PROMPT] No professional context data available`

---

## 2️⃣ INTERFACE ProfessionalProfile

### Definición completa (`src/context/ProfessionalProfileContext.tsx` líneas 16-50)

```typescript
export interface ProfessionalProfile {
  uid: string;
  email: string;
  displayName?: string;
  fullName?: string;
  role?: 'physio' | 'admin' | 'assistant';
  specialty?: string;                    // ← Usado en buildProfessionalContext
  professionalTitle?: string;            // ← Usado en buildProfessionalContext
  university?: string;
  licenseNumber?: string;                // ← Usado en buildProfessionalContext
  workplace?: string;                    // ← Usado en buildProfessionalContext
  experienceYears?: string;              // ← Usado en buildProfessionalContext
  clinic?: { 
    name?: string;                       // ← Usado en buildProfessionalContext
    city?: string; 
    country?: string 
  };
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
  preferences?: { 
    theme: 'inside' | 'outside'; 
    density: 'comfortable' | 'compact' 
  };
  registrationStatus?: 'incomplete' | 'complete';
}
```

**Campos actualmente usados en `buildProfessionalContext`:**
- ✅ `specialty`
- ✅ `professionalTitle`
- ✅ `experienceYears`
- ✅ `clinic?.name` (fallback a `workplace`)
- ✅ `licenseNumber`

**Campos disponibles pero NO usados:**
- ❌ `role` (physio/admin/assistant)
- ❌ `university`
- ❌ `country`, `province`, `city`
- ❌ `languages`
- ❌ `preferences`

---

## 3️⃣ IDEAS DE MODULARIZACIÓN EN DOCS

### Encontradas en `docs/`:

1. **`docs/architecture/DATA_FLOW.md` (líneas 244-247):**
   - "Siempre incluir contexto profesional en prompts de AI"
   - "Cachear contexto profesional (cambia poco frecuentemente)"

2. **`docs/architecture/CROSS_PAGE_FEEDBACK_SYSTEM.md` (líneas 37-42):**
   - "Integración en `PromptFactory` para incluir contexto profesional en prompts"
   - "Creación de Paciente → Contexto Profesional + Edad → Sugerencias de Tratamiento"

3. **`docs/strategy/COMPARACION_CEREBRO_ACTUAL_VS_EVIDENCIA_CIENTIFICA.md` (línea 182):**
   - "Optimización por especialidades"

4. **`docs/cto-briefings/DIRECTRICES_CTO_SISTEMA_ESCUCHA_CLINICA.md` (líneas 92, 219):**
   - "Patrones médicos específicos por especialidad"
   - "Personalizable: Reglas específicas por especialidad"

5. **`docs/cto-briefings/DOCUMENTO_APROBACION_CTO_MEJORA_BANDERAS_ROJAS.md` (línea 96):**
   - "Optimización específica por especialidades"

---

## 4️⃣ USO ACTUAL DEL PROMPT

### Flujo de construcción (`PromptFactory-Canada.ts` líneas 147-176):

```typescript
export const buildCanadianPrompt = ({
  contextoPaciente,
  instrucciones,
  transcript,
  professionalProfile,
  visitType = 'initial',
}: CanadianPromptParams): string => {
  const professionalContext = buildProfessionalContext(professionalProfile);
  
  // Use follow-up specific instructions if visit type is follow-up
  const defaultInstructions = visitType === 'follow-up' 
    ? DEFAULT_INSTRUCTIONS_FOLLOWUP 
    : DEFAULT_INSTRUCTIONS_INITIAL;
  
  const visitTypeContext = visitType === 'follow-up' 
    ? '\n[Visit Type: FOLLOW-UP - Focus on progress assessment and clinical continuity]\n'
    : '\n[Visit Type: INITIAL ASSESSMENT - Comprehensive clinical evaluation]\n';
  
  return `
${PROMPT_HEADER}${professionalContext}${visitTypeContext}
[Patient Context]
${contextoPaciente.trim()}

[Clinical Instructions]
${(instrucciones || defaultInstructions).trim()}

[Transcript]
${transcript.trim()}
`.trim();
};
```

**Estructura del prompt final:**
1. `PROMPT_HEADER` (fijo, ~74 líneas)
2. `professionalContext` (dinámico, puede estar vacío)
3. `visitTypeContext` (dinámico según visitType)
4. `[Patient Context]` (dinámico)
5. `[Clinical Instructions]` (dinámico)
6. `[Transcript]` (dinámico)

---

## 5️⃣ SERVICIOS QUE CARGAN/MANEJAN EL PERFIL

### Encontrados:

1. **`src/services/emailActivationService.ts`** (línea 26)
   - Tiene campo `specialty: string`

2. **`src/services/PhysiotherapyPipelineService.ts`** (líneas 39-50)
   - Interface `ProfessionalProfile` local (diferente al del context)
   - Campos: `license`, `country`, `city`, `state`, `specialties[]`, `certifications[]`, `practiceType`

3. **`src/services/ProfessionalProfileService.ts`** (líneas 8-22)
   - Interface `ProfessionalProfile` local (diferente al del context)
   - Campos: `id`, `license`, `country`, `city`, `state`, `specialties[]`, `certifications[]`, `practiceType`, `licenseExpiry`, `isActive`, `complianceSettings`

4. **`src/context/ProfessionalProfileContext.tsx`**
   - **Este es el que se usa en `PromptFactory-Canada.ts`**
   - Se carga desde Firestore (`users/{uid}`)
   - Hook: `useProfessionalProfile()`

5. **`src/hooks/useProfessionalProfile.ts`**
   - Hook alternativo que también lee desde Firestore
   - Mapea campos similares al context

---

## 6️⃣ NOTAS PARA EL DISEÑO FINAL

### Lo que necesitamos:

1. **Modularización del prompt:**
   - Header fijo + módulos por tab + módulos por especialidad/subespecialidad
   - Sin inflar el output (caps fijos)

2. **Capability-aware output:**
   - Ajustar profundidad según:
     - `experienceYears` (junior vs senior)
     - `specialty` (MSK, neuro, cardio, etc.)
     - `subspecialties` (no existe actualmente, pero podría agregarse)
     - `skills` (no existe actualmente)
     - `practiceSetting` (clinic vs hospital - no existe actualmente, pero `clinic?.name` o `workplace` podrían indicarlo)
     - `comfortWithManualTherapy/exercise/neuro` (no existe actualmente)

3. **Fallback limpio:**
   - Si faltan datos, no meter verbosidad ni warnings
   - Ya está implementado (retorna `''` si no hay profile)

4. **Regla crítica:**
   - El "professional context" debe afectar **prioridad y lenguaje**, no **cantidad de texto**
   - La concisión se controla con caps fijos (ya definidos en WO de concisión)
   - El contexto solo decide qué entra dentro de esos caps

---

## 📝 ARCHIVOS CLAVE

- **Prompt builder:** `src/core/ai/PromptFactory-Canada.ts`
- **Profile interface:** `src/context/ProfessionalProfileContext.tsx`
- **Profile loader:** `src/context/ProfessionalProfileContext.tsx` (Provider)
- **Profile hook:** `src/hooks/useProfessionalProfile.ts` (alternativo)

