# 💰 INFORME COMPLETO DE PRICING - AiDuxCare
## Fecha: 2026-01-21 | Estado: ✅ ACTUALIZADO

---

## 📋 RESUMEN EJECUTIVO

**Modelo de Negocio:** Token-based subscription  
**Moneda:** CAD (Canadian Dollars)  
**Mercado:** Canadá · Clínicas privadas de fisioterapia  
**Compliance:** PHIPA/PIPEDA Ready

---

## 🎯 PRICING CANONICAL v1.1 (IMPLEMENTADO)

### **Plan Base Único:**

```typescript
const CANONICAL_PRICING = {
  basePrice: 34.99,        // CAD mensual
  tokensIncluded: 1200,   // tokens por mes
  currency: 'CAD',
  
  tokenPackages: {
    small: { tokens: 300, price: 15.00 },   // $0.05/token
    medium: { tokens: 600, price: 27.00 }, // $0.045/token
    large: { tokens: 1000, price: 40.00 }  // $0.04/token
  },
  
  rolloverPolicy: {
    baseTokensExpire: true,              // 1200 tokens expiran mensualmente
    purchasedTokensRollover: true,        // tokens comprados acumulan
    maxRolloverMonths: 12                 // expiran después de 1 año si no se usan
  }
}
```

**Ubicación en código:**
- `src/services/tokenTrackingService.ts` (línea 16-32)
- `src/services/spendCapService.ts` (línea 15-31)
- `docs/north/SPRINT2A_DAY2_SPEC_UPDATED.md` (línea 15-31)

---

## 📊 TOKEN BUDGETS POR TIPO DE SESIÓN

### **Costo de Tokens por Sesión:**

```typescript
const TOKEN_BUDGETS: Record<SessionType, number> = {
  'initial': 10,      // Evaluación inicial completa (8-12 tokens)
  'followup': 4,      // Follow-up / progreso (3-5 tokens)
  'wsib': 13,         // WSIB - Workplace Safety (10-15 tokens)
  'mva': 15,          // MVA - Motor Vehicle Accident (12-18 tokens)
  'certificate': 6    // Certificado médico (5-8 tokens)
}
```

**Ubicación en código:**
- `src/services/sessionTypeService.ts` (línea 23-29)

### **Desglose por Tipo:**

| Tipo de Sesión | Tokens | Descripción | Disponible en Pilot |
|----------------|--------|-------------|---------------------|
| **Initial Assessment** | 10 | Evaluación inicial completa | ✅ Sí |
| **Follow-up** | 4 | Visita de seguimiento | ✅ Sí |
| **WSIB** | 13 | Workplace Safety and Insurance Board | ❌ No |
| **MVA** | 15 | Motor Vehicle Accident | ❌ No |
| **Certificate** | 6 | Certificado médico | ❌ No |

---

## 💵 PAQUETES DE TOKENS ADICIONALES

### **Opciones de Compra:**

| Paquete | Tokens | Precio | Precio por Token | Mejor Para |
|---------|--------|--------|------------------|------------|
| **Small** | 300 | $15.00 CAD | $0.050/token | Uso ocasional |
| **Medium** | 600 | $27.00 CAD | $0.045/token | Uso moderado |
| **Large** | 1,000 | $40.00 CAD | $0.040/token | Uso intensivo |

**Política de Rollover:**
- ✅ Tokens comprados **acumulan** entre meses
- ✅ Expiran después de **12 meses** si no se usan
- ❌ Tokens base (1200/mes) **NO acumulan** - expiran mensualmente

---

## 📈 CÁLCULOS DE USO MENSUAL

### **Con Plan Base ($34.99/mes, 1200 tokens):**

| Escenario | Sesiones/mes | Tokens usados | Tokens restantes |
|-----------|--------------|---------------|------------------|
| **Bajo uso** | 60 follow-ups | 240 | 960 |
| **Uso moderado** | 30 initial + 60 follow-ups | 540 | 660 |
| **Uso intensivo** | 60 initial + 60 follow-ups | 840 | 360 |
| **Máximo teórico** | 120 follow-ups | 480 | 720 |
| **Máximo realista** | 40 initial + 80 follow-ups | 720 | 480 |

### **Proyección de Costos Adicionales:**

Si un fisioterapeuta necesita más de 1200 tokens/mes:

| Tokens adicionales | Paquete recomendado | Costo adicional | Costo total/mes |
|-------------------|---------------------|-----------------|-----------------|
| 300 tokens | Small | $15.00 | $49.99 |
| 600 tokens | Medium | $27.00 | $61.99 |
| 1,000 tokens | Large | $40.00 | $74.99 |

---

## 🔄 POLÍTICAS DE RENOVACIÓN Y EXPIRACIÓN

### **Ciclo Mensual:**
- ✅ Tokens base se **renuevan** el día 1 de cada mes
- ✅ Reset automático a **1200 tokens**
- ❌ Tokens base **NO acumulan** - expiran si no se usan

### **Tokens Comprados:**
- ✅ **Acumulan** entre meses
- ✅ **Expiran** después de 12 meses si no se usan
- ✅ Prioridad de uso: **Base primero, luego comprados** (FIFO)

### **Ejemplo de Rollover:**
```
Mes 1: 1200 base + compra 300 = 1500 total
       Usa 1000 → quedan 500 (200 base + 300 comprados)

Mes 2: 1200 base nuevos + 300 comprados = 1500 total
       Usa 800 → quedan 700 (400 base + 300 comprados)

Mes 3: 1200 base nuevos + 300 comprados = 1500 total
       (300 comprados expiran si tienen >12 meses)
```

---

## 💰 SPEND CAP (Límite de Gasto Mensual)

### **Funcionalidad:**
- Usuario puede establecer un **límite de gasto mensual** opcional
- Incluye: precio base ($34.99) + compras de tokens
- Bloquea compras adicionales si excedería el límite

### **Ejemplo:**
```
Spend Cap: $50.00 CAD/mes
- Base: $34.99
- Disponible para compras: $15.01
- Puede comprar: Small ($15.00) ✅
- No puede comprar: Medium ($27.00) ❌
```

**Ubicación en código:**
- `src/services/spendCapService.ts`

---

## 📊 COMPARACIÓN CON COMPETENCIA

### **Jane.app:**
- Basic: ~$30 CAD/mes (sin AI scribe)
- + AI Scribe: ~$45 CAD/mes ($15 USD add-on)
- Posicionamiento: EMR completo

### **AiDuxCare:**
- Base: $34.99 CAD/mes (1200 tokens)
- Posicionamiento: Companion tool especializado
- Diferenciación: WSIB/MVA automation, compliance canadiense

### **Análisis Competitivo:**
| Aspecto | Jane.app | AiDuxCare |
|---------|----------|-----------|
| Precio base | ~$30 CAD | $34.99 CAD |
| AI Scribe | +$15 USD | Incluido |
| WSIB/MVA | ❌ | ✅ (Premium) |
| EMR completo | ✅ | ❌ (Companion) |
| Compliance CA | Parcial | ✅ Especializado |

---

## 🎯 VALOR PROPUESTO (ROI)

### **WSIB Report:**
- Tiempo manual: **2-4 horas**
- Tarifa fisioterapeuta: **$100-150 CAD/hora**
- Valor total: **$200-600 CAD**
- Costo tokens: **$0.65-0.78 CAD** (13 tokens × $0.05)
- **ROI: 256-923x** return on investment

### **MVA Report:**
- Similar a WSIB
- Costo tokens: **$0.75 CAD** (15 tokens × $0.05)
- **ROI: Similar a WSIB**

### **SOAP Normal:**
- Tiempo manual: **10-15 minutos**
- Tarifa fisioterapeuta: **$100-150 CAD/hora**
- Valor total: **$16.67-37.50 CAD**
- Costo tokens: **$0.20-0.50 CAD** (4-10 tokens × $0.05)
- **ROI: 33-187x** return on investment

---

## 📋 ESTRUCTURA DE DATOS (Firestore)

### **User Subscription Schema:**

```typescript
interface UserSubscription {
  plan: 'professional'
  priceCAD: 34.99
  
  tokenAllocation: {
    baseTokensMonthly: 1200
    baseTokensUsed: number
    baseTokensRemaining: number
    purchasedTokensBalance: number  // acumulando entre meses
    lastResetDate: Date
    currentBillingCycle: string     // 'YYYY-MM'
  }
  
  spendControl: {
    monthlySpendCap?: number        // límite opcional
    autoTokenPurchase: boolean
    preferredPackageSize: 'small' | 'medium' | 'large'
  }
  
  tokenPurchases: TokenPurchase[]
}

interface TokenPurchase {
  id: string
  tokens: number
  priceCAD: number
  purchaseDate: Date
  tokensRemaining: number
  expiresAt: Date  // 12 meses desde compra
}
```

---

## 🔍 UBICACIONES EN CÓDIGO

### **1. Pricing Configuration:**
- `src/services/tokenTrackingService.ts` (línea 16-32)
- `src/services/spendCapService.ts` (línea 15-31)

### **2. Token Budgets:**
- `src/services/sessionTypeService.ts` (línea 23-29)

### **3. Documentación:**
- `docs/north/SPRINT2A_DAY2_SPEC_UPDATED.md` (Pricing Canonical v1.1)
- `docs/strategy/TOKEN_PRICING_STRATEGY.md` (Estrategia completa)

---

## ✅ ESTADO ACTUAL

### **Implementado:**
- ✅ Pricing canonical v1.1 ($34.99, 1200 tokens)
- ✅ Token budgets por tipo de sesión
- ✅ Paquetes de tokens adicionales
- ✅ Política de rollover
- ✅ Spend cap management
- ✅ Tracking de uso mensual

### **Pendiente (si aplica):**
- ⚠️ Actualización a $24.90 por 900 tokens (si se confirma)

---

## 📊 RESUMEN DE PRICING

| Concepto | Valor Actual |
|----------|--------------|
| **Precio mensual base** | $34.99 CAD |
| **Tokens incluidos** | 1,200/mes |
| **Precio por token base** | ~$0.029/token |
| **Initial Assessment** | 10 tokens |
| **Follow-up** | 4 tokens |
| **WSIB** | 13 tokens |
| **MVA** | 15 tokens |
| **Certificate** | 6 tokens |
| **Paquete Small** | 300 tokens × $15.00 |
| **Paquete Medium** | 600 tokens × $27.00 |
| **Paquete Large** | 1,000 tokens × $40.00 |

---

**Generado:** 2026-01-21  
**Última actualización:** 2026-01-21  
**Fuentes:** tokenTrackingService.ts, sessionTypeService.ts, SPRINT2A_DAY2_SPEC_UPDATED.md
