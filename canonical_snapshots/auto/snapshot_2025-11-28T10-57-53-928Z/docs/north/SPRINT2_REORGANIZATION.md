# ⚡ **CTO DECISION: SPRINT REORGANIZATION**

## Evaluación Arquitectural para Integración Ordenada

**Fecha:** Noviembre 2025  
**Status:** ✅ **APPROVED - Listo para implementación**  
**CTO Decision:** Reorganización táctica manteniendo Sprint 2 core

---

## 🚨 **DEPENDENCY ANALYSIS**

### **Critical Dependencies Identified:**

```
🔴 BLOCKER: Session Type Configuration
├─ Document Templates necesitan sessionType para templates correctos
├─ WSIB templates diferentes vs Follow-up templates  
├─ Token budgets diferentes por tipo
└─ DEBE implementarse ANTES de document generation

🟡 HIGH IMPACT: Token Tracking  
├─ Document generation consume tokens
├─ User needs visibility de consumption
└─ DEBERÍA implementarse ANTES de templates

🟢 LOW IMPACT: Command Center UI
├─ Puede implementarse DESPUÉS de templates
├─ No bloquea funcionalidad core
└─ Enhancement posterior
```

---

## 📋 **REORGANIZED SPRINT PLAN**

### **SPRINT 2A: Prerequisites & Foundation** (3 days)

**CTO Priority:** Address blockers before document templates

#### **Day 1: Session Type Infrastructure**

```typescript
// CRITICAL: Add sessionType to workflow
interface Session {
  sessionType: 'initial' | 'followup' | 'wsib' | 'mva' | 'certificate'
  tokenBudget: number
  promptTemplate?: string
}
```

**Deliverables:**
- [ ] Add sessionType selection UI in ProfessionalWorkflowPage
- [ ] Update session creation logic
- [ ] Update SOAP generation to use session-specific prompts
- [ ] Token budget calculation by session type

#### **Day 2: Token Tracking Foundation**

```typescript
interface TokenUsage {
  used: number
  remaining: number
  monthlyLimit: number
  lastReset: Date
}
```

**Deliverables:**
- [ ] Token tracking service implementation
- [ ] Update Vertex AI calls to track consumption
- [ ] Basic token display in header
- [ ] Usage analytics foundation

#### **Day 3: Integration Testing**

**Deliverables:**
- [ ] Session type flows tested end-to-end
- [ ] Token tracking verified
- [ ] No breaking changes to existing workflow
- [ ] Ready for document template implementation

---

### **SPRINT 2B: Document Templates** (7 days)

**Original Sprint 2 plan, enhanced with session type integration**

#### **Day 4-5: WSIB Templates with Session Type**

```typescript
// Enhanced with session type
const generateWSIBTemplate = (soap: SOAPNote, sessionType: SessionType) => {
  if (sessionType === 'wsib') {
    // Use WSIB-specific fields and formatting
    return wsibSpecificTemplate(soap)
  }
  return generalSupportTemplate(soap)
}
```

#### **Day 6-8: MVA + RTW Templates**
#### **Day 9-10: Integration + Testing**

---

## 🎯 **MODIFIED IMPLEMENTATION APPROACH**

### **1. Session Type Integration Strategy:**

```typescript
// Add to ProfessionalWorkflowPage
const [sessionType, setSessionType] = useState<SessionType>('followup')

// Update buildCurrentSession function
const buildCurrentSession = (): Session => ({
  // ... existing fields
  sessionType: sessionType,
  tokenBudget: getTokenBudget(sessionType),
  promptTemplate: getPromptTemplate(sessionType)
})

// Update SOAP generation
const generateSOAP = async (transcript: string) => {
  const prompt = getSessionSpecificPrompt(transcript, sessionType)
  // ... rest of generation
}
```

### **2. Token Budget by Session Type:**

```typescript
type SessionType = 'initial' | 'followup' | 'wsib' | 'mva' | 'certificate'

const TOKEN_BUDGETS: Record<SessionType, number> = {
  'initial': 10,     // 8-12 tokens (comprehensive assessment)
  'followup': 4,     // 3-5 tokens (progress check)
  'wsib': 13,        // 10-15 tokens (injury focus + legal)
  'mva': 15,         // 12-18 tokens (comprehensive + legal)
  'certificate': 6   // 5-8 tokens (specific assessment)
}
```

### **3. Pricing Model (CANONICAL):**

```typescript
const PRICING_CONFIG = {
  basePlan: {
    name: "AiduxCare Professional",
    priceCAD: 39.99,
    tokensIncluded: 1800,
    overageRateCAD: 0.025, // per token
    monthlyCapCAD: 99.99,
    trialDays: 14,
    trialTokens: 200
  }
}
```

### **3. UI Integration Points:**

#### **ProfessionalWorkflowPage Enhancement:**

```tsx
// Add session type selector BEFORE starting workflow
<div className="session-config-panel">
  <SessionTypeSelector 
    value={sessionType} 
    onChange={setSessionType}
    showTokenBudget={true}
  />
  <TokenUsageDisplay 
    current={tokenUsage} 
    budget={getTokenBudget(sessionType)} 
  />
</div>
```

---

## 🔧 **TECHNICAL INTEGRATION DECISIONS**

### **Decision 1: Where to Add Session Type Selection**

✅ **ProfessionalWorkflowPage** (NOT Command Center initially)

- **Rationale:** Minimize scope creep, integrate with existing workflow
- **Implementation:** Add selection UI above transcript section
- **Future:** Move to Command Center in Sprint 3

### **Decision 2: Token Display Strategy**

✅ **Header + Workflow Page** (dual display)

- **Header:** Simple counter (42/100 tokens)
- **Workflow:** Detailed breakdown by session type
- **Updates:** Real-time after each API call

### **Decision 3: Document Templates Enhancement**

✅ **Session-Type Aware Templates**

```typescript
// Templates adapt based on session type
if (sessionType === 'wsib') {
  return <WSIBSpecificTemplate data={enhancedData} />
} else {
  return <GeneralSupportTemplate data={basicData} />
}
```

---

## 📊 **UPDATED SPRINT 2 SUCCESS METRICS**

### **Technical Metrics:**

```
Session Type Integration:
- Type selection UI functional ✅
- Session-specific prompts working ✅
- Token budgets calculated correctly ✅

Document Templates:
- WSIB templates generate correctly ✅
- MVA templates with session context ✅
- RTW certificates with appropriate disclaimers ✅

Performance:
- PDF generation <5 seconds ✅
- Token tracking <100ms overhead ✅
- No degradation to existing workflow ✅
```

### **Business Metrics:**

```
User Experience:
- Session type selection intuitive ✅
- Token visibility reduces anxiety ✅
- Document quality improved with context ✅

Compliance:
- Session-specific disclaimers correct ✅
- Legal requirements met per session type ✅
- Professional quality maintained ✅
```

---

## ⚠️ **RISK ASSESSMENT**

### **High Risk: Scope Creep**

**Mitigation:** Strict 3-day limit on prerequisites, core Sprint 2 unchanged

### **Medium Risk: User Workflow Disruption**

**Mitigation:** Session type defaults to 'followup', gradual introduction

### **Low Risk: Performance Impact**

**Mitigation:** Token tracking optimized, cached display

---

## ✅ **CTO RECOMMENDATION**

### **Approved Approach:**

1. **Implement prerequisites (3 days)** - Session type + token tracking basics
2. **Enhanced document templates (7 days)** - Original Sprint 2 with session context
3. **Command Center UI (Future Sprint 3)** - Dedicated UI enhancement

### **Rationale:**

- ✅ Maintains CEO-approved Sprint 2 timeline
- ✅ Addresses critical architecture dependencies  
- ✅ Enhances document template quality with session context
- ✅ Prepares foundation for future Command Center
- ✅ Minimizes scope creep while maximizing business value

### **Authorization:**

✅ **PROCEED with SPRINT 2A (3 days) + SPRINT 2B (7 days)**

**Next Action:** Implement session type selection UI and token tracking foundation before document templates.

---

## 🗄️ **DATABASE SCHEMA CHANGES**

### **User Schema Updates (Updated with Canonical Pricing v1.1):**

```typescript
interface User {
  // ... existing fields
  subscription: {
    plan: 'professional' // Only professional plan
    status: 'active' | 'trial' | 'suspended' | 'cancelled'
    priceCAD: 34.99 // Updated from 39.99
    
    // ✅ Day 2: Enhanced token tracking
    tokenAllocation: {
      baseTokensMonthly: 1200 // Updated from 1800
      baseTokensUsed: number
      baseTokensRemaining: number
      purchasedTokensBalance: number // Accumulating across months
      lastResetDate: Date
      currentBillingCycle: string // 'YYYY-MM'
    }
    
    // ✅ Day 2: Spend management
    spendControl: {
      monthlySpendCap?: number // Optional user-set limit
      autoTokenPurchase: boolean // Auto-buy when low
      preferredPackageSize: 'small' | 'medium' | 'large'
    }
    
    // ✅ Day 2: Purchase history
    tokenPurchases: TokenPurchase[]
    
    // Legacy fields (for backward compatibility)
    tokensIncluded?: number // Deprecated, use baseTokensMonthly
    tokensUsed?: number // Deprecated, use baseTokensUsed
    tokensRemaining?: number // Deprecated, use baseTokensRemaining
    billingCycle?: Date // Deprecated, use currentBillingCycle
    trialEndsAt?: Date
  }
  billing: {
    stripeCustomerId?: string
    currentPeriodStart: Date
    currentPeriodEnd: Date
    lastBillAmount: number
  }
}

// ✅ Day 2: Token Purchase Interface
interface TokenPurchase {
  id: string
  tokens: number
  priceCAD: number
  purchaseDate: Date
  tokensRemaining: number
  expiresAt: Date // 12 months from purchase
}
```

### **Session Schema Updates (Enhanced for Day 2):**

```typescript
interface Session {
  // ... existing fields
  sessionType: SessionType
  tokenBudget: number // From TOKEN_BUDGETS (Day 1)
  
  // ✅ Day 2: Token consumption tracking
  tokenConsumption: {
    budgetedTokens: number // Expected from TOKEN_BUDGETS
    actualTokensUsed: number // Real consumption from APIs
    source: 'base' | 'purchased' // Which token pool was used
    consumedAt: Date
  }
  
  // ✅ Day 2: Billing allocation
  billing: {
    billingCycle: string // 'YYYY-MM'
    allocatedFromPurchaseId?: string // If from purchased tokens
    isBillable: boolean
  }
  
  // Legacy fields (for backward compatibility)
  tokensUsed?: number // Deprecated, use tokenConsumption.actualTokensUsed
  billingMonth?: string // Deprecated, use billing.billingCycle
  isBillable?: boolean // Deprecated, use billing.isBillable
  promptTemplate?: string
}
```

---

## ⚙️ **CORE SERVICES TO IMPLEMENT**

### **1. TokenTrackingService (Core - Updated for Canonical Pricing)**

```typescript
class TokenTrackingService {
  // Monthly cycle management
  async resetMonthlyCycle(userId: string): Promise<void>
  async getCurrentTokenUsage(userId: string): Promise<TokenUsage>
  
  // Token consumption
  async recordTokenUsage(
    userId: string, 
    sessionId: string, 
    tokensUsed: number
  ): Promise<TokenConsumptionResult>
  
  // Token allocation logic (base → purchased priority)
  async allocateTokens(userId: string, tokensNeeded: number): Promise<TokenAllocation>
  
  // Purchase management
  async purchaseTokenPackage(
    userId: string, 
    packageType: 'small' | 'medium' | 'large'
  ): Promise<PurchaseResult>
  
  // Spend cap enforcement
  async checkSpendLimit(userId: string, additionalCost: number): Promise<boolean>
  
  // Check if user can use tokens
  async canUseTokens(userId: string, requestedTokens: number): Promise<boolean>
}

interface TokenUsage {
  baseTokensRemaining: number // From monthly 1200 allocation
  purchasedTokensBalance: number // Accumulated purchased tokens
  totalAvailable: number // baseTokensRemaining + purchasedTokensBalance
  monthlyUsage: number // Current month usage
  projectedMonthlyUsage: number // Based on current pace
  billingCycle: string // 'YYYY-MM'
  billingCycleStart: Date
  billingCycleEnd: Date
}

interface TokenAllocation {
  source: 'base' | 'purchased' // Which pool was used
  tokensAllocated: number
  remainingAfter: number
  purchaseIdUsed?: string // If from purchased tokens
}
```

### **2. SessionTypeService** ✅ **COMPLETADO EN DAY 1**

```typescript
class SessionTypeService {
  // ✅ Day 1: Already implemented
  getTokenBudget(sessionType: SessionType): number
  getPromptTemplate(sessionType: SessionType, transcript: string): string
  validateSessionType(sessionType: SessionType): boolean
}
```

### **3. SpendCapService (NEW - Day 2)**

```typescript
class SpendCapService {
  // User spend cap management
  async setMonthlySpendCap(userId: string, capCAD: number): Promise<void>
  async getMonthlySpendCap(userId: string): Promise<number | null>
  
  // Spend tracking
  async getCurrentMonthSpend(userId: string): Promise<number>
  async projectMonthlySpend(userId: string): Promise<number>
  
  // Auto-purchase logic
  async shouldAutoPurchase(userId: string, tokensNeeded: number): Promise<boolean>
  async executeAutoPurchase(userId: string): Promise<PurchaseResult>
  
  // Spend cap enforcement
  async wouldExceedSpendCap(
    userId: string, 
    additionalCost: number
  ): Promise<boolean>
}
```

### **4. TokenPackageService (NEW - Day 2)**

```typescript
class TokenPackageService {
  // Package management
  async getAvailablePackages(): Promise<TokenPackage[]>
  async purchasePackage(
    userId: string, 
    packageType: 'small' | 'medium' | 'large',
    paymentMethodId: string
  ): Promise<PurchaseResult>
  
  // Rollover management (12-month expiration)
  async expireOldPurchases(userId: string): Promise<void>
  async getRolloverTokens(userId: string): Promise<PurchasedToken[]>
  
  // Analytics
  async getUserPurchaseHistory(userId: string): Promise<TokenPurchase[]>
  async getPackageRecommendation(userId: string): Promise<string>
}

interface TokenPackage {
  type: 'small' | 'medium' | 'large'
  tokens: number
  priceCAD: number
  pricePerToken: number
}

interface PurchaseResult {
  success: boolean
  purchaseId: string
  tokensAdded: number
  newBalance: number
  expiresAt: Date
}
```

### **5. BillingService (Foundation - Future)**

```typescript
class BillingService {
  // Calculate monthly spend (base + purchases)
  async calculateMonthlySpend(userId: string, month: string): Promise<number>
  
  // Generate invoice data
  async generateInvoiceData(userId: string, month: string): Promise<InvoiceData>
  
  // Handle payment processing (Stripe integration)
  async processMonthlyBilling(userId: string): Promise<BillingResult>
}
```

---

## 🎨 **UI/UX REQUIREMENTS**

### **TokenUsageDisplay Component (Updated for Canonical Pricing):**

```tsx
interface TokenUsageDisplayProps {
  usage: TokenUsage
  showProjection?: boolean
  size?: 'compact' | 'full'
  className?: string
}

// Header display (compact)
<TokenUsageDisplay 
  usage={tokenUsage}
  size="compact"
  showProjection={false}
/>
// Shows: "1,247 / 1,200 base + 300 purchased = 1,500 total"

// Dashboard display (full with projection)  
<TokenUsageDisplay 
  usage={tokenUsage}
  size="full"
  showProjection={true}
/>
// Shows: Detailed breakdown with base/purchased split, projections, rollover info
```

### **SpendCapManager Component (NEW - Day 2):**

```tsx
interface SpendCapManagerProps {
  currentCap?: number
  currentSpend: number
  projectedSpend: number
  onCapChange: (newCap: number) => void
}

<SpendCapManager 
  currentCap={spendCap}
  currentSpend={monthlySpend}
  projectedSpend={projectedSpend}
  onCapChange={handleCapChange}
/>
```

### **TokenPackageStore Component (NEW - Day 2):**

```tsx
interface TokenPackageStoreProps {
  packages: TokenPackage[]
  currentUsage: TokenUsage
  spendCap?: number
  onPurchase: (packageType: string) => void
}

<TokenPackageStore 
  packages={availablePackages}
  currentUsage={tokenUsage}
  spendCap={userSpendCap}
  onPurchase={handlePurchase}
/>
```

### **Session Type Selector:**

```tsx
interface SessionTypeSelectorProps {
  value: SessionType
  onChange: (type: SessionType) => void
  showTokenBudget?: boolean
}

<SessionTypeSelector 
  value={sessionType}
  onChange={setSessionType}
  showTokenBudget={true}
/>
```

---

## 📍 **INTEGRATION POINTS**

### **ProfessionalWorkflowPage Changes (Updated for Day 2):**

```typescript
// ✅ Day 1: Already implemented
const [sessionType, setSessionType] = useState<SessionType>('followup')

// ✅ Day 2: Add token tracking state
const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null)
const [showTokenPurchaseModal, setShowTokenPurchaseModal] = useState(false)

// ✅ Day 2: Update SOAP generation with token tracking
const handleSOAPGeneration = async () => {
  const tokenBudget = SessionTypeService.getTokenBudget(sessionType)
  
  // Check token availability
  const canProceed = await TokenTrackingService.canUseTokens(userId, tokenBudget)
  
  if (!canProceed) {
    // Show token purchase dialog
    setShowTokenPurchaseModal(true)
    return
  }
  
  // Allocate tokens (base → purchased priority)
  const allocation = await TokenTrackingService.allocateTokens(userId, tokenBudget)
  
  // Generate SOAP
  const result = await generateSOAP(transcript, sessionType)
  
  // Record actual token usage
  await TokenTrackingService.recordTokenUsage(
    userId,
    sessionId, 
    result.metadata.tokens.output // Actual tokens used from API
  )
  
  // Update UI
  const updatedUsage = await TokenTrackingService.getCurrentTokenUsage(userId)
  setTokenUsage(updatedUsage)
}
```

### **Header Component Updates (Updated for Day 2):**

```tsx
// Add token display to global header
const Header = () => {
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>()
  
  useEffect(() => {
    // Load token usage on mount
    TokenTrackingService.getCurrentTokenUsage(userId).then(setTokenUsage)
  }, [userId])
  
  return (
    <div className="header">
      <TokenUsageDisplay usage={tokenUsage} size="compact" />
      <UserMenu />
    </div>
  )
}
```

---

## 🧪 **TESTING REQUIREMENTS**

### **Unit Tests:**

```typescript
describe('TokenTrackingService', () => {
  test('allocates base tokens first')
  test('falls back to purchased tokens when base exhausted')
  test('respects monthly spend cap')
  test('handles monthly cycle reset correctly')
  test('expires old purchased tokens after 12 months')
  test('records token consumption correctly')
  test('calculates total available tokens (base + purchased)')
})

describe('SpendCapService', () => {
  test('prevents purchases exceeding spend cap')
  test('allows auto-purchase within limits')
  test('projects monthly spend accurately')
  test('enforces spend cap correctly')
})

describe('TokenPackageService', () => {
  test('purchases token packages correctly')
  test('tracks purchase history')
  test('expires old purchases after 12 months')
  test('calculates rollover tokens correctly')
})

describe('SessionTypeService', () => {
  test('returns correct token budgets')
  test('validates session types')
  test('generates appropriate prompts')
})
```

### **Integration Tests:**

```typescript
describe('Token Integration', () => {
  test('SOAP generation consumes tokens correctly')
  test('Token allocation uses base tokens first')
  test('Token allocation falls back to purchased tokens')
  test('UI updates after token consumption')
  test('Purchase flow works end-to-end')
  test('Monthly reset works correctly')
  test('Rollover expiration works correctly')
  test('Spend cap enforcement prevents purchases')
})
```

---

## ⚡ **PERFORMANCE REQUIREMENTS**

- Token usage queries: **<100ms**
- Token allocation logic: **<50ms**
- UI token display updates: **<50ms**
- Purchase processing: **<200ms**
- Monthly cycle operations: **<500ms**
- Rollover expiration check: **<200ms**

---

## 🚨 **CRITICAL IMPLEMENTATION NOTES**

- **Token Tracking:** Must be atomic - no lost token usage
- **Allocation Priority:** Base tokens used first, then purchased (FIFO)
- **Monthly Reset:** Automated on billing cycle date (base tokens reset to 1200)
- **Rollover Policy:** Base tokens expire monthly, purchased tokens rollover 12 months
- **Spend Cap:** Hard enforcement - no purchases if would exceed cap
- **Trial Handling:** 14 days, 200 tokens, no billing (if applicable)
- **Error Handling:** Token service failures should not break SOAP generation
- **Performance:** Token checks must be <100ms, allocation <50ms
- **Implementation Priority:** High - Required for December pilot launch

---

## 📋 **DETAILED IMPLEMENTATION CHECKLIST**

### **Sprint 2A - Day 1: Session Type Infrastructure** ✅ **COMPLETADO**
- [x] Create `SessionTypeSelector` component ✅
- [x] Add sessionType state to ProfessionalWorkflowPage ✅
- [x] Update Session interface with sessionType field ✅
- [x] Implement `SessionTypeService.getTokenBudget()` function ✅
- [x] Implement `SessionTypeService.getPromptTemplate()` function ✅
- [x] Update SOAP generation to use session-specific prompts ✅
- [x] Update session creation to include sessionType ✅
- [x] Unit tests for session type logic ✅ (25/25 passing)
- [x] Update database schema for Session collection ✅

### **Sprint 2A - Day 2: Token Tracking Foundation** (Updated with Canonical Pricing v1.1)

**Pricing Canonical:**
- Base Plan: $34.99 CAD/month, 1200 tokens included
- Token Packages: Small (300/$15), Medium (600/$27), Large (1000/$40)
- Rollover: Base tokens expire monthly, purchased tokens rollover 12 months

**Core Services:**
- [ ] Create `TokenTrackingService` class (core tracking)
- [ ] Create `SpendCapService` class (spend management)
- [ ] Create `TokenPackageService` class (purchase management)
- [ ] Create `TokenUsage` interface (enhanced)
- [ ] Create `TokenAllocation` interface
- [ ] Create `TokenPurchase` interface
- [ ] Implement `recordTokenUsage()` method
- [ ] Implement `getCurrentTokenUsage()` method
- [ ] Implement `allocateTokens()` method (base → purchased priority)
- [ ] Implement `purchaseTokenPackage()` method
- [ ] Implement `resetMonthlyCycle()` method
- [ ] Implement `checkSpendLimit()` method
- [ ] Implement `expireOldPurchases()` method (12-month rollover)
- [ ] Update Vertex AI service to track tokens
- [ ] Update User schema with enhanced subscription fields
- [ ] Update Session schema with token consumption tracking

**UI Components:**
- [ ] Create `TokenUsageDisplay` component (compact + full)
- [ ] Create `SpendCapManager` component
- [ ] Create `TokenPackageStore` component
- [ ] Add token display to header (compact)
- [ ] Add token display to workflow page (full with projection)
- [ ] Add token purchase modal in workflow
- [ ] Add spend cap manager in settings

**Integration:**
- [ ] Integrate token check before SOAP generation
- [ ] Integrate token recording after SOAP generation
- [ ] Integrate auto-purchase logic (if enabled)
- [ ] Integrate spend cap enforcement

**Testing:**
- [ ] Unit tests for TokenTrackingService (allocation, reset, purchase)
- [ ] Unit tests for SpendCapService (cap enforcement, projection)
- [ ] Unit tests for TokenPackageService (purchase, rollover)
- [ ] Integration tests for token flow (SOAP → consumption → UI update)
- [ ] Integration tests for purchase flow
- [ ] Integration tests for monthly reset
- [ ] Integration tests for rollover expiration

### **Sprint 2A - Day 3: Integration Testing & Billing Foundation**
- [ ] Create `BillingService` foundation
- [ ] Implement `calculateOverage()` method
- [ ] Implement monthly cap enforcement ($99.99)
- [ ] Implement trial handling (14 days, 200 tokens)
- [ ] End-to-end test: Session type selection → SOAP generation
- [ ] End-to-end test: Token tracking during workflow
- [ ] End-to-end test: Overage calculation
- [ ] End-to-end test: Billing cycle reset
- [ ] Regression test: Existing workflow still works
- [ ] Performance test: Token tracking overhead <100ms
- [ ] Performance test: UI updates <50ms
- [ ] Integration test: Session type affects prompts correctly
- [ ] Error handling: Token service failures don't break SOAP
- [ ] Documentation: Session type usage guide
- [ ] Documentation: Token system architecture

---

**Status:** ✅ **APPROVED - Ready for Sprint 2A**  
**Priority:** 🔴 **CRITICAL - Required for December pilot launch**  
**Duration:** 10 days (3 days Sprint 2A + 7 days Sprint 2B)  
**Waiting for:** CTO authorization to begin Day 1 implementation

---

## 📊 **BUSINESS CONTEXT**

### **Pricing Model:**
- **Base Plan:** AiduxCare Professional - $39.99 CAD/month
- **Tokens Included:** 1800 tokens/month
- **Overage Rate:** $0.025 CAD per token
- **Monthly Cap:** $99.99 CAD maximum
- **Trial:** 14 days, 200 tokens, no billing

### **Token Budgets by Session Type:**
- **Initial:** 10 tokens (comprehensive assessment)
- **Follow-up:** 4 tokens (progress check)
- **WSIB:** 13 tokens (injury focus + legal)
- **MVA:** 15 tokens (comprehensive + legal)
- **Certificate:** 6 tokens (specific assessment)

### **Business Impact:**
- **Pilot Launch:** December 2025
- **Revenue Model:** Subscription + usage-based overage
- **Critical Path:** Token system must be operational before pilot

