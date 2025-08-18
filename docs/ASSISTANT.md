# 🤖 AiDux Assistant - Documentación Técnica

## 📋 Descripción General

El **AiDux Assistant** es un sistema de asistencia clínica inteligente integrado en AiDuxCare que proporciona dos tipos de funcionalidades:

1. **Data Q&A**: Consultas sobre datos internos del sistema (edad del paciente, citas, notas pendientes, etc.)
2. **Conocimiento Clínico**: Análisis clínico con IA local (Ollama) para consultas de fisioterapia y rehabilitación

## 🏗️ Arquitectura del Sistema

### **Frontend Components**
```
src/shared/components/Assistant/
├── ClinicalAssistantPanel.tsx    # Panel principal con pestañas
└── FloatingAssistant.tsx         # Botón flotante (legacy)
```

### **Core Services**
```
src/core/assistant/
├── assistantAdapter.ts           # Router inteligente data/llm/both
├── dataLookup.ts                # Consultas de datos internos
├── rails.ts                     # Sistema RAILS (Restricted AI Language)
├── entities.ts                  # Tipos de entidades médicas
└── extractEntities.ts           # Extracción avanzada de entidades
```

### **Cloud Functions**
```
cloud-functions/clinical-brain/src/
├── assistant/
│   ├── assistantDataLookup.ts   # HTTPS callable para Data Q&A
│   └── assistantQuery.ts        # HTTPS callable para LLM con RAILS
└── llm/
    └── assistantLLMAdapter.ts   # Adaptador para Ollama local
```

## 🎯 Funcionalidades Principales

### **1. Pestaña "Datos"**
- **Consultas de edad**: "¿Cuál es la edad del paciente?"
- **Informes de resonancia**: "¿Qué dice la última resonancia?"
- **Citas de hoy**: "¿Qué citas tengo hoy?"
- **Notas pendientes**: "¿Cuántas notas pendientes tengo?"

### **2. Pestaña "Conocimiento"**
- **Análisis de medicamentos**: "ibuprofeno 400 mg por 7 días"
- **Consultas de ejercicios**: "¿Qué ejercicios para el dolor lumbar?"
- **Evaluaciones clínicas**: "¿Cómo interpretar test de Lasègue?"
- **Técnicas de fisioterapia**: "¿Cuál es la técnica correcta de terapia manual?"

## 🔒 Sistema RAILS (Restricted AI Language System)

### **Sanitización PII**
- DNIs españoles: `12345678A` → `[DNI]`
- Teléfonos: `612345678` → `[TELÉFONO]`
- Emails: `paciente@test.com` → `[EMAIL]`
- Fechas: `15/12/2024` → `[FECHA]`
- Pasaportes: `ES12345678A` → `[PASAPORTE]`
- NIEs: `X1234567A` → `[NIE]`

### **Validación de Dominio Médico**
- **Permitidos**: fisioterapia, rehabilitación, terapia, diagnóstico, síntomas, dolor, movilidad, medicamentos, ejercicios, protocolos, anatomía, biomecánica
- **Prohibidos**: finanzas, precio, factura, política, marketing, impuestos, ventas, comercial, entretenimiento

### **Validaciones de Contenido**
- Longitud mínima: 10 caracteres
- Longitud máxima: 1000 caracteres
- Debe contener palabras clave médicas
- Contexto específico de paciente cuando aplique

## 🧠 Routing Inteligente

### **Tipos de Consulta**
```typescript
type AssistantRoute = {
  type: 'data' | 'llm' | 'both';
  dataIntent?: 'age' | 'mri' | 'todayAppointments' | 'pendingNotes';
  entities: Record<string, string>;
  confidence: number;
};
```

### **Lógica de Routing**
1. **Consultas puras de datos**: `confidence: 0.95`
2. **Consultas de conocimiento clínico**: `confidence: 0.8`
3. **Consultas mixtas**: `confidence: 0.7`
4. **Consultas genéricas**: `confidence: 0.3`

### **Ejemplos de Routing**
```typescript
"¿Cuál es la edad del paciente?" → { type: 'data', dataIntent: 'age', confidence: 0.95 }
"¿Qué ejercicios para el dolor lumbar?" → { type: 'llm', confidence: 0.8 }
"¿Cuál es la edad y qué ejercicios recomiendas?" → { type: 'both', confidence: 0.7 }
```

## 🔧 Configuración del Entorno

### **Variables de Entorno**
```bash
# AiDux Assistant
VITE_AIDUX_ASSISTANT_PROVIDER=local
VITE_AIDUX_ASSISTANT_BASE_URL=http://localhost:11434
VITE_AIDUX_ASSISTANT_MODEL=llama3.1:8b-instruct
VITE_AIDUX_ASSISTANT_TIMEOUT=10000
```

### **Configuración Ollama**
```bash
# Instalar modelo
ollama pull llama3.1:8b-instruct

# Verificar funcionamiento
ollama run llama3.1:8b-instruct "Hola, ¿cómo estás?"
```

## 📊 Extracción de Entidades

### **Tipos de Entidades Soportadas**
1. **MedicationEntity**: Medicamentos con dosis, frecuencia, duración
2. **DiagnosisEntity**: Diagnósticos y condiciones clínicas
3. **ProcedureEntity**: Tests, evaluaciones y técnicas
4. **InstructionEntity**: Ejercicios y recomendaciones

### **Patrones de Extracción**
```typescript
// Medicamentos
"ibuprofeno 400 mg cada 8 horas por 7 días"
→ { name: 'ibuprofeno', strength: '400 mg', frequency: 'cada 8 horas', durationDays: 7 }

// Diagnósticos
"lumbalgia crónica y cervicalgia aguda"
→ [{ label: 'lumbalgia crónica' }, { label: 'cervicalgia aguda' }]

// Procedimientos
"test de Lasègue positivo y escala de Tinetti"
→ [{ label: 'test de Lasègue' }, { label: 'escala de Tinetti' }]
```

## 🚀 Despliegue de Cloud Functions

### **Comandos de Despliegue**
```bash
# Desplegar funciones del Assistant
cd cloud-functions/clinical-brain
npm run deploy:assistant

# Verificar estado
gcloud functions list --region=europe-west1
```

### **Regiones de Despliegue**
- **assistantDataLookup**: `europe-west1` (datos)
- **assistantQuery**: `europe-west1` (LLM)
- **clinicalBrain**: `us-east1` (Vertex AI - legacy)

## 🧪 Testing

### **Tests Unitarios**
```bash
# Tests del Assistant
npm run test src/core/assistant/__tests__/

# Tests de EMR
npm run test src/core/emr/__tests__/

# Tests completos
npm run test
```

### **Tests de Integración**
```bash
# Levantar emulador Firestore
npm run emulator:firestore

# Tests con emulador
npm run test:firestore
```

## 📈 Métricas y Auditoría

### **Eventos de Analytics**
- `assistant_data_query`: Consultas de datos internos
- `assistant_llm_query`: Consultas de LLM
- `assistant_mixed_query`: Consultas mixtas
- `assistant_query_error`: Errores del sistema

### **Logs de Auditoría**
- Usuario que realiza la consulta
- Tipo de consulta (data/llm/both)
- Tiempo de procesamiento
- Confianza de la respuesta
- Sanitización aplicada

## 🔍 Troubleshooting

### **Problemas Comunes**

#### **1. Ollama no responde**
```bash
# Verificar estado del servicio
ollama list
ollama ps

# Reiniciar si es necesario
ollama stop
ollama serve
```

#### **2. Cloud Functions fallan**
```bash
# Verificar logs
gcloud functions logs read assistantDataLookup --region=europe-west1
gcloud functions logs read assistantQuery --region=europe-west1
```

#### **3. Entidades no se extraen**
- Verificar que el texto contenga palabras clave médicas
- Comprobar que la consulta pase las validaciones RAILS
- Revisar logs de extracción en consola del navegador

### **Debug del Sistema**
```typescript
// Habilitar logs detallados
console.log('Assistant Debug:', {
  input: query,
  routing: routeQuery(query),
  entities: extractedEntities,
  confidence: getClinicalConfidence(query)
});
```

## 🚀 Roadmap Futuro

### **Fase 1 (Completada)**
- ✅ Sistema RAILS básico
- ✅ Routing inteligente
- ✅ Extracción de entidades
- ✅ Integración con Ollama local

### **Fase 2 (Planificada)**
- 🔄 Modelos médicos especializados
- 🔄 Base de conocimiento RAG
- 🔄 Integración con FHIR
- 🔄 Análisis de imágenes

### **Fase 3 (Futuro)**
- 📋 IA multimodal
- 📋 Predicción de resultados
- 📋 Recomendaciones personalizadas
- 📋 Integración con EMRs externos

## 📚 Referencias

- [Documentación Ollama](https://ollama.ai/docs)
- [Firebase Functions](https://firebase.google.com/docs/functions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [AiDuxCare Blueprint](docs/AIDUXCARE_BLUEPRINT_OFFICIAL.md)

---

**Versión**: 1.0  
**Última actualización**: Diciembre 2024  
**Mantenido por**: Equipo AiDuxCare
