# 📊 LOG DE USER TESTING - AiDuxCare V.2

## 📋 **INFORMACIÓN GENERAL**
- **Período de Testing**: [FECHA_INICIO] - [FECHA_FIN]
- **Tester**: Mauricio Sobarzo (Fisioterapeuta)
- **Contexto**: Práctica privada real
- **Objetivo**: Validar pipeline completo en condiciones reales

---

## 🎤 **EVALUACIÓN STT (Web Speech API)**

### **Métrica 1: Precisión de Transcripción**
| Fecha | Duración Sesión | Precisión Estimada (%) | Errores Principales | Notas |
|-------|-----------------|------------------------|-------------------|-------|
| | | | | |

### **Métrica 2: Detección de Hablantes**
| Fecha | Sesión | Profesional Correcto | Paciente Correcto | Errores de Detección | Notas |
|-------|--------|---------------------|-------------------|-------------------|-------|
| | | ✅/❌ | ✅/❌ | | |

### **Métrica 3: Rendimiento Técnico**
| Fecha | Ruido Ambiente | Latencia (seg) | Interrupciones | Navegador | Notas |
|-------|----------------|----------------|----------------|-----------|-------|
| | Alto/Medio/Bajo | | | Chrome/Edge | |

### **📝 Observaciones STT**
```
- Funciona mejor cuando: [describir condiciones óptimas]
- Problemas recurrentes: [describir patrones de error]
- Sugerencias de mejora: [ideas para optimizar]
```

---

## 🧠 **EVALUACIÓN NLP (Ollama Llama 3.2)**

### **Métrica 1: Extracción de Entidades Clínicas**
| Fecha | Entidades Detectadas | Precisión | Entidades Perdidas | Falsos Positivos | Notas |
|-------|---------------------|-----------|-------------------|------------------|-------|
| | | Buena/Media/Mala | | | |

### **Métrica 2: Generación de Notas SOAP**
| Fecha | Tiempo Generación | Calidad S | Calidad O | Calidad A | Calidad P | Timeout? | Notas |
|-------|------------------|-----------|-----------|-----------|-----------|----------|-------|
| | seg | 1-5 | 1-5 | 1-5 | 1-5 | Sí/No | |

**Escala de Calidad SOAP (1-5):**
- 1: Inutilizable
- 2: Información básica, muchos errores
- 3: Información útil, algunos errores
- 4: Información muy útil, pocos errores  
- 5: Información precisa y completa

### **📝 Observaciones NLP**
```
- SOAP más útil en: [tipos de casos]
- Entidades mejor detectadas: [ej. dolor, movimiento, etc.]
- Información que siempre falta: [ej. grados de movimiento]
- Timeouts ocurren cuando: [condiciones específicas]
```

---

## 🔍 **EVALUACIÓN RAG (PubMed)**

### **Métrica 1: Relevancia de Artículos**
| Fecha | Query Clínica | Artículos Top 3 | Relevancia (1-5) | Clasificación Evidencia | Útil? | Notas |
|-------|--------------|-----------------|------------------|------------------------|-------|-------|
| | | | | | Sí/No | |

### **Métrica 2: Performance de Búsqueda**
| Fecha | Tiempo Búsqueda | Artículos Encontrados | Enlaces Funcionan | Fecha Artículos | Notas |
|-------|----------------|----------------------|-------------------|----------------|-------|
| | seg | | ✅/❌ | 2024/2025 | |

### **📝 Observaciones RAG**
```
- Búsquedas más exitosas para: [tipos de condiciones]
- Artículos más útiles: [especialidades/revistas]
- Clasificación de evidencia es: [precisa/confusa]
- Mejoras sugeridas: [ideas]
```

---

## ⚠️ **EVALUACIÓN AGENTES Y ALERTAS**

### **Métrica 1: Advertencias de Iatrogenia/Legales**
| Fecha | Advertencia Generada | Pertinente? | Falsa Alarma? | Faltó Advertencia? | Notas |
|-------|---------------------|-------------|---------------|-------------------|-------|
| | | Sí/No | Sí/No | Sí/No | |

### **Métrica 2: Sugerencias de Tratamiento**
| Fecha | Sugerencia | Evidencia Citada | Aplicable? | Útil? | Notas |
|-------|------------|------------------|------------|-------|-------|
| | | | Sí/No | Sí/No | |

### **📝 Observaciones Agentes**
```
- Alertas más valiosas: [tipos]
- Sugerencias más útiles: [categorías]
- Casos donde faltó alerta: [describir]
- Nivel de confianza general: [alto/medio/bajo]
```

---

## 🔄 **EVALUACIÓN FLUJO COMPLETO**

### **Métrica 1: Tiempo Pipeline Completo**
| Fecha | Duración Sesión | Tiempo Procesamiento | Tiempo Total | Pipeline Completo? | Notas |
|-------|----------------|---------------------|--------------|-------------------|-------|
| | min | min | min | Sí/No | |

### **Métrica 2: Usabilidad UI**
| Fecha | Navegación Fácil? | Información Clara? | Acciones Intuitivas? | Errores UI? | Notas |
|-------|------------------|-------------------|---------------------|-------------|-------|
| | Sí/No | Sí/No | Sí/No | Sí/No | |

### **📝 Observaciones Generales**
```
- Flujo más eficiente: [describir]
- Puntos de fricción: [problemas UX]
- Funcionalidades más valoradas: [features]
- Funcionalidades menos usadas: [features]
```

---

## 🚨 **BUGS Y PROBLEMAS TÉCNICOS**

| Fecha | Descripción Bug | Severidad | Reprodución | Estado | Notas |
|-------|----------------|-----------|-------------|--------|-------|
| | | Alta/Media/Baja | Pasos | Pendiente/Resuelto | |

---

## 💡 **SUGERENCIAS DE MEJORA**

### **Prioridad Alta**
```
1. [Mejora crítica 1]
2. [Mejora crítica 2]
3. [Mejora crítica 3]
```

### **Prioridad Media**
```
1. [Mejora importante 1]
2. [Mejora importante 2]
```

### **Prioridad Baja**
```
1. [Mejora nice-to-have 1]
2. [Mejora nice-to-have 2]
```

---

## 📈 **RESUMEN SEMANAL**

### **Semana 1 (Fechas)**
```
✅ Fortalezas principales:
❌ Problemas principales:
🔧 Mejoras urgentes:
📊 Satisfacción general: [1-10]
```

### **Semana 2 (Fechas)**
```
✅ Fortalezas principales:
❌ Problemas principales:
🔧 Mejoras urgentes:
📊 Satisfacción general: [1-10]
📈 Evolución vs Semana 1:
```

---

## 🎯 **RECOMENDACIONES FINALES**

### **¿Listo para Producción?**
```
- STT: Sí/No - [justificación]
- NLP: Sí/No - [justificación]  
- RAG: Sí/No - [justificación]
- Agentes: Sí/No - [justificación]
- UI/UX: Sí/No - [justificación]
```

### **Próximos Pasos Sugeridos**
```
1. [Prioridad 1]
2. [Prioridad 2]
3. [Prioridad 3]
```

---

**📅 Última Actualización**: [FECHA]
**👨‍⚕️ Evaluador**: Mauricio Sobarzo Gavilán
**🤖 Asistente**: Claude Sonnet 

## 🧪 **A/B TESTING - PROMPT OPTIMIZATION (SEMANAS 1-2)**

### **Tabla de Comparación Prompt Original vs Optimizado v2**

| Fecha | Hora | Prompt Ver | Tiempo Gen (ms) | Timeout? | Calidad S (1-5) | Calidad O (1-5) | Calidad A (1-5) | Calidad P (1-5) | Transcripción Chars | Entidades Count | Notas/Observaciones |
|-------|------|------------|----------------|----------|-----------------|-----------------|-----------------|-----------------|-------------------|-----------------|-------------------|
| | | | | | | | | | | | |

### **Resumen por Versión de Prompt**

#### **Prompt Original (Días 1-3)**
- **Sesiones totales:** _____
- **Timeouts:** _____ de _____ sesiones (____%)
- **Tiempo promedio:** _____ ms
- **Calidad SOAP promedio:** _____/5
- **Observaciones principales:**
  ```
  - 
  - 
  - 
  ```

#### **Prompt Optimizado v2 (Días 4-7)**
- **Sesiones totales:** _____
- **Timeouts:** _____ de _____ sesiones (____%)
- **Tiempo promedio:** _____ ms
- **Calidad SOAP promedio:** _____/5
- **Observaciones principales:**
  ```
  - 
  - 
  - 
  ```

### **📊 Análisis Comparativo Final**

#### **GANADOR:** [ ] Original  [ ] Optimizado v2

#### **Razones de la decisión:**
```
1. 
2. 
3. 
```

#### **Mejoras detectadas con Optimizado v2:**
```
✅ 
✅ 
✅ 
```

#### **Limitaciones detectadas con Optimizado v2:**
```
❌ 
❌ 
❌ 
```

### **🎯 Recomendación para Semana 2:**
```
[ ] Continuar con Prompt Original porque: ____________
[ ] Continuar con Prompt Optimizado v2 porque: ____________
[ ] Implementar Prompt v3 con mejoras: ____________
```

--- 