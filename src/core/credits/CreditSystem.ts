export class CreditSystem {
  static readonly COSTS = {
    NORMAL_ANALYSIS: 1,
    PRO_ANALYSIS: 3
  };
  
  static readonly PLANS = {
    STARTER: {
      name: 'Starter',
      price: 24.90,
      credits: 150,
      currency: 'CAD'
    },
    PRO: {
      name: 'Pro', 
      price: 34.99,
      credits: 250,
      currency: 'CAD'
    },
    CLINIC_PRO: {
      name: 'Clinic Pro',
      price: 299,
      credits: 1250,
      seats: 5,
      currency: 'CAD'
    }
  };
  
  static readonly PACKS = {
    SMALL: {
      credits: 50,
      price: 9,
      currency: 'CAD'
    },
    LARGE: {
      credits: 200,
      price: 29,
      currency: 'CAD'
    }
  };
  
  static shouldSuggestPro(analysis: any): boolean {
    const redFlagsCount = analysis?.redFlags?.length || 0;
    const hasSuicidalIdeation = JSON.stringify(analysis).toLowerCase().includes('suicid');
    const hasPolypharmacy = (analysis?.entities?.filter((e: any) => e.type === 'medication')?.length || 0) >= 5;
    
    return redFlagsCount >= 2 || hasSuicidalIdeation || hasPolypharmacy;
  }
  
  static calculateCost(analysisType: 'normal' | 'pro'): number {
    return analysisType === 'pro' ? this.COSTS.PRO_ANALYSIS : this.COSTS.NORMAL_ANALYSIS;
  }
}
