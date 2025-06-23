/**
 * 📊 BUSINESS ANALYTICS SERVICE
 * Sistema completo de métricas KPI para plan de negocios e inversores
 * Basado en PLAN_NEGOCIOS_AIDUXCARE_V3.md
 */

import { track } from '@/lib/analytics';

// =============================================================================
// INTERFACES DE MÉTRICAS DE NEGOCIO
// =============================================================================

/**
 * Métricas financieras clave para inversores
 */
export interface FinancialMetrics {
  // Revenue Metrics
  mrr: number;                    // Monthly Recurring Revenue
  arr: number;                    // Annual Recurring Revenue
  arpu: number;                   // Average Revenue Per User
  growth_rate_monthly: number;    // Crecimiento mensual %
  
  // Cost Metrics  
  cogs: number;                   // Cost of Goods Sold
  gross_margin: number;           // Margen bruto %
  monthly_burn: number;           // Quema mensual de efectivo
  
  // Efficiency Metrics
  ltv: number;                    // Lifetime Value
  cac: number;                    // Customer Acquisition Cost
  ltv_cac_ratio: number;          // Ratio LTV/CAC
  months_to_payback: number;      // Meses para recuperar CAC
  
  // Projections
  revenue_runway_months: number;  // Runway de revenue
  break_even_users: number;       // Usuarios para punto de equilibrio
  break_even_month: number;       // Mes estimado de equilibrio
}

/**
 * Métricas de producto especializadas por disciplina
 */
export interface ProductMetrics {
  // Classification AI Metrics
  classification_accuracy: number;        // >95% objetivo
  cost_optimization_rate: number;         // 35% reducción objetivo
  red_flag_detection_precision: number;   // <2% falsos positivos
  
  // Specialty Satisfaction
  psychology_nps: number;                 // >70 objetivo
  physio_nps: number;                     // >70 objetivo  
  general_nps: number;                    // >70 objetivo
  overall_satisfaction: number;           // Promedio ponderado
  
  // Technical Performance
  transcription_accuracy: number;         // >95% objetivo
  soap_generation_time_ms: number;        // <30000ms objetivo
  system_uptime: number;                  // 99.9% objetivo
  processing_time_avg_ms: number;         // <30000ms objetivo
}

/**
 * Métricas de usuarios y retención
 */
export interface UserMetrics {
  // User Base
  total_active_users: number;
  new_users_monthly: number;
  churned_users_monthly: number;
  
  // Retention & Engagement
  monthly_churn_rate: number;             // <5% Psychology Pro objetivo
  user_retention_rate: number;
  daily_active_users: number;
  monthly_active_users: number;
  
  // Plan Distribution
  psychology_pro_users: number;
  physio_pro_users: number;
  general_pro_users: number;
  starter_users: number;
  clinic_users: number;
  
  // Conversion Metrics
  trial_to_paid_conversion: number;       // % conversión trial
  upsell_rate: number;                    // 25% objetivo Starter→Pro
  specialty_plan_adoption: number;        // 70% objetivo Pro plans
}

/**
 * Métricas de costos y optimización
 */
export interface CostMetrics {
  // AI Processing Costs
  cost_per_consultation: number;
  cost_per_user_monthly: number;
  google_cloud_costs_monthly: number;
  
  // Cost by Consultation Type
  initial_consultation_cost: number;      // €0.35 psicología objetivo
  followup_consultation_cost: number;     // €0.18 psicología objetivo
  emergency_consultation_cost: number;    // €0.50 psicología objetivo
  
  // Optimization Metrics
  cogs_optimization_percentage: number;   // 30-40% reducción objetivo
  cost_prediction_accuracy: number;       // ±5% objetivo
  batch_processing_savings: number;       // % ahorro por batch
}

/**
 * Métricas de mercado y competencia
 */
export interface MarketMetrics {
  // Market Position
  market_penetration_spain: number;       // % del SAM capturado
  competitive_price_advantage: number;    // % ventaja vs competencia
  feature_differentiation_score: number;  // Score vs competidores
  
  // Growth Potential
  tam_spain: number;                      // €2.1B
  sam_spain: number;                      // €33.5M
  som_target: number;                     // 3.5% del SAM objetivo
  
  // Competitive Analysis
  doctoralia_price_comparison: number;    // vs €49/mes
  jane_app_price_comparison: number;      // vs €79/mes
  epic_price_comparison: number;          // vs €200+/mes
}

/**
 * Dashboard ejecutivo completo
 */
export interface ExecutiveDashboard {
  // Timestamp
  generated_at: string;
  period: string;                         // "2025-01" formato
  
  // Core Metrics
  financial: FinancialMetrics;
  product: ProductMetrics;
  users: UserMetrics;
  costs: CostMetrics;
  market: MarketMetrics;
  
  // Key Highlights
  kpi_status: {
    revenue_growth: 'on-track' | 'ahead' | 'behind';
    user_acquisition: 'on-track' | 'ahead' | 'behind';
    cost_optimization: 'on-track' | 'ahead' | 'behind';
    product_quality: 'on-track' | 'ahead' | 'behind';
  };
  
  // Alerts & Risks
  critical_alerts: string[];
  growth_opportunities: string[];
  risk_factors: string[];
}

// =============================================================================
// SERVICIO DE ANALYTICS DE NEGOCIO
// =============================================================================

export class BusinessAnalyticsService {
  private static instance: BusinessAnalyticsService;
  private metricsCache: Map<string, any> = new Map();
  private lastCacheUpdate: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  public static getInstance(): BusinessAnalyticsService {
    if (!BusinessAnalyticsService.instance) {
      BusinessAnalyticsService.instance = new BusinessAnalyticsService();
    }
    return BusinessAnalyticsService.instance;
  }

  /**
   * Obtiene dashboard ejecutivo completo
   */
  public async getExecutiveDashboard(period?: string): Promise<ExecutiveDashboard> {
    const currentPeriod = period || this.getCurrentPeriod();
    const cacheKey = `executive-dashboard-${currentPeriod}`;
    
    // Check cache
    if (this.isCacheValid() && this.metricsCache.has(cacheKey)) {
      return this.metricsCache.get(cacheKey);
    }

    // Generate fresh dashboard
    const dashboard: ExecutiveDashboard = {
      generated_at: new Date().toISOString(),
      period: currentPeriod,
      financial: await this.calculateFinancialMetrics(),
      product: await this.calculateProductMetrics(),
      users: await this.calculateUserMetrics(),
      costs: await this.calculateCostMetrics(),
      market: await this.calculateMarketMetrics(),
      kpi_status: await this.evaluateKPIStatus(),
      critical_alerts: await this.getCriticalAlerts(),
      growth_opportunities: await this.getGrowthOpportunities(),
      risk_factors: await this.getRiskFactors()
    };

    // Update cache
    this.metricsCache.set(cacheKey, dashboard);
    this.lastCacheUpdate = Date.now();

    // Track dashboard generation
    track('executive_dashboard_generated', {
      period: currentPeriod,
      mrr: dashboard.financial.mrr,
      total_users: dashboard.users.total_active_users,
      gross_margin: dashboard.financial.gross_margin
    });

    return dashboard;
  }

  /**
   * Calcula métricas financieras
   */
  private async calculateFinancialMetrics(): Promise<FinancialMetrics> {
    // Simulación basada en proyecciones del plan de negocios
    const currentMonth = new Date().getMonth() + 1;
    const baseUsers = 150; // Usuarios base año 1
    const monthlyGrowth = 0.15; // 15% crecimiento mensual
    
    const totalUsers = Math.floor(baseUsers * Math.pow(1 + monthlyGrowth, currentMonth));
    const arpu = 62; // €62 promedio según plan
    const mrr = totalUsers * arpu;
    const arr = mrr * 12;
    
    // Costos basados en plan de negocios
    const cogsRate = 0.36; // 36% del revenue optimizado
    const cogs = mrr * cogsRate;
    const grossMargin = ((mrr - cogs) / mrr) * 100;
    
    // CAC y LTV según plan
    const cac = 85; // €85 blended CAC
    const ltv = cac * 4.2; // 4.2x ratio objetivo
    
    return {
      mrr,
      arr,
      arpu,
      growth_rate_monthly: monthlyGrowth * 100,
      cogs,
      gross_margin: grossMargin,
      monthly_burn: 15000, // €15K según plan optimizado
      ltv,
      cac,
      ltv_cac_ratio: ltv / cac,
      months_to_payback: Math.ceil(cac / (arpu * (grossMargin / 100))),
      revenue_runway_months: Math.floor((mrr * 6) / 15000), // 6 meses de revenue vs burn
      break_even_users: Math.ceil(15000 / (arpu * (grossMargin / 100))),
      break_even_month: 15 // Mes 15 según proyecciones
    };
  }

  /**
   * Calcula métricas de producto
   */
  private async calculateProductMetrics(): Promise<ProductMetrics> {
    // Simular métricas técnicas basadas en objetivos del plan
    return {
      classification_accuracy: 94.2, // Objetivo >95%
      cost_optimization_rate: 32.5, // Objetivo 35%
      red_flag_detection_precision: 1.8, // Objetivo <2%
      psychology_nps: 72, // Objetivo >70
      physio_nps: 68, // Mejora necesaria
      general_nps: 71,
      overall_satisfaction: 70.3,
      transcription_accuracy: 93.8, // Objetivo >95%
      soap_generation_time_ms: 28500, // Objetivo <30s
      system_uptime: 99.92, // Objetivo 99.9%
      processing_time_avg_ms: 25200
    };
  }

  /**
   * Calcula métricas de usuarios
   */
  private async calculateUserMetrics(): Promise<UserMetrics> {
    const totalUsers = 287; // Simulación actual
    
    return {
      total_active_users: totalUsers,
      new_users_monthly: 43,
      churned_users_monthly: 12,
      monthly_churn_rate: 4.2, // Objetivo <5%
      user_retention_rate: 95.8,
      daily_active_users: Math.floor(totalUsers * 0.35),
      monthly_active_users: Math.floor(totalUsers * 0.85),
      psychology_pro_users: Math.floor(totalUsers * 0.35),
      physio_pro_users: Math.floor(totalUsers * 0.28),
      general_pro_users: Math.floor(totalUsers * 0.22),
      starter_users: Math.floor(totalUsers * 0.12),
      clinic_users: Math.floor(totalUsers * 0.03),
      trial_to_paid_conversion: 68.5,
      upsell_rate: 23.2, // Objetivo 25%
      specialty_plan_adoption: 65.8 // Objetivo 70%
    };
  }

  /**
   * Calcula métricas de costos
   */
  private async calculateCostMetrics(): Promise<CostMetrics> {
    return {
      cost_per_consultation: 0.28,
      cost_per_user_monthly: 18.50,
      google_cloud_costs_monthly: 425,
      initial_consultation_cost: 0.32, // Objetivo €0.35 psicología
      followup_consultation_cost: 0.16, // Objetivo €0.18 psicología
      emergency_consultation_cost: 0.48, // Objetivo €0.50 psicología
      cogs_optimization_percentage: 32.5, // Objetivo 30-40%
      cost_prediction_accuracy: 4.2, // Objetivo ±5%
      batch_processing_savings: 15.8
    };
  }

  /**
   * Calcula métricas de mercado
   */
  private async calculateMarketMetrics(): Promise<MarketMetrics> {
    const sam = 33500000; // €33.5M SAM España
    const currentRevenue = 17794; // MRR actual simulado
    
    return {
      market_penetration_spain: (currentRevenue * 12 / sam) * 100,
      competitive_price_advantage: 26.5, // vs competencia promedio
      feature_differentiation_score: 8.7, // /10
      tam_spain: 2100000000, // €2.1B
      sam_spain: sam,
      som_target: 3.5, // 3.5% del SAM
      doctoralia_price_comparison: (62 - 49) / 49 * 100, // +26.5%
      jane_app_price_comparison: (79 - 62) / 62 * 100, // Jane es +27% más cara
      epic_price_comparison: (200 - 62) / 62 * 100 // Epic es +223% más caro
    };
  }

  /**
   * Evalúa estado de KPIs
   */
  private async evaluateKPIStatus(): Promise<{
    revenue_growth: 'on-track' | 'ahead' | 'behind';
    user_acquisition: 'on-track' | 'ahead' | 'behind';
    cost_optimization: 'on-track' | 'ahead' | 'behind';
    product_quality: 'on-track' | 'ahead' | 'behind';
  }> {
    const financial = await this.calculateFinancialMetrics();
    const product = await this.calculateProductMetrics();
    const users = await this.calculateUserMetrics();
    
    return {
      revenue_growth: financial.growth_rate_monthly >= 15 ? 'on-track' : 'behind',
      user_acquisition: users.new_users_monthly >= 40 ? 'on-track' : 'behind',
      cost_optimization: financial.gross_margin >= 65 ? 'on-track' : 'behind',
      product_quality: product.classification_accuracy >= 95 ? 'on-track' : 'behind'
    };
  }

  /**
   * Obtiene alertas críticas
   */
  private async getCriticalAlerts(): Promise<string[]> {
    const alerts: string[] = [];
    const product = await this.calculateProductMetrics();
    const financial = await this.calculateFinancialMetrics();
    
    if (product.classification_accuracy < 95) {
      alerts.push('🚨 Precisión de clasificación IA por debajo del objetivo (95%)');
    }
    
    if (financial.gross_margin < 65) {
      alerts.push('⚠️ Margen bruto por debajo del objetivo (68%)');
    }
    
    if (financial.ltv_cac_ratio < 4.0) {
      alerts.push('📊 Ratio LTV/CAC por debajo del objetivo (4.2x)');
    }

    return alerts;
  }

  /**
   * Obtiene oportunidades de crecimiento
   */
  private async getGrowthOpportunities(): Promise<string[]> {
    const opportunities: string[] = [];
    const users = await this.calculateUserMetrics();
    const market = await this.calculateMarketMetrics();
    
    if (users.specialty_plan_adoption < 70) {
      opportunities.push('📈 Incrementar adopción de planes especializados (objetivo 70%)');
    }
    
    if (market.market_penetration_spain < 1) {
      opportunities.push('🎯 Expandir penetración de mercado en España (potencial 35x)');
    }
    
    if (users.upsell_rate < 25) {
      opportunities.push('💰 Optimizar estrategia de upselling Starter→Pro');
    }

    return opportunities;
  }

  /**
   * Obtiene factores de riesgo
   */
  private async getRiskFactors(): Promise<string[]> {
    const risks: string[] = [];
    const financial = await this.calculateFinancialMetrics();
    const users = await this.calculateUserMetrics();
    
    if (users.monthly_churn_rate > 4) {
      risks.push('🔻 Churn rate elevado para planes premium');
    }
    
    if (financial.months_to_payback > 12) {
      risks.push('⏰ Tiempo de recuperación CAC muy alto');
    }
    
    if (financial.revenue_runway_months < 6) {
      risks.push('💸 Runway de efectivo bajo - considerar fundraising');
    }

    return risks;
  }

  /**
   * Genera reporte para inversores
   */
  public async generateInvestorReport(): Promise<{
    executive_summary: any;
    financial_highlights: any;
    growth_metrics: any;
    competitive_position: any;
    risk_assessment: any;
  }> {
    const dashboard = await this.getExecutiveDashboard();
    
    return {
      executive_summary: {
        arr_current: dashboard.financial.arr,
        arr_projected_year3: 1200000, // €1.2M según plan
        users_current: dashboard.users.total_active_users,
        users_projected_year3: 1575, // Según plan
        gross_margin: dashboard.financial.gross_margin,
        market_opportunity: dashboard.market.sam_spain
      },
      financial_highlights: {
        mrr_growth_rate: dashboard.financial.growth_rate_monthly,
        ltv_cac_ratio: dashboard.financial.ltv_cac_ratio,
        gross_margin_improvement: '+10 puntos vs EMRs tradicionales',
        break_even_timeline: `Mes ${dashboard.financial.break_even_month}`,
        fundraising_need: '€500K-750K Seed Round'
      },
      growth_metrics: {
        market_penetration: dashboard.market.market_penetration_spain,
        competitive_advantage: dashboard.market.competitive_price_advantage,
        product_differentiation: dashboard.market.feature_differentiation_score,
        user_acquisition_cost: dashboard.financial.cac,
        retention_rate: dashboard.users.user_retention_rate
      },
      competitive_position: {
        price_advantage_vs_doctoralia: dashboard.market.doctoralia_price_comparison,
        price_advantage_vs_jane: dashboard.market.jane_app_price_comparison,
        feature_differentiation: 'Única con IA especializada por disciplina',
        compliance_advantage: '18-24 meses adelanto regulatorio',
        technical_moat: 'Clasificador inteligente + optimización costos'
      },
      risk_assessment: {
        critical_alerts: dashboard.critical_alerts,
        mitigation_strategies: dashboard.growth_opportunities,
        funding_timeline: 'Q1 2025 para mantener crecimiento',
        technical_risks: 'Dependencia Google Cloud APIs',
        market_risks: 'Competencia Big Tech + regulación IA'
      }
    };
  }

  /**
   * Helper methods
   */
  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.CACHE_TTL;
  }

  /**
   * Export data for external analysis
   */
  public async exportMetricsCSV(): Promise<string> {
    const dashboard = await this.getExecutiveDashboard();
    
    const csvData = [
      ['Metric', 'Value', 'Target', 'Status'],
      ['MRR (€)', dashboard.financial.mrr.toString(), 'Growth', 'Tracking'],
      ['ARR (€)', dashboard.financial.arr.toString(), '1.2M by Year 3', 'On Track'],
      ['Gross Margin (%)', dashboard.financial.gross_margin.toFixed(1), '68%', 'Target'],
      ['LTV/CAC Ratio', dashboard.financial.ltv_cac_ratio.toFixed(1), '4.2x', 'Tracking'],
      ['Total Users', dashboard.users.total_active_users.toString(), '1575 by Year 3', 'Growing'],
      ['Churn Rate (%)', dashboard.users.monthly_churn_rate.toFixed(1), '<5%', 'Good'],
      ['Classification Accuracy (%)', dashboard.product.classification_accuracy.toFixed(1), '>95%', 'Improving'],
      ['Market Penetration (%)', dashboard.market.market_penetration_spain.toFixed(2), '3.5%', 'Early']
    ];

    return csvData.map(row => row.join(',')).join('\n');
  }
}

// =============================================================================
// EXPORT SINGLETON
// =============================================================================

export const businessAnalytics = BusinessAnalyticsService.getInstance();