# 🧪 UAT TAREA 1.1 - CASOS DE PRUEBA PARA VALIDACIÓN

## 📋 **RESUMEN EJECUTIVO**

**Objetivo:** Validación completa de la expansión de la base de datos de banderas rojas  
**Metodología:** 3 casos de prueba específicos con resultados esperados  
**Criterio de Aprobación:** 100% de detección correcta sin falsos positivos  
**Estado:** Listo para ejecución por CTO

---

## 🎯 **CASOS DE PRUEBA DEFINIDOS**

### **TEST CASE 1: SÍNDROME DE CAUDA EQUINA (CASO CRÍTICO)**

#### **📝 Transcripción de Prueba:**
```
Paciente masculino de 45 años refiere dolor lumbar intenso de inicio súbito hace 3 días tras levantar una caja pesada. El dolor se irradia hacia ambas piernas, acompañado de debilidad progresiva. Menciona que ha perdido fuerza en ambos pies y dificultad para caminar. Refiere también pérdida de control de esfínteres desde ayer por la mañana, tanto urinario como fecal. Tiene entumecimiento en la zona de la silla de montar. Niega fiebre, pero comenta que ha bajado 3 kilos en la última semana sin hacer dieta. Al examen físico, se observa debilidad motora en ambas extremidades inferiores, reflejos aquileos abolidos bilateralmente y signos de cauda equina. El paciente está muy ansioso por la pérdida de control urinario y fecal.
```

#### **🚨 Resultados Esperados:**
- **Banderas Rojas Detectadas:** 3-4
- **Severidad CRITICAL:** 2 (pérdida control esfínteres, incontinencia)
- **Severidad HIGH:** 1-2 (pérdida fuerza, debilidad)
- **Recomendación Principal:** "DERIVACIÓN URGENTE a neurocirugía"
- **Score de Riesgo:** 75-85/100

#### **✅ Criterios de Validación:**
- [ ] Detecta "pérdida control esfínteres" como CRITICAL
- [ ] Detecta "incontinencia urinaria" como CRITICAL
- [ ] Detecta "incontinencia fecal" como CRITICAL
- [ ] Detecta "pérdida fuerza" como HIGH
- [ ] Genera recomendación de derivación urgente
- [ ] Score de riesgo >70

---

### **TEST CASE 2: ANTECEDENTES ONCOLÓGICOS + SÍNTOMAS CONSTITUCIONALES**

#### **📝 Transcripción de Prueba:**
```
Paciente femenina de 58 años refiere dolor lumbar crónico de 6 meses de evolución. El dolor es constante, sordo, sin irradiación específica. Menciona que ha perdido 8 kilos en los últimos 3 meses sin hacer dieta ni ejercicio. Tiene antecedentes de cáncer de mama tratado hace 5 años con cirugía, quimioterapia y radioterapia. Actualmente toma tamoxifeno como tratamiento hormonal. Refiere fatiga intensa y pérdida de apetito. Niega fiebre, pero comenta que suda mucho por las noches. Al examen físico, se observa palidez cutánea, dolor a la palpación lumbar bilateral y limitación del rango de movimiento. La paciente está preocupada por la pérdida de peso y la fatiga.
```

#### **🚨 Resultados Esperados:**
- **Banderas Rojas Detectadas:** 3-4
- **Severidad HIGH:** 2-3 (antecedentes cáncer, pérdida peso, bajó peso)
- **Severidad MEDIUM:** 1 (fatiga, sudoración nocturna)
- **Recomendación Principal:** "Evaluar posibilidad de metástasis"
- **Score de Riesgo:** 60-75/100

#### **✅ Criterios de Validación:**
- [ ] Detecta "antecedentes cáncer" como HIGH
- [ ] Detecta "historial cáncer" como HIGH
- [ ] Detecta "pérdida peso" como HIGH
- [ ] Detecta "bajó peso" como HIGH
- [ ] Genera recomendación de evaluación oncológica
- [ ] Score de riesgo >60

---

### **TEST CASE 3: ANTICOAGULANTES + RIESGO HEMORRÁGICO**

#### **📝 Transcripción de Prueba:**
```
Paciente masculino de 72 años refiere dolor en hombro derecho de 2 semanas de evolución tras una caída. El dolor es intenso, especialmente por las noches, y limita el movimiento del brazo. Tiene antecedentes de fibrilación auricular y toma warfarina desde hace 3 años. También toma aspirina por recomendación médica. Refiere que ha notado moretones frecuentes en los brazos y que cualquier golpe menor le produce hematomas grandes. Al examen físico, se observa dolor a la palpación en la región deltoidea, limitación del rango de movimiento y múltiples equimosis en ambos brazos. El paciente está preocupado por los moretones y el dolor intenso.
```

#### **🚨 Resultados Esperados:**
- **Banderas Rojas Detectadas:** 2-3
- **Severidad MEDIUM:** 2-3 (anticoagulantes, warfarina, sangrado)
- **Severidad HIGH:** 0-1 (dependiendo de interpretación de moretones)
- **Recomendación Principal:** "Verificar INR antes de procedimientos"
- **Score de Riesgo:** 40-55/100

#### **✅ Criterios de Validación:**
- [ ] Detecta "anticoagulantes" como MEDIUM
- [ ] Detecta "warfarina" como MEDIUM
- [ ] Detecta "sangrado" como HIGH (si interpreta moretones como sangrado)
- [ ] Genera recomendación de verificar coagulación
- [ ] Score de riesgo 40-60

---

### **TEST CASE 4: CONSULTA ESTÁNDAR SIN BANDERAS ROJAS (PRUEBA DE REGRESIÓN)**

#### **📝 Transcripción de Prueba:**
```
Paciente femenina de 35 años refiere dolor lumbar mecánico de 2 semanas de evolución tras hacer ejercicio intenso en el gimnasio. El dolor es localizado en la región lumbar baja, sin irradiación, y mejora con el reposo. Niega antecedentes de trauma, fiebre, pérdida de peso o alteraciones neurológicas. No toma medicamentos crónicos y no tiene alergias conocidas. Al examen físico, se observa dolor a la palpación en la región lumbar baja, ligera limitación del rango de movimiento en flexión y extensión, y buena fuerza muscular en extremidades inferiores. Los reflejos son normales y simétricos. La paciente desea tratamiento para el dolor y ejercicios de rehabilitación.
```

#### **🚨 Resultados Esperados:**
- **Banderas Rojas Detectadas:** 0-1 (máximo)
- **Severidad CRITICAL:** 0
- **Severidad HIGH:** 0
- **Severidad MEDIUM:** 0-1 (si detecta "dolor lumbar" como síntoma)
- **Recomendación Principal:** Ninguna crítica
- **Score de Riesgo:** 10-25/100

#### **✅ Criterios de Validación:**
- [ ] NO detecta banderas rojas CRITICAL
- [ ] NO detecta banderas rojas HIGH
- [ ] Máximo 1 bandera roja MEDIUM (dolor lumbar)
- [ ] Score de riesgo <30
- [ ] No genera recomendaciones críticas

---

## 🔧 **SCRIPTS DE PRUEBA PREPARADOS**

### **📁 Archivos Creados:**
1. **`uat_test_case_1.ts`** - Síndrome de cauda equina
2. **`uat_test_case_2.ts`** - Antecedentes oncológicos
3. **`uat_test_case_3.ts`** - Anticoagulantes
4. **`uat_test_case_4.ts`** - Consulta estándar (regresión)
5. **`uat_run_all_tests.ts`** - Ejecutar todos los tests

### **🚀 Comandos de Ejecución:**
```bash
# Ejecutar test individual
npx tsx uat_test_case_1.ts

# Ejecutar todos los tests
npx tsx uat_run_all_tests.ts

# Ejecutar con validación automática
npx tsx uat_run_all_tests.ts --validate
```

---

## 📊 **CRITERIOS DE APROBACIÓN UAT**

### **✅ APROBACIÓN AUTOMÁTICA (Todos los criterios deben cumplirse):**

#### **Test Case 1 (Síndrome de Cauda Equina):**
- [ ] Detecta al menos 2 banderas rojas CRITICAL
- [ ] Incluye "pérdida control esfínteres" como CRITICAL
- [ ] Genera recomendación de derivación urgente
- [ ] Score de riesgo >70

#### **Test Case 2 (Antecedentes Oncológicos):**
- [ ] Detecta "antecedentes cáncer" como HIGH
- [ ] Detecta "pérdida peso" como HIGH
- [ ] Genera recomendación de evaluación oncológica
- [ ] Score de riesgo >60

#### **Test Case 3 (Anticoagulantes):**
- [ ] Detecta "anticoagulantes" como MEDIUM
- [ ] Detecta "warfarina" como MEDIUM
- [ ] Genera recomendación de verificar coagulación
- [ ] Score de riesgo 40-60

#### **Test Case 4 (Regresión):**
- [ ] NO detecta banderas rojas CRITICAL
- [ ] NO detecta banderas rojas HIGH
- [ ] Score de riesgo <30
- [ ] Máximo 1 bandera roja MEDIUM

### **🎯 MÉTRICAS GLOBALES:**
- **Precisión de detección:** >95%
- **Tasa de falsos positivos:** <5%
- **Tiempo de procesamiento:** <10ms por caso
- **Cobertura de síntomas críticos:** 100% de los casos de prueba

---

## 🚀 **INSTRUCCIONES PARA EL CTO**

### **📋 PASOS PARA EJECUTAR EL UAT:**

1. **Verificar entorno:**
   ```bash
   npm install
   npm run build
   ```

2. **Ejecutar tests individuales:**
   ```bash
   npx tsx uat_test_case_1.ts
   npx tsx uat_test_case_2.ts
   npx tsx uat_test_case_3.ts
   npx tsx uat_test_case_4.ts
   ```

3. **Ejecutar validación completa:**
   ```bash
   npx tsx uat_run_all_tests.ts --validate
   ```

4. **Revisar resultados:**
   - Verificar que cada test case cumple los criterios esperados
   - Confirmar que no hay falsos positivos en el test de regresión
   - Validar que las recomendaciones son clínicamente apropiadas

### **✅ CRITERIO DE APROBACIÓN:**
- **Todos los test cases deben pasar** con los resultados esperados
- **No debe haber falsos positivos** en el test de regresión
- **Las recomendaciones deben ser clínicamente apropiadas**
- **El rendimiento debe ser aceptable** (<10ms por caso)

---

## 📞 **CONTACTO Y SOPORTE**

**Desarrollador:** Claude Sonnet 4  
**Estado:** Listo para UAT  
**Documentación:** Completa  
**Scripts:** Preparados y probados  

**El entorno de pruebas está completamente preparado para la validación del CTO.**

---

**Documento generado:** Claude Sonnet 4  
**Fecha:** Junio 2025  
**Estado:** Listo para UAT  
**Próximo:** Ejecución de pruebas por CTO 