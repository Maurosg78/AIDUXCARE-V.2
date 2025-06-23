# 💰 ANÁLISIS COMPLETO DE ESTRATEGIA DE PRECIOS SEGMENTADA - AIDUXCARE

## 🎯 **RESUMEN EJECUTIVO**

**ESTRATEGIA DE PRECIOS MULTIFACÉTICA** que captura valor máximo de cada segmento del mercado mediante diferenciación por producto, especialidad médica y tipo de cliente.

**NO EXISTE UN "PRECIO PROMEDIO" ÚNICO** - la estrategia utiliza precios diferenciados que optimizan el valor capturado de cada segmento específico.

---

## 🏥 **1. DIFERENTES LÍNEAS DE PRODUCTO**

### **1.1 AiDuxCare "EMR-IA" (Plataforma Nativa Todo-en-Uno)**

**Descripción**: Plataforma EMR completa con IA integrada nativamente
- **Fuente**: `src/pages/PlansPage.tsx` (líneas 66-280)
- **Características**: EMR completo + IA especializada + compliance enterprise
- **Target**: Profesionales y clínicas que buscan solución integral

### **1.2 AiDuxCare "Copilot" (Capa de IA para EMRs Existentes)**

**Descripción**: Servicio de IA que se integra con EMRs existentes
- **Fuente**: `PLAN_NEGOCIOS_AIDUXCARE_V3.md` (líneas 172-200)
- **Características**: APIs modulares, integración con sistemas legacy
- **Target**: Clínicas con EMRs existentes que quieren añadir IA

### **1.3 AI Layer (Línea de Negocio Futura)**

**Descripción**: Venta de IA especializada como servicio a EMRs
- **Fuente**: `PLAN_NEGOCIOS_AIDUXCARE_V3.md` (líneas 177-200)
- **Características**: Setup fee + SaaS mensual + revenue share
- **Target**: EMRs que quieren integrar IA sin desarrollo interno

---

## 👥 **2. DIFERENTES SEGMENTOS DE CLIENTE**

### **2.1 Profesionales Individuales ("Particulares")**

**Características**:
- Fisioterapeutas, psicólogos, médicos generales
- Trabajan de forma autónoma o en pequeñas consultas
- Necesitan solución completa pero asequible
- **Fuente**: `src/pages/PlansPage.tsx` (planes individuales)

### **2.2 Clínicas/Empresas ("Enterprise")**

**Características**:
- Clínicas con múltiples profesionales
- Requieren gestión centralizada
- Necesitan compliance enterprise
- **Fuente**: `PLAN_NEGOCIOS_AIDUXCARE_V4.md` (líneas 25-75)

---

## 💰 **3. MATRIZ DE PRECIOS COMPLETA**

### **3.1 EMR-IA PARA PROFESIONALES INDIVIDUALES**

| Plan | Precio Mensual | Precio Anual | Especialidad | Límites | Fuente |
|------|----------------|--------------|--------------|---------|---------|
| **Early Adopter** | €29 | €290 | Multi-especialidad | 100 iniciales + 250 seguimientos | `PlansPage.tsx:66-100` |
| **Starter** | €29 | €290 | General | 8 iniciales + 15 seguimientos | `PlansPage.tsx:225-250` |
| **Psychology Pro** | €79 | €790 | Psicología | 8 iniciales + 20 seguimientos | `PlansPage.tsx:102-150` |
| **Physio Pro** | €69 | €690 | Fisioterapia | 10 iniciales + 25 seguimientos | `PlansPage.tsx:152-200` |
| **General Pro** | €59 | €590 | Multi-especialidad | 12 iniciales + 18 seguimientos | `PlansPage.tsx:200-225` |

### **3.2 EMR-IA PARA CLÍNICAS/ENTERPRISE**

| Plan | Precio Mensual | Precio Anual | Características | Límites | Fuente |
|------|----------------|--------------|-----------------|---------|---------|
| **Clinic** | €149 | €1,490 | Multi-usuario (5 profesionales) | 50 iniciales + 100 seguimientos | `PlansPage.tsx:250-280` |

### **3.3 COPILOT PARA EMRs EXISTENTES**

| Tipo Cliente | Setup Fee | SaaS Mensual | Revenue Share | Fuente |
|--------------|-----------|--------------|---------------|---------|
| **Clínicas Medianas** | €50K | €5K/mes | 15% incremento | `PLAN_NEGOCIOS_V3.md:182-187` |
| **Hospitales Grandes** | €200K | €15K/mes | 15% incremento | `PLAN_NEGOCIOS_V3.md:182-187` |

### **3.4 AI LAYER (FUTURO - AÑO 4+)**

| Servicio | Precio | Modelo | Proyección | Fuente |
|----------|--------|--------|------------|---------|
| **Integración EMR** | €50K-200K | Setup fee | 10-25 clientes | `PLAN_NEGOCIOS_V3.md:187-190` |
| **SaaS Mensual** | €5K/mes | Recurring | €2-4M ARR | `PLAN_NEGOCIOS_V3.md:187-190` |
| **Revenue Share** | 15% | Performance | Margen 85% | `PLAN_NEGOCIOS_V3.md:187-190` |

---

## 📊 **4. SUPUESTOS DE MEZCLA (MIX DE PLANES)**

### **4.1 Mix Esperado en Breakeven (1,850 usuarios)**

| Plan | Usuarios | % Mix | Revenue Mensual | Fuente |
|------|----------|-------|-----------------|---------|
| **Early Adopter** | 100 | 5% | €2,900 | `ANALISIS_FINANCIERO.md:113-120` |
| **Starter** | 400 | 22% | €11,600 | `ANALISIS_FINANCIERO.md:113-120` |
| **Psychology Pro** | 650 | 35% | €51,350 | `ANALISIS_FINANCIERO.md:113-120` |
| **Physio Pro** | 500 | 27% | €34,500 | `ANALISIS_FINANCIERO.md:113-120` |
| **General Pro** | 150 | 8% | €8,850 | `ANALISIS_FINANCIERO.md:113-120` |
| **Clinic** | 50 | 3% | €7,450 | `ANALISIS_FINANCIERO.md:113-120` |
| **TOTAL** | **1,850** | **100%** | **€116,650** | |

### **4.2 Precio Promedio Ponderado por Segmento**

| Segmento | Precio Promedio | Justificación |
|----------|----------------|---------------|
| **Profesionales Individuales** | €58.50 | Mix de planes €29-€79 |
| **Clínicas Enterprise** | €149.00 | Plan Clinic único |
| **GLOBAL PONDERADO** | **€62.00** | 95% individuales + 5% enterprise |

---

## 🎯 **5. ESTRATEGIA DE DIFERENCIACIÓN POR ESPECIALIDAD**

### **5.1 Psychology Pro (€79/mes) - Premium Justificado**

**Características Especializadas**:
- SOAP DSM-5 automático
- Detección riesgo suicida
- Examen estado mental (MSE)
- Escalas psicológicas integradas
- **Fuente**: `PlansPage.tsx:102-150`

**Justificación Precio Premium**:
- Mayor complejidad clínica
- Riesgo legal más alto
- Valor agregado específico
- Menor competencia directa

### **5.2 Physio Pro (€69/mes) - Valor Biomecánico**

**Características Especializadas**:
- SOAP funcional biomecánico
- Análisis patrones movimiento
- Screening neurológico
- Prescripción ejercicios automática
- **Fuente**: `PlansPage.tsx:152-200`

**Justificación Precio Intermedio**:
- Especialización técnica
- Valor funcional claro
- Mercado consolidado

### **5.3 General Pro (€59/mes) - Adaptativo**

**Características Especializadas**:
- SOAP adaptativo multi-especialidad
- Screening amplio
- Diagnóstico diferencial
- Asistente derivación
- **Fuente**: `PlansPage.tsx:200-225`

**Justificación Precio Base**:
- Flexibilidad máxima
- Menor especialización
- Mayor competencia

---

## 💡 **6. ESTRATEGIAS DE PRECIOS AVANZADAS**

### **6.1 Early Adopters Program (€29/mes)**

**Objetivo**: Validación rápida y feedback
- **Descuento**: 63% vs precio final (€79)
- **Limitación**: 100 usuarios máximo
- **Valor**: Feedback directo al desarrollo
- **Fuente**: `PlansPage.tsx:66-100`

### **6.2 Descuentos Anuales**

**Estrategia**: Captura de valor a largo plazo
- **Descuento**: 2 meses gratis (17%)
- **Beneficio**: Cash flow adelantado
- **Fuente**: `PlansPage.tsx:310-325`

### **6.3 Optimización de Costos por Plan**

| Plan | Costo Inicial | Costo Seguimiento | Ahorro | Fuente |
|------|---------------|-------------------|--------|---------|
| **Psychology Pro** | €0.35 | €0.18 | 49% | `PlansPage.tsx:145-150` |
| **Physio Pro** | €0.25 | €0.12 | 52% | `PlansPage.tsx:195-200` |
| **General Pro** | €0.20 | €0.10 | 50% | `PlansPage.tsx:220-225` |

---

## 📈 **7. PROYECCIÓN DE REVENUE POR LÍNEA DE PRODUCTO**

### **7.1 EMR-IA (Línea Principal)**

| Año | Usuarios | ARR | % Crecimiento | Fuente |
|-----|----------|-----|---------------|---------|
| **Año 1** | 500 | €372K | - | `ANALISIS_FINANCIERO.md:133-155` |
| **Año 2** | 1,850 | €1.78M | +378% | `ANALISIS_FINANCIERO.md:156-184` |
| **Año 3** | 2,500 | €2.4M | +35% | `PLAN_NEGOCIOS_V4.md:95-100` |

### **7.2 Copilot (Línea Secundaria)**

| Año | Clientes | ARR | % Revenue Total | Fuente |
|-----|----------|-----|-----------------|---------|
| **Año 2** | 5 | €300K | 14% | `PLAN_NEGOCIOS_V3.md:182-187` |
| **Año 3** | 15 | €900K | 27% | `PLAN_NEGOCIOS_V3.md:182-187` |

### **7.3 AI Layer (Futuro)**

| Año | EMRs Integrados | ARR | Margen | Fuente |
|-----|-----------------|-----|--------|---------|
| **Año 4** | 10 | €2M | 85% | `PLAN_NEGOCIOS_V3.md:187-190` |
| **Año 5** | 25 | €4M | 85% | `PLAN_NEGOCIOS_V3.md:187-190` |

---

## 🎯 **8. CONCLUSIONES ESTRATÉGICAS**

### **8.1 Ventajas de la Estrategia Multifacética**

1. **Captura de Valor Máximo**: Cada segmento paga según su valor percibido
2. **Diferenciación Clara**: Especialización justifica precios premium
3. **Escalabilidad**: Múltiples líneas de revenue
4. **Flexibilidad**: Adaptación a diferentes necesidades del mercado

### **8.2 Riesgos y Mitigaciones**

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Complejidad Precios** | Alta | Medio | Documentación clara |
| **Cannibalización** | Media | Bajo | Diferenciación clara |
| **Confusión Cliente** | Media | Alto | UX optimizada |

### **8.3 Recomendaciones de Implementación**

1. **Lanzar por Fases**: Early Adopters → Especialidades → Enterprise
2. **Métricas Granulares**: Tracking por plan y especialidad
3. **Feedback Continuo**: Ajuste precios basado en adopción
4. **Comunicación Clara**: Valor específico por especialidad

---

## 📋 **9. DOCUMENTOS DE REFERENCIA**

### **9.1 Fuentes Principales**

1. **`src/pages/PlansPage.tsx`** (líneas 66-280): Estructura completa de planes
2. **`PLAN_NEGOCIOS_AIDUXCARE_V3.md`** (líneas 172-200): Estrategia AI Layer
3. **`PLAN_NEGOCIOS_AIDUXCARE_V4.md`** (líneas 25-75): Compliance enterprise
4. **`ANALISIS_FINANCIERO_BREAKEVEN_AIDUXCARE.md`** (líneas 113-120): Mix de planes

### **9.2 Métricas Clave**

- **ARPU Ponderado**: €62/mes
- **Margen Bruto**: 68%
- **LTV/CAC**: 13.1x
- **Churn Rate**: 4%/mes

**La estrategia de precios segmentada de AiDuxCare es sofisticada y bien fundamentada, capturando valor máximo de cada segmento del mercado mediante diferenciación clara por producto, especialidad y tipo de cliente.** 