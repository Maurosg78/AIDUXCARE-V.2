# 💰 TOKEN PRICING STRATEGY - AiDuxCare

**Status:** ✅ **RELEVANT - ACTIVE STRATEGY**  
**Last Updated:** 2025-11-19  
**Market:** Canada · en-CA · Private Clinic Activity-Based Pricing

---

## 🎯 MODELO DE NEGOCIO: TOKEN-BASED SUBSCRIPTION

### **Concepto Core:**

AiDuxCare se vende por **precio X** con **X tokens** mensuales incluidos para uso del fisioterapeuta. Los tokens se calculan basados en **promedios de actividad fisioterapéutica en clínica privada en Canadá**. Si el fisio se queda corto en el mes, puede comprar tokens adicionales.

---

## 📊 CÁLCULO DE TOKENS: BASADO EN ACTIVIDAD REAL

### **Tokens por Tipo de Sesión:**

Los valores de tokens son **diferentes** según el tipo de sesión y complejidad:

#### **Sesiones Clínicas:**

| Tipo de Sesión | Tokens | Descripción |
|----------------|--------|-------------|
| **Evaluación Inicial** | X tokens | Primera visita, evaluación completa, más tokens |
| **Follow-up** | Y tokens | Visitas de seguimiento, menos tokens (Y < X) |

**Razón:** Las evaluaciones iniciales requieren más procesamiento (anamnesis completa, evaluación física extensa, análisis clínico profundo), mientras que los follow-ups son más rápidos y requieren menos tokens.

---

## 📋 TIPOS DE SOAP E INFORMES

### **1. SOAP Normal (Incluido en Plan Base)**

**Características:**
- Formato estándar SOAP (Subjective, Objective, Assessment, Plan)
- **Copy-paste directo** para EMR del fisio
- Uso de tokens **normal** (según tipo de sesión)
- Disponible para todas las suscripciones

**Costo de Tokens:**
- Evaluación inicial: X tokens
- Follow-up: Y tokens

---

### **2. SOAP Premium / Informes Especializados (Suscripción Premium o Tokens Adicionales)**

**Características:**
- Formatos especializados para casos específicos
- **Informes para accidentes laborales** (WSIB - Workplace Safety and Insurance Board)
- **Informes para accidentes de tránsito** (MVA - Motor Vehicle Accident)
- Informes para **colegios profesionales** (CPO - College of Physiotherapists of Ontario)
- Informes para **aseguradoras** (formato específico requerido)
- Informes de **actividad y tratamiento** para marketing estratégico

**Costo de Tokens:**
- **Premium:** Incluido en suscripción premium (límite mensual)
- **Pay-per-use:** Consumo adicional de tokens (más alto que SOAP normal)

**Razón del Costo Premium:**
- Estos informes consumen **mucho tiempo** manualmente
- Requieren **formato muy específico** y detallado
- Son una de las características **más solicitadas** por los fisios
- Procesamiento más complejo (formato especializado, cumplimiento regulatorio)

---

## 🎨 VISIBILIDAD EN UI

### **Command Center:**
- **Widget de Tokens:** Mostrar tokens restantes del mes
- **Barra de Progreso:** Visual del uso vs límite
- **Desglose de uso:** Tokens por tipo (evaluación, follow-up, informes premium)
- **Alertas:** Notificación cuando quedan <20% tokens
- **Botón "Comprar Tokens":** Acceso rápido a compra adicional
- **Indicador de Plan:** Mostrar si tiene suscripción premium o básica

### **Professional Workflow:**
- **Indicador en Header:** Tokens restantes siempre visible
- **Costo antes de generar:** Mostrar tokens que costará cada operación
  - "Generar SOAP Normal: X tokens"
  - "Generar Informe WSIB: Z tokens (Premium)"
- **Warning antes de operaciones:** Si quedan pocos tokens
- **Selector de tipo de informe:** 
  - SOAP Normal (copy-paste EMR)
  - Informe WSIB (accidentes laborales)
  - Informe MVA (accidentes tránsito)
  - Informe CPO (colegio profesional)
  - Informe Aseguradora
  - Informe Marketing (actividad/tratamiento)
- **Link a compra:** Si se queda sin tokens durante workflow
- **Indicador Premium:** Mostrar si tiene acceso a informes premium

---

## 📈 MÉTRICAS Y TRACKING

### **Métricas Clave:**
- Tokens utilizados por fisio
- Tokens utilizados por tipo de sesión (evaluación vs follow-up)
- Tokens utilizados por tipo de informe (normal vs premium)
- Tokens comprados adicionales
- Tasa de agotamiento mensual
- ROI por fisio
- Uso de informes premium vs normal

### **Firestore Collections:**
- `professional_subscriptions/{professionalId}` - Plan, tokens, tipo de suscripción
- `token_usage/{usageId}` - Log de uso de tokens (tipo de sesión, tipo de informe)
- `token_purchases/{purchaseId}` - Compras adicionales
- `soap_reports/{reportId}` - Tipo de informe generado (normal, WSIB, MVA, etc.)

---

## 💡 ESTRATEGIA DE PRICING - REVISADA (REALISTA)

### **Principios Revisados:**
1. **Competitivo:** Pricing alineado con mercado canadiense ($25-35 CAD base)
2. **Basado en actividad real:** Tokens calculados según promedios de clínica privada canadiense
3. **Diferenciación por complejidad:** Evaluación inicial > Follow-up
4. **Valor premium justificado:** Informes especializados (WSIB, MVA) justifican tokens premium
5. **Transparente:** Siempre visible cuánto cuesta cada operación
6. **Flexible:** Compra adicional cuando se necesite

### **Competitive Analysis - Realidad de Mercado:**

**Jane.app:**
- Basic: ~$30 CAD/mes (sin AI scribe)
- + AI Scribe: ~$45 CAD/mes ($15 USD add-on)
- Posicionamiento: EMR completo

**AiduxCare:**
- Base: $25-35 CAD/mes (companion tool)
- Premium: $45-55 CAD/mes (con WSIB/MVA)
- Posicionamiento: Herramienta especializada, no EMR completo

**Diferenciación:**
- **WSIB/MVA automation:** Capacidad única, justifica premium
- **Canadian compliance:** Especialización regulatoria
- **Companion flexibility:** Funciona con EMR existente
- **Time savings:** 2-4 horas → 5 minutos para informes especializados

### **Value-Based Pricing Justification:**

**WSIB Report Value:**
- Tiempo manual: 2-4 horas
- Tarifa fisioterapeuta: $100-150 CAD/hora
- Valor total: $200-600 CAD
- Costo tokens: $5-15 CAD (10-15 tokens × $0.50-1.00)
- **ROI:** 13-40x return on investment

**MVA Report Value:**
- Similar a WSIB
- Cumplimiento regulatorio crítico
- Formato específico requerido
- **ROI:** Similar a WSIB

**Estrategia:** Pricing competitivo en base, premium justificado en especialización

---

## 🔄 RENOVACIÓN Y LÍMITES

### **Ciclo Mensual:**
- Tokens se renuevan el día X de cada mes
- Tokens no utilizados: Definir política (acumulan o no)
- Tokens adicionales comprados expiran en Y días

### **Límites de Uso:**
- Límite diario opcional para prevenir abuso
- Alertas cuando se acerca al límite mensual
- Bloqueo automático cuando se agotan tokens (con opción de compra)
- Límite de informes premium en plan básico (upgrade a premium para más)

---

## 📊 ESTRUCTURA DE PLANES - PRICING REALISTA

### **Contexto Competitivo:**
- **Jane.app Basic:** ~$30 CAD/mes (sin AI scribe)
- **Jane.app + AI Scribe:** ~$45 CAD/mes ($15 USD add-on)
- **AiduxCare:** Companion tool (no EMR completo)
- **Posicionamiento:** Herramienta especializada con capacidades únicas (WSIB/MVA)

### **Plan Base (Competitive Companion):**
- **Precio:** $25-35 CAD/mes
- **Tokens incluidos:** 50-100 tokens/mes
- **SOAP Normal:** ✅ Ilimitado (dentro de tokens)
- **Informes Premium:** ❌ No incluido (requiere upgrade o tokens adicionales)
- **Tokens adicionales:** $0.50-1.00 CAD por token

**Target ARPU:** $35-50 CAD (realista vs competencia)

### **Plan Premium (Specialized Reports):**
- **Precio:** $45-55 CAD/mes
- **Tokens incluidos:** 100-150 tokens/mes
- **SOAP Normal:** ✅ Ilimitado (dentro de tokens)
- **Informes Premium:** ✅ Incluido (límite mensual de informes premium)
- **Tokens adicionales:** $0.50-1.00 CAD por token

**Value Proposition:** Acceso a informes WSIB/MVA que ahorran 2-4 horas de trabajo manual

### **Pay-Per-Use Option (Token-First Model):**
- **Base Plan:** $19.99 CAD/mes + tokens mínimos
- **SOAP Normal:** 1-2 tokens por generación
- **WSIB Report:** 10-15 tokens (alto valor)
- **MVA Report:** 10-15 tokens (alto valor)
- **Justificación:** WSIB report ahorra 2-4 horas @ $100-150/hora = $200-600 valor

**Target ARPU:** $30-40 CAD con picos de uso

---

## 🚀 IMPLEMENTACIÓN PRIORITY

**Status:** 🔴 **HIGH PRIORITY - MVP FEATURE**

**Required for:**
- Revenue generation
- User engagement tracking
- Business model validation
- Investor presentations
- Differentiation (informes WSIB/MVA)

**Timeline:** Post-MVP (Days 8-14)

**Features a Implementar:**
1. Sistema de tokens (base)
2. Detección de tipo de sesión (evaluación vs follow-up)
3. Selector de tipo de informe (normal vs premium)
4. Generación de informes WSIB/MVA
5. Generación de informes CPO/Aseguradoras
6. Generación de informes marketing
7. UI de tokens en Command Center
8. UI de tokens en Workflow
9. Sistema de compra de tokens adicionales

---

## 📝 NOTAS TÉCNICAS

### **Detección de Tipo de Sesión:**
- Ya implementado: `detectVisitType()` en `SOAPContextBuilder.ts`
- Tipos: `'initial'` (evaluación) vs `'follow-up'`
- Lógica: Basada en existencia de SOAP previo y días desde última visita

### **Tipos de Informes a Implementar:**
1. **SOAP Normal:** Formato estándar, copy-paste EMR
2. **WSIB Report:** Formato específico para accidentes laborales
3. **MVA Report:** Formato específico para accidentes de tránsito
4. **CPO Report:** Formato para colegio profesional
5. **Insurance Report:** Formato para aseguradoras
6. **Marketing Report:** Informe de actividad/tratamiento para marketing

---

**Document Owner:** Product Team  
**Review Frequency:** Monthly  
**Next Review:** 2025-12-19  
**Market Context:** Private clinic activity averages in Canada
