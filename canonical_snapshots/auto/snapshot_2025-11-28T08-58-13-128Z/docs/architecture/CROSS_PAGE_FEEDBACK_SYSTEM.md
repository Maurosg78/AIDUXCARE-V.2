# Cross-Page Feedback System - Arquitectura de Retroalimentación

**Status:** 🚧 Parking Lot / Future Enhancement  
**Prioridad:** Alta (mejora significativa de UX y personalización)  
**Fecha:** 2025-11-25

---

## 🎯 Objetivo

Documentar y hacer evidentes las interacciones y retroalimentación entre diferentes páginas/componentes del sistema, especialmente aquellas que utilizan datos del perfil profesional y del paciente para personalizar la experiencia y sugerencias de tratamiento.

---

## 📋 Casos de Uso Identificados

### 1. **Onboarding Profesional → Vertex AI → Sugerencias de Tratamiento**

**Flujo:**
```
Onboarding Profesional (especialización, años experiencia, certificaciones)
    ↓
Almacenado en ProfessionalProfile (Firestore)
    ↓
Vertex AI recibe contexto del profesional en prompts
    ↓
Sugerencias de tratamiento ajustadas al perfil profesional
```

**Ejemplo:**
- Fisio especializado en ortopedia → Vertex AI sugiere tratamientos ortopédicos más específicos
- Fisio con certificación en terapia manual → Vertex AI prioriza técnicas de terapia manual
- Fisio con 15+ años experiencia → Vertex AI ofrece tratamientos más avanzados

**Implementación sugerida:**
- Servicio: `ProfessionalContextService` que extrae datos relevantes del perfil
- Integración en `PromptFactory` para incluir contexto profesional en prompts
- Documentar en `docs/ai/PROMPT_CONTEXT.md`

---

### 2. **Creación de Paciente → Contexto Profesional + Edad → Sugerencias de Tratamiento**

**Flujo:**
```
Crear Nuevo Paciente (edad, condición, historial médico)
    ↓
Combinar con ProfessionalProfile (especialización, expertise)
    ↓
Vertex AI genera sugerencias de tratamiento personalizadas
    ↓
Mostrar en Workflow Page o Command Center
```

**Ejemplo:**
- Paciente de 75 años + Fisio especializado en geriatría → Sugerencias de tratamiento geriátrico
- Paciente de 25 años + Fisio especializado en deportes → Sugerencias de tratamiento deportivo
- Paciente con condición específica + Certificación del fisio en esa área → Tratamientos más especializados

**Implementación sugerida:**
- Hook: `usePersonalizedTreatmentSuggestions(patientId, professionalId)`
- Servicio: `TreatmentSuggestionService` que combina datos de paciente y profesional
- Componente: `PersonalizedTreatmentCard` en Workflow Page

---

### 3. **Historial de Sesiones → Patrones → Sugerencias Futuras**

**Flujo:**
```
Sesiones previas del paciente
    ↓
Análisis de patrones (qué tratamientos funcionaron mejor)
    ↓
Combinar con expertise del profesional actual
    ↓
Sugerencias para próxima sesión
```

**Implementación sugerida:**
- Servicio: `SessionPatternAnalysisService`
- Integración en `CommandCenterPage` cuando se selecciona paciente con historial

---

## 🏗️ Arquitectura Propuesta

### Componentes Clave

```
┌─────────────────────────────────────────────────────────┐
│              Professional Profile Context               │
│  (Onboarding → Firestore → Context Service)            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              Patient Context                            │
│  (Create Patient → Firestore → Patient Service)        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│         Context Aggregation Service                     │
│  (Combina Professional + Patient + Session History)     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│              Vertex AI Prompt Factory                   │
│  (Incluye contexto en prompts para personalización)    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│         Personalized Suggestions                        │
│  (Treatment suggestions, session types, etc.)            │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Servicios a Crear/Mejorar

### 1. `ProfessionalContextService`
```typescript
interface ProfessionalContext {
  specialization: string;
  yearsOfExperience: number;
  certifications: string[];
  practiceType: 'CLINIC' | 'HOSPITAL' | 'PRIVATE' | 'RESEARCH' | 'TEACHING';
  patientPopulation: 'general' | 'pediatric' | 'geriatric' | 'sports' | 'neurological';
  areasOfInterest: string[];
}

class ProfessionalContextService {
  async getContext(professionalId: string): Promise<ProfessionalContext>;
  async getContextForPrompt(professionalId: string): Promise<string>;
}
```

### 2. `TreatmentSuggestionService`
```typescript
interface TreatmentSuggestion {
  treatmentType: string;
  rationale: string; // Por qué se sugiere basado en contexto
  confidence: number; // 0-1
  basedOn: {
    patientAge?: boolean;
    patientCondition?: boolean;
    professionalExpertise?: boolean;
    previousSessions?: boolean;
  };
}

class TreatmentSuggestionService {
  async getSuggestions(
    patientId: string,
    professionalId: string
  ): Promise<TreatmentSuggestion[]>;
}
```

### 3. `PromptContextBuilder`
```typescript
class PromptContextBuilder {
  addProfessionalContext(context: ProfessionalContext): this;
  addPatientContext(patient: Patient): this;
  addSessionHistory(history: Session[]): this;
  build(): string; // Retorna contexto formateado para Vertex AI
}
```

---

## 🔗 Integraciones Necesarias

### 1. **Onboarding → Professional Profile**
- ✅ Ya existe: `ProfessionalProfileContext`
- ⚠️ Mejorar: Extraer más datos relevantes para contexto (especialización, certificaciones, etc.)

### 2. **Create Patient → Patient Service**
- ✅ Ya existe: `PatientService`
- ⚠️ Mejorar: Almacenar datos relevantes para sugerencias (edad, condición, etc.)

### 3. **Vertex AI Prompts**
- ⚠️ Crear: `PromptFactory` que incluya contexto profesional y de paciente
- ⚠️ Documentar: Cómo se construyen los prompts con contexto

### 4. **Workflow Page**
- ⚠️ Crear: Componente que muestre sugerencias personalizadas
- ⚠️ Integrar: Usar sugerencias para pre-llenar o sugerir campos

---

## 📊 Ejemplos de Retroalimentación

### Ejemplo 1: Onboarding → Tratamiento
```
Fisio completa onboarding:
  - Especialización: "Orthopedic Physiotherapy"
  - Certificaciones: ["Manual Therapy", "Dry Needling"]
  - Años experiencia: 12
  - Patient Population: "sports"

→ En próxima sesión con paciente deportista:
  Vertex AI sugiere:
    - "Considerar técnicas de terapia manual para lesión deportiva"
    - "Dry needling puede ser efectivo para esta condición"
    - "Basado en tu experiencia con atletas, este protocolo..."
```

### Ejemplo 2: Crear Paciente → Sugerencias
```
Crear paciente:
  - Edad: 78 años
  - Condición: "Lower back pain"
  - Historial: "Previous hip replacement"

Fisio tiene:
  - Especialización: "Geriatric Physiotherapy"
  - Certificación: "Fall Prevention"

→ Command Center muestra:
  - "Start Follow-up Session" (si tiene historial)
  - Sugerencia: "Considerar evaluación de riesgo de caídas"
  - Tratamientos sugeridos ajustados a edad y condición
```

---

## 🎯 Beneficios

1. **Personalización**: Cada fisio ve sugerencias relevantes a su expertise
2. **Eficiencia**: Menos tiempo buscando opciones, más tiempo tratando
3. **Calidad**: Sugerencias más precisas basadas en contexto completo
4. **Aprendizaje**: El sistema aprende de patrones y mejora sugerencias
5. **Transparencia**: Desarrolladores y stakeholders entienden cómo funciona

---

## 📚 Documentación Relacionada

- `docs/ai/PROMPT_CONTEXT.md` (crear)
- `docs/architecture/DATA_FLOW.md` (crear)
- `docs/services/ProfessionalContextService.md` (crear)
- `docs/services/TreatmentSuggestionService.md` (crear)

---

## 🚀 Próximos Pasos

1. **Fase 1**: Documentar flujos actuales de datos
2. **Fase 2**: Crear `ProfessionalContextService`
3. **Fase 3**: Integrar contexto en `PromptFactory`
4. **Fase 4**: Crear `TreatmentSuggestionService`
5. **Fase 5**: Implementar UI para mostrar sugerencias personalizadas
6. **Fase 6**: Testing y refinamiento

---

## 💡 Notas Adicionales

- **Privacidad**: Asegurar que solo se use contexto relevante, no datos sensibles innecesarios
- **Performance**: Cachear contexto profesional (cambia poco frecuentemente)
- **Fallbacks**: Si no hay contexto disponible, usar sugerencias genéricas
- **Analytics**: Trackear qué sugerencias se aceptan/rechazan para mejorar

---

**Mantenido por:** Equipo de Desarrollo  
**Última actualización:** 2025-11-25  
**Revisión próxima:** Sprint 4 (Post-Piloto)

