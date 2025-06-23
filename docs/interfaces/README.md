# 📋 Documentación de Interfaces - AiDuxCare V.2

## 🎯 **Propósito**
Esta documentación define todas las interfaces de entrada y salida del pipeline de procesamiento de transcripciones médicas del mundo real.

---

## 🔧 **Interfaces Principales**

### **RealWorldSOAPSegment**
Representa un segmento individual de transcripción clasificado y procesado.

```typescript
interface RealWorldSOAPSegment {
  text: string;                    // Texto del segmento
  speaker: 'PACIENTE' | 'TERAPEUTA'; // Identificación del hablante
  section: 'S' | 'O' | 'A' | 'P';    // Clasificación SOAP
  confidence: number;               // Confianza [0-1]
  reasoning: string;                // Justificación de la clasificación
  entities: MedicalEntity[];        // Entidades médicas extraídas
}
```

**Ejemplo:**
```json
{
  "text": "me cuesta mucho girar el cuello hacia la derecha",
  "speaker": "PACIENTE",
  "section": "S",
  "confidence": 0.96,
  "reasoning": "Síntoma subjetivo expresado por paciente",
  "entities": [
    { "category": "anatomy", "value": "cuello" },
    { "category": "severity", "value": "mucho" }
  ]
}
```

---

### **MedicalEntity**
Representa una entidad médica extraída del texto.

```typescript
interface MedicalEntity {
  category: 'anatomy' | 'symptom' | 'treatment' | 'diagnosis' | 'procedure' | 'test' | 'finding';
  value: string;                    // Valor de la entidad
  confidence?: number;              // Confianza opcional [0-1]
}
```

**Categorías Soportadas:**
- **anatomy**: Estructuras anatómicas (cuello, lumbar, hombro)
- **symptom**: Síntomas reportados (dolor, rigidez, limitación)
- **treatment**: Tratamientos (terapia manual, ejercicios)
- **diagnosis**: Diagnósticos (latigazo cervical, impingement)
- **procedure**: Procedimientos (palpación, movilización)
- **test**: Pruebas diagnósticas (test de Neer, Lasègue)
- **finding**: Hallazgos (contractura, crepitación)

---

### **PipelineResult**
Resultado completo del procesamiento de una transcripción.

```typescript
interface PipelineResult {
  segments: RealWorldSOAPSegment[];  // Segmentos procesados
  fullAssessment: string;            // Assessment clínico generado
  speakerAccuracy: number;           // Precisión identificación hablantes
  processingTimeMs: number;          // Tiempo de procesamiento
  qualityMetrics: QualityMetrics;    // Métricas de calidad
}
```

**Ejemplo:**
```json
{
  "segments": [...],
  "fullAssessment": "Cervicalgia post-latigazo con limitación funcional",
  "speakerAccuracy": 0.94,
  "processingTimeMs": 85,
  "qualityMetrics": {
    "soapDistribution": { "S": 2, "O": 2, "A": 1, "P": 1 },
    "entityCount": 12,
    "averageConfidence": 0.93
  }
}
```

---

### **QualityMetrics**
Métricas de calidad del procesamiento.

```typescript
interface QualityMetrics {
  soapDistribution: Record<'S' | 'O' | 'A' | 'P', number>; // Distribución SOAP
  entityCount: number;              // Total de entidades extraídas
  averageConfidence: number;        // Confianza promedio
  speakerSwitches: number;          // Cambios de hablante
}
```

---

### **TestCase**
Formato estándar para casos de prueba.

```typescript
interface TestCase {
  metadata: {
    caseId: string;                 // ID único del caso
    specialty: 'fisioterapia' | 'psicologia' | 'general';
    patientAge: number;
    sessionDuration: string;
    transcriptionSource: string;
    complexity: 'simple' | 'moderate' | 'complex';
    description: string;
  };
  rawTranscription: string;         // Transcripción original
  expectedOutput: {
    segments: RealWorldSOAPSegment[];
    fullAssessment: string;
  };
  qualityMetrics: QualityMetrics;
}
```

---

## 🔄 **Flujo de Datos**

```
Raw Transcription (string)
    ↓
RealWorldPipeline.processTranscription()
    ↓
PipelineResult
    ↓
DynamicSOAPEditor / TestSuite
```

---

## 🧪 **Validación de Interfaces**

### **Validadores TypeScript**
```typescript
// Validar RealWorldSOAPSegment
function isValidSOAPSegment(obj: any): obj is RealWorldSOAPSegment {
  return (
    typeof obj.text === 'string' &&
    ['PACIENTE', 'TERAPEUTA'].includes(obj.speaker) &&
    ['S', 'O', 'A', 'P'].includes(obj.section) &&
    typeof obj.confidence === 'number' &&
    obj.confidence >= 0 && obj.confidence <= 1 &&
    typeof obj.reasoning === 'string' &&
    Array.isArray(obj.entities)
  );
}

// Validar MedicalEntity
function isValidMedicalEntity(obj: any): obj is MedicalEntity {
  const validCategories = ['anatomy', 'symptom', 'treatment', 'diagnosis', 'procedure', 'test', 'finding'];
  return (
    validCategories.includes(obj.category) &&
    typeof obj.value === 'string'
  );
}
```

### **Esquemas JSON**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "text": { "type": "string" },
    "speaker": { "enum": ["PACIENTE", "TERAPEUTA"] },
    "section": { "enum": ["S", "O", "A", "P"] },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
    "reasoning": { "type": "string" },
    "entities": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "category": { "enum": ["anatomy", "symptom", "treatment", "diagnosis", "procedure", "test", "finding"] },
          "value": { "type": "string" }
        },
        "required": ["category", "value"]
      }
    }
  },
  "required": ["text", "speaker", "section", "confidence", "reasoning", "entities"]
}
```

---

## 📊 **Métricas de Calidad Esperadas**

### **Thresholds Mínimos**
- **SOAP Accuracy**: > 85%
- **Speaker Accuracy**: > 90%
- **Entity Extraction**: > 80%
- **Processing Time**: < 100ms por segmento
- **Overall Confidence**: > 0.8

### **Distribución SOAP Típica**
- **Subjetivo (S)**: 30-40% de segmentos
- **Objetivo (O)**: 30-40% de segmentos  
- **Análisis (A)**: 10-20% de segmentos
- **Plan (P)**: 10-20% de segmentos

---

## 🚀 **Uso en Desarrollo**

### **Crear Nuevo Caso de Prueba**
```typescript
const newTestCase: TestCase = {
  metadata: {
    caseId: "caso-004",
    specialty: "fisioterapia",
    patientAge: 45,
    sessionDuration: "20min",
    transcriptionSource: "real-consultation",
    complexity: "moderate",
    description: "Descripción del caso"
  },
  rawTranscription: "transcripción del mundo real...",
  expectedOutput: {
    segments: [...],
    fullAssessment: "assessment esperado"
  },
  qualityMetrics: {...}
};
```

### **Procesar con Pipeline**
```typescript
import { RealWorldPipeline } from '../lib/RealWorldPipeline';

const pipeline = new RealWorldPipeline({
  specialty: 'fisioterapia',
  confidenceThreshold: 0.8
});

const result = await pipeline.processTranscription(rawText);
```

### **Validar Resultado**
```typescript
import { PipelineValidator } from '../lib/RealWorldPipeline';

const comparison = PipelineValidator.compareResults(actual, expected);
console.log(`Accuracy: ${comparison.accuracy * 100}%`);
```

---

## 🔧 **Extensibilidad**

### **Agregar Nueva Categoría de Entidad**
1. Actualizar `MedicalEntity['category']`
2. Agregar patrones en `ClinicalKnowledgeBase.ts`
3. Actualizar validadores y esquemas
4. Crear casos de prueba

### **Agregar Nueva Especialidad**
1. Extender `PipelineOptions['specialty']`
2. Crear patrones específicos en knowledge base
3. Implementar factory method
4. Agregar casos de prueba específicos

---

**Documentación actualizada:** Junio 2025  
**Versión:** AiDuxCare V.2.0  
**Mantenedor:** Equipo de Desarrollo AiDuxCare 