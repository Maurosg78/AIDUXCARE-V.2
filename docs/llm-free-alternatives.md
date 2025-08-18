# 🆓 LLMs Gratuitos para AiDuxCare - Guía Completa

## 🎯 **OPCIONES GRATUITAS EVALUADAS**

### **🥇 OPCIÓN 1: OLLAMA LOCAL** ⭐ **RECOMENDADA PARA CURSO**
```typescript
// Ventajas
- ✅ 100% GRATUITO - Sin costos ni límites
- ✅ Modelos médicos: Llama-3.1 8B, Mistral 7B, CodeLlama
- ✅ Privacidad total - Todo local
- ✅ Perfecto para demos académicas
- ✅ API REST compatible con OpenAI
- ✅ Instalación simple en Mac/Windows/Linux

// Desventajas
- ❌ Requiere 8GB+ RAM para modelos buenos
- ❌ Procesamiento más lento que APIs cloud
```

### **🥈 OPCIÓN 2: HUGGING FACE INFERENCE API**
```typescript
// Ventajas
- ✅ Tier gratuito: 30,000 requests/mes
- ✅ Modelos médicos especializados
- ✅ API similar a OpenAI
- ✅ No requiere hardware potente

// Desventajas
- ❌ Límites de uso mensual
- ❌ Latencia variable
```

### **🥉 OPCIÓN 3: GROQ API**
```typescript
// Ventajas
- ✅ SUPER RÁPIDO (5-10x más que OpenAI)
- ✅ Tier gratuito generoso
- ✅ API compatible

// Desventajas
- ❌ Modelos limitados
- ❌ Menos especialización médica
```

---

## 🚀 **IMPLEMENTACIÓN OLLAMA - PASO A PASO**

### **INSTALACIÓN OLLAMA (5 minutos)**

```bash
# macOS
curl -fsSL https://ollama.ai/install.sh | sh

# Windows: Descargar desde https://ollama.ai/download
# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Verificar instalación
ollama --version
```

### **DESCARGAR MODELOS MÉDICOS**

```bash
# Modelo principal para fisioterapia (4GB)
ollama pull llama3.2:3b

# Modelo más potente si tienes >8GB RAM (7GB)
ollama pull mistral:7b

# Modelo especializado en código/estructura (4GB)
ollama pull codellama:7b

# Verificar modelos instalados
ollama list
```

### **INICIAR SERVIDOR OLLAMA**

```bash
# Iniciar servicio Ollama (puerto 11434)
ollama serve

# En otra terminal, probar conexión
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:3b",
  "prompt": "Explica qué es fisioterapia",
  "stream": false
}'
```

---

## 💻 **CÓDIGO PARA AIDUXCARE CON OLLAMA**

### **1. Configuración Ollama Client**

```typescript
// src/lib/ollama.ts
export class OllamaClient {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl = 'http://localhost:11434', model = 'llama3.2:3b') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generateCompletion(prompt: string): Promise<{
    response: string;
    tokens: number;
    duration: number;
  }> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          max_tokens: 2000
        }
      })
    });

    const data = await response.json();
    
    return {
      response: data.response,
      tokens: data.eval_count || 0,
      duration: data.total_duration || 0
    };
  }

  async chatCompletion(messages: Array<{role: string, content: string}>): Promise<string> {
    // Convertir mensajes a prompt simple para Ollama
    const prompt = messages
      .map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
      .join('\n') + '\nAsistente:';

    const result = await this.generateCompletion(prompt);
    return result.response;
  }
}

export const ollamaClient = new OllamaClient();
```

### **2. Servicio NLP con Ollama**

```typescript
// src/services/nlpServiceOllama.ts
import { ollamaClient } from '../lib/ollama';
import { ClinicalEntity, SOAPNotes } from '../types/nlp';

export class NLPServiceOllama {
  
  static async extractClinicalEntities(transcript: string): Promise<ClinicalEntity[]> {
    const prompt = `
TAREA: Analiza esta transcripción de fisioterapia y extrae entidades clínicas.

TRANSCRIPCIÓN:
"${transcript}"

INSTRUCCIONES:
- Identifica síntomas, tratamientos, diagnósticos, objetivos
- Responde SOLO con JSON válido
- Formato: [{"type": "symptom", "text": "dolor rodilla", "confidence": 0.9}]

TIPOS PERMITIDOS: symptom, treatment, diagnosis, objective, plan, exercise

JSON:`;

    try {
      const result = await ollamaClient.generateCompletion(prompt);
      
      // Limpiar respuesta y extraer JSON
      const jsonMatch = result.response.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return [];
    } catch (error) {
      console.error('Error extracting entities:', error);
      return [];
    }
  }

  static async generateSOAPNotes(transcript: string, entities: ClinicalEntity[]): Promise<SOAPNotes> {
    const prompt = `
TAREA: Genera nota SOAP profesional para fisioterapia.

TRANSCRIPCIÓN:
"${transcript}"

ENTIDADES IDENTIFICADAS:
${JSON.stringify(entities, null, 2)}

INSTRUCCIONES:
- Escribe como fisioterapeuta profesional
- Usa terminología médica apropiada
- Responde SOLO con JSON válido
- Sigue formato SOAP estricto

FORMATO JSON:
{
  "subjective": "Lo que reporta el paciente...",
  "objective": "Observaciones del fisioterapeuta...",
  "assessment": "Análisis profesional...",
  "plan": "Plan de tratamiento..."
}

JSON:`;

    try {
      const result = await ollamaClient.generateCompletion(prompt);
      
      // Extraer JSON de la respuesta
      const jsonMatch = result.response.match(/\{.*\}/s);
      if (jsonMatch) {
        const soapData = JSON.parse(jsonMatch[0]);
        return {
          ...soapData,
          generated_at: new Date(),
          confidence_score: 0.85 // Estimado para Ollama
        };
      }
      
      // Fallback si no se puede parsear
      return {
        subjective: "No se pudo extraer información subjetiva",
        objective: "No se pudo extraer información objetiva", 
        assessment: "Requiere revisión manual",
        plan: "Pendiente de evaluación",
        generated_at: new Date(),
        confidence_score: 0.3
      };
      
    } catch (error) {
      console.error('Error generating SOAP:', error);
      throw new Error('Failed to generate SOAP notes');
    }
  }
}
```

### **3. Configuración de Variables de Entorno**

```bash
# .env.local
# Configuración Ollama (GRATIS)
VITE_LLM_PROVIDER=ollama
VITE_OLLAMA_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.2:3b

# Backup: Hugging Face (Gratuito con límites)
VITE_HUGGINGFACE_API_KEY=hf_tu_key_gratuita
VITE_HF_MODEL=microsoft/DialoGPT-medium
```

### **4. Audio Processing con Ollama**

```typescript
// src/services/audioProcessingServiceOllama.ts
import { NLPServiceOllama } from './nlpServiceOllama';
import { ClinicalEntity, SOAPNotes } from '../types/nlp';

export class AudioProcessingServiceOllama {
  
  static async processAudioSession(audioFile: File): Promise<{
    transcript: string;
    entities: ClinicalEntity[];
    soapNotes: SOAPNotes;
    processingTime: number;
  }> {
    
    const startTime = Date.now();
    
    // 1. Speech-to-Text (Web Speech API - GRATIS)
    const transcript = await this.speechToTextFree(audioFile);
    
    // 2. Extracción de entidades con Ollama (GRATIS)
    const entities = await NLPServiceOllama.extractClinicalEntities(transcript);
    
    // 3. Generación SOAP con Ollama (GRATIS)
    const soapNotes = await NLPServiceOllama.generateSOAPNotes(transcript, entities);
    
    const processingTime = Date.now() - startTime;
    
    return {
      transcript,
      entities,
      soapNotes,
      processingTime
    };
  }

  private static async speechToTextFree(audioFile: File): Promise<string> {
    // Simulación para MVP - En producción usar Web Speech API
    const simulatedTranscripts = [
      "El paciente Juan reporta dolor en rodilla derecha desde hace 3 días. Observo inflamación leve. Aplicamos terapia manual y ejercicios de movilidad. Buena respuesta al tratamiento. Plan: ejercicios en casa y control en una semana.",
      "Paciente María con dolor lumbar crónico. Evaluación muestra rigidez muscular. Tratamiento con masaje terapéutico y estiramientos. Mejora parcial. Continuaremos con fisioterapia dos veces por semana.",
      "Sesión de seguimiento para rehabilitación de hombro. Paciente muestra progreso en rango de movimiento. Ejercicios de fortalecimiento funcionando bien. Reducir frecuencia a una vez por semana."
    ];
    
    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return simulatedTranscripts[Math.floor(Math.random() * simulatedTranscripts.length)];
  }
}
```

---

## 🧪 **SCRIPT DE TESTING OLLAMA**

```typescript
// src/scripts/testOllama.ts
import { NLPServiceOllama } from '../services/nlpServiceOllama';

const testTranscript = `
El paciente Carlos llegó reportando dolor intenso en la zona lumbar. 
Menciona que comenzó después de levantar una caja pesada en el trabajo. 
Durante la evaluación observé tensión muscular significativa en el área paravertebral. 
Limitación notable en la flexión anterior del tronco.
Aplicamos masaje terapéutico profundo y técnicas de liberación miofascial.
El paciente reportó alivio inmediato del 60% del dolor.
Plan: continuar con sesiones de fisioterapia tres veces por semana,
ejercicios de fortalecimiento del core en casa, y aplicación de calor local.
`;

async function testOllamaPipeline() {
  try {
    console.log('🧪 Testing Ollama LLM Integration...');
    console.log('📝 Transcript:', testTranscript.substring(0, 100) + '...');
    
    // Test 1: Extracción de entidades
    console.log('\n🔍 Extracting clinical entities...');
    const entities = await NLPServiceOllama.extractClinicalEntities(testTranscript);
    console.log('✅ Entities extracted:', entities.length);
    entities.forEach(entity => {
      console.log(`  - ${entity.type}: "${entity.text}" (${entity.confidence})`);
    });
    
    // Test 2: Generación SOAP
    console.log('\n📋 Generating SOAP notes...');
    const soapNotes = await NLPServiceOllama.generateSOAPNotes(testTranscript, entities);
    console.log('✅ SOAP Notes generated:');
    console.log('  S:', soapNotes.subjective.substring(0, 80) + '...');
    console.log('  O:', soapNotes.objective.substring(0, 80) + '...');
    console.log('  A:', soapNotes.assessment.substring(0, 80) + '...');
    console.log('  P:', soapNotes.plan.substring(0, 80) + '...');
    
    console.log('\n🎉 Ollama Integration successful! 🆓');
    console.log('💰 Costo total: $0.00 (GRATIS)');
    
  } catch (error) {
    console.error('❌ Ollama Integration failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. ¿Está Ollama corriendo? → ollama serve');
    console.log('2. ¿Modelo descargado? → ollama pull llama3.2:3b');
    console.log('3. ¿Puerto correcto? → curl http://localhost:11434');
  }
}

// Ejecutar test
testOllamaPipeline();
```

---

## 📋 **COMANDOS DE INSTALACIÓN RÁPIDA**

```bash
# 1. Instalar Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Descargar modelo principal
ollama pull llama3.2:3b

# 3. Iniciar servidor (en terminal separada)
ollama serve

# 4. Crear archivos en AiDuxCare
touch src/lib/ollama.ts
touch src/services/nlpServiceOllama.ts
touch src/services/audioProcessingServiceOllama.ts
touch src/scripts/testOllama.ts

# 5. Actualizar .env.local
echo "VITE_LLM_PROVIDER=ollama" >> .env.local
echo "VITE_OLLAMA_URL=http://localhost:11434" >> .env.local
echo "VITE_OLLAMA_MODEL=llama3.2:3b" >> .env.local

# 6. Test de funcionamiento
npm run build
```

---

## 🎯 **COMPARACIÓN: COSTOS PROYECTADOS**

| Proveedor | Costo por 1000 tokens | Costo 100 transcripciones | Límites |
|-----------|----------------------|---------------------------|---------|
| **OpenAI GPT-3.5** | $0.002 | ~$5-10 | Sin límite (pagando) |
| **Ollama Local** | **$0.00** | **$0.00** | Solo hardware |
| **Hugging Face** | $0.00 | $0.00 | 30K requests/mes |
| **Groq** | $0.00 | $0.00 | Límites diarios |

---

## ✅ **RECOMENDACIÓN FINAL PARA EL CURSO**

**Mauricio, mi recomendación oficial como Implementador Jefe:**

### **USAR OLLAMA PORQUE:**
1. ✅ **100% gratuito** - Perfecto para proyecto académico
2. ✅ **Funciona offline** - Ideal para demos sin internet
3. ✅ **Control total** - No dependes de APIs externas
4. ✅ **Impresiona al profesorado** - Demuestra conocimiento técnico avanzado
5. ✅ **Escalable** - Puedes cambiar modelos fácilmente

### **PLAN DE IMPLEMENTACIÓN:**
1. **Instalar Ollama** hoy mismo (5 minutos)
2. **Descargar modelo llama3.2:3b** (10 minutos)
3. **Implementar código** que te proporciono (30 minutos)
4. **Probar pipeline completo** (15 minutos)

**¿Listo para implementar la solución 100% gratuita? 🚀** 