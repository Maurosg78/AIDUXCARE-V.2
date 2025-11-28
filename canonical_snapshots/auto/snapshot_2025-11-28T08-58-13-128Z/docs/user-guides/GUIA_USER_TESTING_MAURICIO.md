# 🧪 GUÍA DE USER TESTING - MAURICIO SOBARZO
**Consolidación MVP AiDuxCare V.2 - Fase Testing Prompts**

---

## 🎯 **OBJETIVO DE LAS PRÓXIMAS 2 SEMANAS**

Validar y optimizar el sistema de prompts de Ollama para eliminar timeouts y maximizar calidad de notas SOAP en condiciones reales de práctica privada.

### **Problema Principal**
- ❌ Timeouts frecuentes en generación SOAP (especialmente sesiones >30min)
- ❌ Prompts demasiado largos causan demoras
- ❌ Inconsistencia en calidad de notas

### **Solución Implementada**
- ✅ Prompt optimizado v2: 70% más corto, timeout 10s
- ✅ Sistema A/B testing automático
- ✅ Logging automático de métricas
- ✅ Widget de control en tiempo real

---

## 📅 **PLAN SEMANAL DETALLADO**

### **SEMANA 1 (Días 1-7): Comparación Intensiva**

#### **OBJETIVO:** Comparar prompt original vs optimizado v2

**Días 1-3: Prompt Original**
```bash
1. Iniciar http://localhost:5173/advanced-ai-demo
2. Clic en widget 🧪 (esquina inferior derecha)
3. Configurar: "Original" + Modo Testing ON
4. Realizar 2-3 sesiones reales por día
5. Anotar en USER_TESTING_LOG.md:
   - ¿Hubo timeouts?
   - Tiempo de generación
   - Calidad SOAP (1-5)
   - Observaciones específicas
```

**Días 4-7: Prompt Optimizado v2**
```bash
1. Clic en widget 🧪
2. Configurar: "Optimizado v2" + Modo Testing ON
3. Realizar misma cantidad de sesiones
4. Anotar métricas comparativas
5. Evaluar diferencias percibidas
```

#### **Métricas Críticas Semana 1:**
- [ ] Timeouts por día (meta: <1 por día)
- [ ] Tiempo promedio generación (meta: <8s)
- [ ] Calidad SOAP promedio (meta: ≥4.0/5)
- [ ] Satisfacción workflow (meta: ≥7/10)

### **SEMANA 2 (Días 8-14): Refinamiento y Validación**

#### **OBJETIVO:** Implementar mejoras finales y validar para producción

**Días 8-10: Testing Prompt v3 (Adaptativo)**
```bash
1. Usar nueva versión con RAG adaptativo
2. Evaluar mejora en relevancia científica
3. Validar estabilidad del sistema
```

**Días 11-14: Validación Final**
```bash
1. Usar mejor prompt identificado
2. Testing intensivo workflow completo
3. Documentar decisión final
4. Preparar recomendaciones producción
```

---

## 🖥️ **INSTRUCCIONES TÉCNICAS**

### **Inicio Rápido**
```bash
# 1. Asegurar Ollama corriendo
ollama serve

# 2. Verificar modelo
ollama list
# (debe mostrar llama3.2:3b)

# 3. Iniciar AiDuxCare
npm run dev
# → http://localhost:5173

# 4. Ir a Advanced AI Demo
http://localhost:5173/advanced-ai-demo
```

### **Control A/B Testing**

#### **Widget de Control 🧪**
- **Ubicación:** Esquina inferior derecha (ícono 🧪)
- **Función:** Alternar entre prompts sin reiniciar
- **Auto-log:** Registra métricas automáticamente

#### **Configuraciones Disponibles:**
1. **Original + Testing OFF:** Uso normal sin logging
2. **Original + Testing ON:** Usa prompt original con métricas
3. **Optimizado v2 + Testing ON:** Usa prompt optimizado con métricas
4. **Alternar Rápido:** Botón para cambiar inmediatamente

### **Interpretación de Métricas**

#### **En Consola del Navegador (F12)**
```javascript
// Ejemplo de log automático:
📊 Testing Metrics: {
  prompt_version: "v2",
  processing_time_ms: 4200,
  timeout_occurred: false,
  soap_confidence: 0.89,
  transcript_length: 450,
  entities_count: 6
}
```

#### **Alertas a Monitorear:**
- 🔴 `timeout_occurred: true` → Anotar inmediatamente
- 🟡 `processing_time_ms > 8000` → Sesión lenta
- 🟢 `soap_confidence > 0.8` → Calidad alta

---

## 📊 **PROCESO DE DOCUMENTACIÓN**

### **USER_TESTING_LOG.md - Completar Diariamente**

#### **Tabla Principal (NLP - Generación SOAP):**
```markdown
| Fecha | Tiempo Gen | Calidad S | Calidad O | Calidad A | Calidad P | Timeout? | Notas |
|-------|------------|-----------|-----------|-----------|-----------|----------|-------|
| 15/01 | 4200ms     | 4         | 5         | 4         | 4         | No       | v2 más fluido |
```

#### **Observaciones Cualitativas Clave:**
```markdown
### 📝 Observaciones NLP
- SOAP más útil en: [tipos de casos específicos]
- Entidades mejor detectadas: [dolor, movimiento, etc.]
- Información que siempre falta: [grados ROM, escalas, etc.]
- Timeouts ocurren cuando: [sesiones largas, múltiples síntomas, etc.]
```

### **Comparación Semanal Obligatoria**

#### **End of Week 1:**
```markdown
### Resumen Semana 1
✅ Prompt Original (Días 1-3):
- Timeouts: X de Y sesiones
- Tiempo promedio: X ms
- Calidad SOAP promedio: X/5

✅ Prompt Optimizado v2 (Días 4-7):
- Timeouts: X de Y sesiones  
- Tiempo promedio: X ms
- Calidad SOAP promedio: X/5

🎯 GANADOR: [Original/v2] porque [razones específicas]
```

---

## 🚨 **TROUBLESHOOTING RÁPIDO**

### **Problemas Comunes:**

#### **1. Widget 🧪 no aparece**
```bash
# Solución:
- Refrescar página (F5)
- Verificar en esquina inferior derecha
- Clic en cualquier espacio vacío
```

#### **2. Timeouts constantes**
```bash
# Verificar:
ollama ps  # ¿Modelo cargado?
ollama serve --verbose  # ¿Errores en logs?

# Si persiste:
- Usar prompt v2 inmediatamente
- Documentar frecuencia exacta
```

#### **3. Métricas no aparecen en consola**
```bash
# Solución:
- F12 → Console
- Habilitar "Modo Testing" en widget
- Verificar checkbox marcado
```

#### **4. Audio no funciona**
```bash
# Verificar:
- Permisos micrófono (navegador)
- Usar Chrome/Edge (preferido)
- Probar demo simulado primero
```

---

## 🎯 **CRITERIOS DE ÉXITO**

### **Métricas Cuantitativas:**
- [ ] **Timeouts:** <5% de sesiones total
- [ ] **Velocidad:** <6s promedio generación  
- [ ] **Calidad:** ≥4.2/5 SOAP promedio
- [ ] **Consistencia:** <20% variación día a día

### **Métricas Cualitativas:**
- [ ] **Workflow:** Más fluido que versión anterior
- [ ] **Confianza:** Puedo usar en práctica real sin supervisión
- [ ] **Utilidad:** Notas SOAP ahorro >50% tiempo documentación
- [ ] **Precisión:** <10% correcciones manuales necesarias

### **Criterio de Decisión Final:**
```markdown
¿El sistema está listo para práctica diaria sin supervisión técnica?

SÍ = Implementar en producción
NO = Documentar limitaciones específicas y plan de mejora
```

---

## 📞 **SOPORTE DURANTE TESTING**

### **Contacto Inmediato:**
- **Chat:** Continuar conversación actual con Claude
- **Documentar:** Todos los issues en USER_TESTING_LOG.md
- **Screenshot:** Cualquier error o comportamiento extraño

### **Información Útil para Reportes:**
1. Fecha/hora exacta del issue
2. Configuración del widget (original/v2, testing on/off)
3. Paso específico donde ocurrió
4. Screenshot de consola (F12) si hay errores
5. Contexto de la sesión (tipo paciente, duración, etc.)

---

## 🎉 **OBJETIVO FINAL**

Al final de estas 2 semanas tendremos:

✅ **Sistema optimizado** sin timeouts para práctica diaria  
✅ **Documentación validada** de performance real  
✅ **Decisión informada** sobre mejor configuración  
✅ **Métricas concretas** para presentar al profesor  
✅ **Confianza profesional** en el sistema para pacientes reales  

---

**📅 Período:** 15 enero - 31 enero 2025  
**👨‍⚕️ Tester Principal:** Mauricio Sobarzo Gavilán  
**🤖 Soporte Técnico:** Claude Sonnet (continuo)  
**🎯 Meta:** Sistema consolidado listo para presentación final 