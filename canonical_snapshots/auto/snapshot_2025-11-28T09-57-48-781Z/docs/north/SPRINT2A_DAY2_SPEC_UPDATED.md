# 📋 **SPRINT 2A - DAY 2: TOKEN TRACKING FOUNDATION**
## Updated Specification - Canonical Pricing v1.1

**Dependencias:** ✅ Day 1 completado (SessionType infrastructure)  
**Objetivo:** Implementar token tracking basado en pricing canonical v1.1  
**Duration:** 1 día  

---

## 🎯 **PRICING CANONICAL (FINAL)**

### **Plan Único:**

```typescript
const CANONICAL_PRICING = {
  basePrice: 34.99, // CAD (updated from 39.99)
  tokensIncluded: 1200, // per month (updated from 1800)
  currency: 'CAD',
  
  tokenPackages: {
    small: { tokens: 300, price: 15.00 }, // $0.05/token
    medium: { tokens: 600, price: 27.00 }, // $0.045/token  
    large: { tokens: 1000, price: 40.00 } // $0.04/token
  },
  
  rolloverPolicy: {
    baseTokensExpire: true, // 1200 tokens expire monthly
    purchasedTokensRollover: true, // purchased tokens accumulate
    maxRolloverMonths: 12 // expire after 1 year if unused
  }
}
```

### **Token Budgets (From Day 1):**

```typescript
// ✅ Day 1: Already implemented - usar estos valores
const TOKEN_BUDGETS = {
  'initial': 10,
  'followup': 4, 
  'wsib': 13,
  'mva': 15,
  'certificate': 6
}
```

---

## 🗄️ **DATABASE SCHEMA (Day 2)**

### **User Subscription Enhancement:**

```typescript
interface UserSubscription {
  // Existing fields
  plan: 'professional'
  priceCAD: 34.99 // Updated from 39.99
  
  // NEW: Token tracking
  tokenAllocation: {
    baseTokensMonthly: 1200 // Updated from 1800
    baseTokensUsed: number
    baseTokensRemaining: number
    purchasedTokensBalance: number // accumulating across months
    lastResetDate: Date
    currentBillingCycle: string // 'YYYY-MM'
  }
  
  // NEW: Spend management  
  spendControl: {
    monthlySpendCap?: number // optional user-set limit
    autoTokenPurchase: boolean // auto-buy when low
    preferredPackageSize: 'small' | 'medium' | 'large'
  }
  
  // NEW: Purchase history
  tokenPurchases: TokenPurchase[]
}

interface TokenPurchase {
  id: string
  tokens: number
  priceCAD: number
  purchaseDate: Date
  tokensRemaining: number
  expiresAt: Date // 12 months from purchase
}
```

### **Session Schema Enhancement:**

```typescript
interface Session {
  // Existing fields from Day 1
  sessionType: SessionType
  tokenBudget: number
  
  // NEW: Token consumption tracking
  tokenConsumption: {
    budgetedTokens: number // from TOKEN_BUDGETS
    actualTokensUsed: number // real consumption from APIs
    source: 'base' | 'purchased' // which token pool was used
    consumedAt: Date
  }
  
  // NEW: Billing allocation
  billing: {
    billingCycle: string // 'YYYY-MM'
    allocatedFromPurchaseId?: string // if from purchased tokens
    isBillable: boolean
  }
}
```

---

## ⚙️ **SERVICES TO IMPLEMENT**

### **1. TokenTrackingService (Core)**

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
  baseTokensRemaining: number
  purchasedTokensBalance: number
  totalAvailable: number
  monthlyUsage: number
  projectedMonthlyUsage: number // based on current pace
  billingCycle: string
  billingCycleStart: Date
  billingCycleEnd: Date
}

interface TokenAllocation {
  source: 'base' | 'purchased'
  tokensAllocated: number
  remainingAfter: number
  purchaseIdUsed?: string
}
```

### **2. SpendCapService**

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

### **3. TokenPackageService**

```typescript
class TokenPackageService {
  // Package management
  async getAvailablePackages(): Promise<TokenPackage[]>
  async purchasePackage(
    userId: string, 
    packageType: string,
    paymentMethodId: string
  ): Promise<PurchaseResult>
  
  // Rollover management
  async expireOldPurchases(userId: string): Promise<void>
  async getRolloverTokens(userId: string): Promise<PurchasedToken[]>
  
  // Analytics
  async getUserPurchaseHistory(userId: string): Promise<TokenPurchase[]>
  async getPackageRecommendation(userId: string): Promise<string>
}
```

---

## 🎨 **UI COMPONENTS (Day 2)**

### **TokenUsageDisplay Component:**

```tsx
interface TokenUsageDisplayProps {
  usage: TokenUsage
  showProjection?: boolean
  size?: 'compact' | 'full'
}

// Header version (compact)
<TokenUsageDisplay 
  usage={tokenUsage} 
  size="compact"
  showProjection={false}
/>

// Dashboard version (full)  
<TokenUsageDisplay 
  usage={tokenUsage}
  size="full" 
  showProjection={true}
/>
```

### **SpendCapManager Component:**

```tsx
interface SpendCapManagerProps {
  currentCap?: number
  currentSpend: number
  onCapChange: (newCap: number) => void
}

<SpendCapManager 
  currentCap={spendCap}
  currentSpend={monthlySpend}
  onCapChange={handleCapChange}
/>
```

### **TokenPackageStore Component:**

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

---

## 🧪 **INTEGRATION POINTS**

### **ProfessionalWorkflowPage Updates:**

```typescript
// Add token tracking to SOAP generation
const handleSOAPGeneration = async () => {
  // Check token availability
  const canProceed = await TokenTrackingService.canUseTokens(
    userId, 
    TOKEN_BUDGETS[sessionType]
  )
  
  if (!canProceed) {
    // Show token purchase dialog
    setShowTokenPurchaseModal(true)
    return
  }
  
  // Generate SOAP
  const result = await generateSOAP(transcript, sessionType)
  
  // Record actual token usage
  await TokenTrackingService.recordTokenUsage(
    userId,
    sessionId, 
    result.tokensUsed
  )
  
  // Update UI
  refreshTokenUsage()
}
```

### **Header Component Updates:**

```tsx
// Add token display to global header
const Header = () => {
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>()
  
  return (
    <div className="header">
      <TokenUsageDisplay usage={tokenUsage} size="compact" />
      <UserMenu />
    </div>
  )
}
```

---

## 📊 **TESTING REQUIREMENTS**

### **Unit Tests:**

```typescript
describe('TokenTrackingService', () => {
  test('allocates base tokens first')
  test('falls back to purchased tokens when base exhausted')
  test('respects monthly spend cap')
  test('handles monthly cycle reset correctly')
  test('expires old purchased tokens after 12 months')
})

describe('SpendCapService', () => {
  test('prevents purchases exceeding spend cap')
  test('allows auto-purchase within limits')
  test('projects monthly spend accurately')
})

describe('TokenPackageService', () => {
  test('purchases token packages correctly')
  test('tracks purchase history')
  test('expires old purchases after 12 months')
})
```

### **Integration Tests:**

```typescript
describe('Token Integration', () => {
  test('SOAP generation consumes tokens correctly')
  test('UI updates after token consumption')
  test('Purchase flow works end-to-end')
  test('Monthly reset works correctly')
  test('Rollover expiration works correctly')
})
```

---

## ✅ **DAY 2 DEFINITION OF DONE**

### **🔴 Core Functionality:**

- [ ] TokenTrackingService implemented with all methods
- [ ] Monthly cycle management working
- [ ] Token allocation logic (base → purchased)
- [ ] Purchase token packages functional
- [ ] Spend cap enforcement working
- [ ] Monthly billing cycle reset automated
- [ ] Rollover expiration (12 months) working

### **🔴 UI Integration:**

- [ ] TokenUsageDisplay component in header
- [ ] TokenUsageDisplay component in workflow page
- [ ] Token purchase modal in workflow
- [ ] SpendCapManager in settings
- [ ] TokenPackageStore component
- [ ] Real-time usage updates after SOAP generation

### **🔴 Data Persistence:**

- [ ] User subscription schema updated
- [ ] Session token consumption logged
- [ ] Purchase history tracked
- [ ] Token rollover working correctly

### **🔴 Business Logic:**

- [ ] Base tokens expire monthly (1,200)
- [ ] Purchased tokens rollover for 12 months
- [ ] Spend caps enforced correctly
- [ ] Auto-purchase logic implemented
- [ ] Allocation priority: base → purchased (FIFO)

---

## 🚨 **CRITICAL IMPLEMENTATION NOTES**

1. **Token Allocation Priority:** Base tokens used first, then purchased (FIFO)
2. **Monthly Reset:** Automated on billing cycle date (base tokens reset to 1200)
3. **Rollover Policy:** Base tokens expire monthly, purchased tokens rollover 12 months
4. **Spend Cap:** Hard enforcement - no purchases if would exceed cap
5. **Error Handling:** Token exhaustion should not break SOAP generation
6. **Performance:** Token checks must be <100ms, allocation <50ms

---

## 📊 **CHANGES FROM ORIGINAL SPEC**

### **Pricing Updates:**
- Base price: $39.99 → $34.99 CAD
- Base tokens: 1800 → 1200 per month
- Added token packages (small/medium/large)
- Added rollover policy

### **New Features:**
- Token packages with purchase flow
- Spend cap management
- Rollover expiration (12 months)
- Auto-purchase logic

### **Enhanced Tracking:**
- Base vs purchased token separation
- Purchase history tracking
- Allocation source tracking (base/purchased)

---

**Expected Completion:** End of Day 2  
**Blockers:** None identified  
**Next:** Day 3 - UI Polish & Testing

