# 🤖 Plan de Integración LLM - AiDuxCare

## 🎯 OBJETIVO INMEDIATO
Configurar un LLM para procesamiento de transcripciones médicas y generación de notas SOAP estructuradas.

## 📊 EVALUACIÓN DE OPCIONES LLM

### **Opción 1: OpenAI API** ⭐ **RECOMENDADA**
```typescript
// Ventajas para MVP
- ✅ API estable y bien documentada
- ✅ GPT-3.5-turbo: $0.002/1K tokens (muy económico)
- ✅ GPT-4o-mini: Excelente para tareas médicas estructuradas
- ✅ Integración React/TypeScript nativa
- ✅ $5 crédito gratuito para nuevas cuentas
```

### **Opción 2: Ollama Local** 
```typescript
// Ventajas para desarrollo
- ✅ Completamente gratuito
- ✅ Control total sobre el modelo
- ✅ Sin límites de uso
- ❌ Requiere hardware potente
- ❌ Configuración más compleja
```

### **Opción 3: Hugging Face API**
```typescript
// Ventajas para experimentación
- ✅ Modelos médicos especializados
- ✅ Algunos modelos gratuitos
- ❌ Menos estable para producción
- ❌ Documentación menos clara
```

## 🚀 IMPLEMENTACIÓN RECOMENDADA: OpenAI API

### **PASO 1: Configuración de Credenciales**

1. **Obtener API Key de OpenAI:**
   - Ir a https://platform.openai.com/api-keys
   - Crear cuenta si no existe
   - Generar nueva API key
   - **IMPORTANTE**: Guardar la key de forma segura

2. **Configurar Variables de Entorno:**
```bash
# En .env.local
VITE_OPENAI_API_KEY=sk-...tu-api-key...
VITE_OPENAI_MODEL=gpt-3.5-turbo
VITE_OPENAI_MAX_TOKENS=2000
```

### **PASO 2: Instalación de Dependencies**

```bash
npm install openai
npm install @types/node --save-dev
```

### **PASO 3: Configuración del Cliente OpenAI**

```typescript
// src/lib/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Solo para development
});

export default openai;
```

### **PASO 4: Servicio de Procesamiento NLP**

```typescript
// src/services/nlpService.ts
import openai from '../lib/openai';

export interface ClinicalEntity {
  type: 'symptom' | 'treatment' | 'diagnosis' | 'objective' | 'plan';
  text: string;
  confidence: number;
}

export interface SOAPNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export class NLPService {
  
  static async extractClinicalEntities(transcript: string): Promise<ClinicalEntity[]> {
    const prompt = `
    Analiza esta transcripción de una sesión de fisioterapia y extrae las entidades clínicas:
    
    Transcripción: "${transcript}"
    
    Extrae y clasifica en JSON:
    - Síntomas mencionados
    - Tratamientos aplicados
    - Diagnósticos discutidos
    - Objetivos de la sesión
    
    Formato: [{"type": "symptom", "text": "dolor en rodilla", "confidence": 0.95}]
    `;

    const response = await openai.chat.completions.create({
      model: import.meta.env.VITE_OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.3
    });

    return JSON.parse(response.choices[0].message.content || '[]');
  }

  static async generateSOAPNotes(transcript: string, entities: ClinicalEntity[]): Promise<SOAPNotes> {
    const prompt = `
    Como fisioterapeuta profesional, genera una nota SOAP estructurada basada en:
    
    Transcripción: "${transcript}"
    
    Entidades identificadas: ${JSON.stringify(entities)}
    
    Genera una nota SOAP profesional en formato JSON:
    {
      "subjective": "Lo que reporta el paciente...",
      "objective": "Observaciones objetivas del fisioterapeuta...",
      "assessment": "Análisis profesional...",
      "plan": "Plan de tratamiento..."
    }
    `;

    const response = await openai.chat.completions.create({
      model: import.meta.env.VITE_OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.4
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }
}
```

### **PASO 5: Integración con Audio Pipeline**

```typescript
// src/services/audioProcessingService.ts
import { NLPService } from './nlpService';

export class AudioProcessingService {
  
  static async processAudioSession(audioFile: File): Promise<{
    transcript: string;
    entities: ClinicalEntity[];
    soapNotes: SOAPNotes;
  }> {
    
    // 1. Speech-to-Text (usando Web Speech API o servicio externo)
    const transcript = await this.speechToText(audioFile);
    
    // 2. Extracción de entidades clínicas
    const entities = await NLPService.extractClinicalEntities(transcript);
    
    // 3. Generación de notas SOAP
    const soapNotes = await NLPService.generateSOAPNotes(transcript, entities);
    
    return {
      transcript,
      entities,
      soapNotes
    };
  }

  private static async speechToText(audioFile: File): Promise<string> {
    // Por ahora, simulación para MVP
    // Más tarde: integrar con OpenAI Whisper API
    return "Transcripción simulada: El paciente reporta dolor en la rodilla derecha...";
  }
}
```

## 🧪 TESTING INMEDIATO

### **Script de Prueba**

```typescript
// src/scripts/testLLM.ts
import { NLPService } from '../services/nlpService';

const testTranscript = `
El paciente Juan Pérez llegó hoy reportando dolor continuo en la rodilla derecha. 
Menciona que el dolor empeoró después de correr el fin de semana. 
Durante la evaluación observé inflamación leve y limitación en la flexión. 
Aplicamos terapia manual y ejercicios de movilidad. 
El paciente respondió bien al tratamiento. 
Plan: continuar con ejercicios en casa y volver en una semana.
`;

async function testNLPPipeline() {
  try {
    console.log('🧪 Testing LLM Integration...');
    
    // Test entity extraction
    const entities = await NLPService.extractClinicalEntities(testTranscript);
    console.log('✅ Entities extracted:', entities);
    
    // Test SOAP generation
    const soapNotes = await NLPService.generateSOAPNotes(testTranscript, entities);
    console.log('✅ SOAP Notes generated:', soapNotes);
    
    console.log('🎉 LLM Integration successful!');
    
  } catch (error) {
    console.error('❌ LLM Integration failed:', error);
  }
}

// Ejecutar test
testNLPPipeline();
```

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### **Mauricio, ejecuta en este orden:**

- [ ] **1. Crear cuenta OpenAI** y obtener API key
- [ ] **2. Configurar variables de entorno** (.env.local)
- [ ] **3. Instalar dependencies** (openai)
- [ ] **4. Crear archivo src/lib/openai.ts**
- [ ] **5. Crear archivo src/services/nlpService.ts**
- [ ] **6. Crear archivo src/services/audioProcessingService.ts**
- [ ] **7. Crear script de testing src/scripts/testLLM.ts**
- [ ] **8. Ejecutar test y verificar funcionamiento**

## 🚨 CONSIDERACIONES DE SEGURIDAD

```typescript
// ⚠️ NUNCA hacer en producción
dangerouslyAllowBrowser: true

// ✅ Para producción: crear proxy backend
// src/api/openai-proxy.ts (para el futuro FastAPI)
```

## 📊 MÉTRICAS DE ÉXITO

- ✅ **API Key configurada** y funcionando
- ✅ **Extracción de entidades** funcional
- ✅ **Generación SOAP** estructurada
- ✅ **Test script** ejecutándose sin errores
- ✅ **Costos bajo control** (<$2 para testing completo)

---

**Mauricio, ¿estás listo para comenzar con el PASO 1? 🚀**

Necesito que me confirmes:
1. ¿Tienes acceso para crear una cuenta OpenAI?
2. ¿Prefieres OpenAI API o quieres explorar Ollama local?
3. ¿Alguna pregunta sobre el plan antes de empezar?

**Una vez que confirmes, empezamos inmediatamente con la implementación paso a paso.** 🎯 