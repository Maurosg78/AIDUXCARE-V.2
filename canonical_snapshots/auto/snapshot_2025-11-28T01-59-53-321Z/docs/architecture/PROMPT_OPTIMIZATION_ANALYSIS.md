# 🔧 ANÁLISIS Y OPTIMIZACIÓN DE PROMPTS - AiDuxCare V.2

## 📋 **PROBLEMA IDENTIFICADO**
- **Issue**: Timeouts en generación de notas SOAP con Ollama Llama 3.2
- **Contexto**: Durante user testing de Mauricio en su práctica privada
- **Impacto**: Pipeline interrumpido, experiencia de usuario degradada
- **Frequency**: Especialmente con sesiones largas (>30min transcripción)

---

## 🔍 **ANÁLISIS ACTUAL DE PROMPTS**

### **📝 Prompt SOAP Actual (Línea 169-194)**
```typescript
const prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Eres un fisioterapeuta experto. Genera una nota SOAP profesional y concisa.${ragContext}

<|eot_id|><|start_header_id|>user<|end_header_id|>

Transcripción: "${transcript.substring(0, 800)}..."

Entidades: ${entities.slice(0, 5).map(e => `${e.type}: ${e.text}`).join(', ')}

Genera SOAP en formato JSON:
{
  "subjective": "Paciente reporta...",
  "objective": "Evaluación revela...", 
  "assessment": "Análisis clínico...",
  "plan": "Tratamiento incluye..."
}

<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`;
```

### **⚠️ Problemas Identificados**
1. **Prompt demasiado largo**: Template + transcript(800) + entities + RAG context
2. **RAG context no limitado**: Puede añadir 200-500 tokens adicionales
3. **Template verbose**: Headers de Llama innecesarios para tarea simple
4. **Max tokens altos**: 800 tokens de output para SOAP básico
5. **JSON parsing**: Dependencia de formato específico puede fallar

---

## 🚀 **ESTRATEGIAS DE OPTIMIZACIÓN**

### **Estrategia 1: Prompts Divididos (SOAP Modular)**
```typescript
// Generar S, O, A, P por separado para evitar timeouts
async generateSOAPModular(transcript: string, entities: ClinicalEntity[]): Promise<SOAPNotes> {
  const subjective = await this.generateSubjective(transcript, entities);
  const objective = await this.generateObjective(transcript, entities);
  const assessment = await this.generateAssessment(transcript, entities);
  const plan = await this.generatePlan(transcript, entities);
  
  return { subjective, objective, assessment, plan };
}
```

**✅ Ventajas:**
- Prompts más cortos y específicos
- Menos probabilidad de timeout
- Mejor control de calidad por sección
- Paralelización posible

**❌ Desventajas:**
- 4x llamadas a Ollama (latencia)
- Pérdida de contexto entre secciones
- Mayor complejidad de código

### **Estrategia 2: Prompt Híper-Optimizado (Recomendado)**
```typescript
const optimizedPrompt = `Fisioterapeuta: Genera SOAP JSON.

Paciente dice: ${transcript.substring(0, 400)}
Síntomas: ${symptoms.slice(0, 3).join(', ')}

JSON:
{"s":"","o":"","a":"","p":""}`;
```

**✅ Ventajas:**
- 70% reducción en longitud de prompt
- Instrucciones claras y directas
- JSON simplificado (s,o,a,p vs subjective...)
- Compatible con Ollama local

**❌ Desventajas:**
- Menos contexto para el modelo
- Posible reducción en calidad de output

### **Estrategia 3: Template Progressive (Adaptativo)**
```typescript
// Empezar con prompt completo, degradar si hay timeout
async generateSOAPAdaptive(transcript: string, entities: ClinicalEntity[]): Promise<SOAPNotes> {
  try {
    // Intento 1: Prompt completo (timeout 15s)
    return await this.generateSOAPComplete(transcript, entities);
  } catch (timeoutError) {
    try {
      // Intento 2: Prompt optimizado (timeout 10s)
      return await this.generateSOAPOptimized(transcript, entities);
    } catch (timeoutError2) {
      // Intento 3: Prompt mínimo (timeout 5s)
      return await this.generateSOAPMinimal(transcript, entities);
    }
  }
}
```

**✅ Ventajas:**
- Mantiene calidad cuando es posible
- Fallback graceful
- Datos de user testing sobre frecuencia de timeouts

**❌ Desventajas:**
- Complejidad adicional
- Múltiples intentos puede ser lento

---

## 🧪 **PROPUESTAS DE PROMPTS OPTIMIZADOS**

### **Prompt Optimizado v1 (Híper-conciso)**
```typescript
static async generateSOAPOptimizedV1(transcript: string, entities: ClinicalEntity[]): Promise<SOAPNotes> {
  const symptoms = entities.filter(e => e.type === 'symptom').slice(0, 3).map(e => e.text).join(', ');
  const findings = entities.filter(e => e.type === 'finding').slice(0, 2).map(e => e.text).join(', ');
  
  const prompt = `SOAP fisio:
Dice: ${transcript.substring(0, 300)}
Síntomas: ${symptoms}
Hallazgos: ${findings}

JSON:
{"s":"","o":"","a":"","p":""}`;

  const result = await ollamaClient.generateCompletion(prompt, {
    temperature: 0.1,
    max_tokens: 300 // Reducido de 800
  });
  
  // ... parsing logic
}
```

### **Prompt Optimizado v2 (Estructurado)**
```typescript
static async generateSOAPOptimizedV2(transcript: string, entities: ClinicalEntity[]): Promise<SOAPNotes> {
  const keyInfo = this.extractKeyInfoForSOAP(transcript, entities);
  
  const prompt = `Fisioterapeuta experto. SOAP profesional.

DATOS:
- Paciente: ${keyInfo.symptoms}
- Eval: ${keyInfo.findings}
- Tratamiento: ${keyInfo.treatments}

SOAP JSON:
{"subjective":"","objective":"","assessment":"","plan":""}`;

  const result = await ollamaClient.generateCompletion(prompt, {
    temperature: 0.2,
    max_tokens: 400,
    timeout: 10000 // 10 segundos timeout
  });
  
  // ... parsing logic
}
```

### **Prompt Optimizado v3 (Con RAG inteligente)**
```typescript
static async generateSOAPOptimizedV3(transcript: string, entities: ClinicalEntity[], useRAG: boolean = true): Promise<SOAPNotes> {
  let ragContext = '';
  
  if (useRAG) {
    // RAG ultra-selectivo para evitar timeouts
    const primaryCondition = entities.find(e => e.type === 'diagnosis')?.text || 
                            entities.find(e => e.type === 'symptom')?.text;
    
    if (primaryCondition) {
      try {
        const ragResult = await RAGMedicalMCP.retrieveRelevantKnowledge(
          primaryCondition, 
          'fisioterapia', 
          1 // Solo 1 artículo más relevante
        );
        
        if (ragResult.citations.length > 0) {
          ragContext = `\nEvidencia: ${ragResult.citations[0].title.substring(0, 50)}...`;
        }
      } catch (ragError) {
        console.warn('RAG skipped due to timeout risk');
      }
    }
  }
  
  const prompt = `Fisio SOAP${ragContext}

"${transcript.substring(0, 250)}"

JSON corto:
{"s":"","o":"","a":"","p":""}`;

  // ... implementation
}
```

---

## 📊 **PLAN DE TESTING PARA USER TESTING**

### **A/B Testing Structure para Mauricio**
```markdown
**Semana 1**: Prompt actual vs Optimizado v2
- Días 1-3: Usar prompt actual, documentar timeouts
- Días 4-7: Usar prompt optimizado v2, comparar performance

**Semana 2**: Prompt v2 vs v3 (con RAG inteligente)
- Comparar calidad de SOAP generado
- Medir frecuencia de timeouts
- Evaluar satisfacción con contenido
```

### **Métricas a Recoger**
```typescript
interface PromptTestingMetrics {
  prompt_version: 'current' | 'v1' | 'v2' | 'v3';
  generation_time_ms: number;
  timeout_occurred: boolean;
  soap_quality_score: 1 | 2 | 3 | 4 | 5; // Mauricio evaluation
  content_completeness: number; // 0-1
  clinical_accuracy: 'poor' | 'acceptable' | 'good' | 'excellent';
  transcript_length_chars: number;
  entities_count: number;
  rag_used: boolean;
}
```

### **Script para Logging Automático**
```typescript
// Añadir a USER_TESTING_LOG.md automáticamente
export class PromptTestingLogger {
  static async logSOAPGeneration(
    version: string, 
    startTime: number, 
    result: SOAPNotes, 
    hadTimeout: boolean,
    sessionContext: any
  ) {
    const metrics: PromptTestingMetrics = {
      prompt_version: version,
      generation_time_ms: Date.now() - startTime,
      timeout_occurred: hadTimeout,
      soap_quality_score: 0, // Mauricio fills this
      content_completeness: this.calculateCompleteness(result),
      // ... other metrics
    };
    
    // Auto-append to USER_TESTING_LOG.md
    await this.appendToTestingLog(metrics);
  }
}
```

---

## 🎯 **IMPLEMENTACIÓN RECOMENDADA PARA PRÓXIMAS 2 SEMANAS**

### **Fase 1: Implementar Prompt Optimizado v2 (Días 1-3)**
```bash
1. Modificar nlpServiceOllama.ts con prompt v2
2. Añadir logging automático de métricas
3. Deploy para testing de Mauricio
4. Recoger datos iniciales
```

### **Fase 2: Implementar Fallback Adaptativo (Días 4-7)**
```bash
1. Añadir sistema de fallback progressive
2. Implementar timeout management inteligente
3. Testing comparativo v1 vs v2
4. Análisis de resultados mid-week
```

### **Fase 3: RAG Optimizado (Días 8-14)**
```bash
1. Implementar RAG selectivo (v3)
2. Optimizar integración PubMed
3. Testing final y comparación completa
4. Documentar recomendaciones finales
```

---

## 📈 **OBJETIVOS DE SUCCESS PARA USER TESTING**

### **Métricas Primarias**
- **Reducir timeouts**: <5% de sesiones (actual: ~15-20%)
- **Mantener calidad**: SOAP score ≥4/5 (actual: ~3.5/5)
- **Mejorar velocidad**: <5s generación (actual: 8-15s)

### **Métricas Secundarias**
- **Satisfacción Mauricio**: ≥8/10 usabilidad
- **Completeness SOAP**: ≥85% campos completos
- **RAG relevance**: ≥70% artículos útiles

### **Success Criteria**
```
✅ 0 timeouts durante 3 días consecutivos
✅ SOAP quality score promedio ≥4.2/5
✅ Generación promedio <6 segundos
✅ Mauricio reporta mejora en workflow
```

---

## 🚀 **PRÓXIMOS PASOS INMEDIATOS**

### **Para Claude (Esta Semana)**
1. ✅ Implementar prompt optimizado v2 en nlpServiceOllama.ts
2. ✅ Añadir sistema de logging automático
3. ✅ Crear tests unitarios para nuevos prompts
4. ✅ Documentar cambios para Mauricio

### **Para Mauricio (Próximas 2 Semanas)**
1. 📝 Usar sistema actualizado en práctica real
2. 📊 Llenar métricas de calidad en USER_TESTING_LOG.md
3. 🔄 Reportar feedback diario sobre timeouts y calidad
4. 🎯 Evaluar satisfacción vs versión anterior

### **Checkpoint Semanal**
- **Viernes Semana 1**: Review métricas, decidir si continuar con v2 o probar v3
- **Viernes Semana 2**: Análisis final, recomendaciones para producción

---

**📅 Última Actualización**: [FECHA]  
**🤖 Autor**: Claude Sonnet  
**👨‍⚕️ Colaborador**: Mauricio Sobarzo Gavilán 