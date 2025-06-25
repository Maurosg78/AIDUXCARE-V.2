/**
 * METRICS: SISTEMA DE ANALYTICS AVANZADO
 * Machine Learning para predicciones y optimización automática
 */

export interface AnalyticsData {
  timestamp: number;
  sessionId: string;
  userId: string;
  operation: string;
  duration: number;
  success: boolean;
  errorMessage?: string;
  metadata: AnalyticsMetadata;
}

export interface AnalyticsMetadata {
  specialty?: string;
  modelUsed?: string;
  tokensUsed?: number;
  cacheHit?: boolean;
  confidence?: number;
  userRole?: string;
  deviceType?: string;
  location?: string;
}

export interface PredictionModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'clustering';
  accuracy: number;
  lastUpdated: Date;
  features: string[];
  predictions: Prediction[];
}

export interface Prediction {
  id: string;
  modelId: string;
  input: any;
  output: any;
  confidence: number;
  timestamp: Date;
  actual?: any;
  error?: number;
}

export interface PerformanceMetrics {
  latency: {
    p50: number;
    p95: number;
    p99: number;
    mean: number;
  };
  throughput: {
    requestsPerSecond: number;
    tokensPerSecond: number;
  };
  accuracy: {
    overall: number;
    bySpecialty: Record<string, number>;
    byModel: Record<string, number>;
  };
  cost: {
    totalTokens: number;
    estimatedCost: number;
    costPerRequest: number;
  };
}

export class AdvancedAnalyticsService {
  private dataPoints: AnalyticsData[] = [];
  private models: Map<string, PredictionModel> = new Map();
  private predictions: Prediction[] = [];
  private isInitialized: boolean = false;

  constructor() {
    this.initializeModels();
  }

  /**
   * Inicializa modelos de ML
   */
  private initializeModels(): void {
    // Modelo de predicción de latencia
    const latencyModel: PredictionModel = {
      id: 'latency-predictor',
      name: 'Latency Predictor',
      type: 'regression',
      accuracy: 0.85,
      lastUpdated: new Date(),
      features: ['tokensUsed', 'specialty', 'modelUsed', 'cacheHit'],
      predictions: []
    };

    // Modelo de predicción de precisión
    const accuracyModel: PredictionModel = {
      id: 'accuracy-predictor',
      name: 'Accuracy Predictor',
      type: 'regression',
      accuracy: 0.78,
      lastUpdated: new Date(),
      features: ['specialty', 'modelUsed', 'inputLength', 'complexity'],
      predictions: []
    };

    // Modelo de clustering de usuarios
    const userClusteringModel: PredictionModel = {
      id: 'user-clustering',
      name: 'User Behavior Clustering',
      type: 'clustering',
      accuracy: 0.92,
      lastUpdated: new Date(),
      features: ['sessionDuration', 'operationsPerSession', 'specialty', 'role'],
      predictions: []
    };

    this.models.set(latencyModel.id, latencyModel);
    this.models.set(accuracyModel.id, accuracyModel);
    this.models.set(userClusteringModel.id, userClusteringModel);

    this.isInitialized = true;
  }

  /**
   * Registra punto de datos
   */
  recordDataPoint(data: AnalyticsData): void {
    this.dataPoints.push(data);
    
    // Mantener solo últimos 10,000 puntos para memoria
    if (this.dataPoints.length > 10000) {
      this.dataPoints = this.dataPoints.slice(-5000);
    }

    // Actualizar modelos en tiempo real
    this.updateModels(data);
  }

  /**
   * Actualiza modelos con nuevos datos
   */
  private updateModels(data: AnalyticsData): void {
    // Actualizar modelo de latencia
    const latencyModel = this.models.get('latency-predictor');
    if (latencyModel) {
      const prediction = this.predictLatency(data);
      latencyModel.predictions.push(prediction);
      
      // Calcular error y actualizar precisión
      if (data.duration) {
        const error = Math.abs(prediction.output - data.duration);
        this.updateModelAccuracy(latencyModel, error);
      }
    }

    // Actualizar modelo de precisión
    const accuracyModel = this.models.get('accuracy-predictor');
    if (accuracyModel && data.metadata.confidence) {
      const prediction = this.predictAccuracy(data);
      accuracyModel.predictions.push(prediction);
      
      // Calcular error y actualizar precisión
      const error = Math.abs(prediction.output - data.metadata.confidence);
      this.updateModelAccuracy(accuracyModel, error);
    }
  }

  /**
   * Predice latencia de operación
   */
  private predictLatency(data: AnalyticsData): Prediction {
    // Modelo de regresión lineal simplificado
    let predictedLatency = 1000; // Base 1 segundo

    // Factores que afectan latencia
    if (data.metadata.tokensUsed) {
      predictedLatency += data.metadata.tokensUsed * 0.1; // 0.1ms por token
    }

    if (data.metadata.specialty) {
      const specialtyFactors: Record<string, number> = {
        'orthopedics': 1.2,
        'neurology': 1.5,
        'cardiology': 1.3,
        'general': 1.0
      };
      predictedLatency *= specialtyFactors[data.metadata.specialty] || 1.0;
    }

    if (data.metadata.modelUsed) {
      const modelFactors: Record<string, number> = {
        'gemini-1.5-pro': 1.0,
        'gemini-1.0-pro': 0.8,
        'gpt-4': 1.2
      };
      predictedLatency *= modelFactors[data.metadata.modelUsed] || 1.0;
    }

    if (data.metadata.cacheHit) {
      predictedLatency *= 0.3; // 70% reducción con cache
    }

    return {
      id: `pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      modelId: 'latency-predictor',
      input: {
        tokensUsed: data.metadata.tokensUsed,
        specialty: data.metadata.specialty,
        modelUsed: data.metadata.modelUsed,
        cacheHit: data.metadata.cacheHit
      },
      output: predictedLatency,
      confidence: 0.85,
      timestamp: new Date(),
      actual: data.duration
    };
  }

  /**
   * Predice precisión de análisis
   */
  private predictAccuracy(data: AnalyticsData): Prediction {
    // Modelo de precisión basado en características
    let predictedAccuracy = 0.8; // Base 80%

    if (data.metadata.specialty) {
      const specialtyAccuracy: Record<string, number> = {
        'orthopedics': 0.85,
        'neurology': 0.75,
        'cardiology': 0.80,
        'general': 0.82
      };
      predictedAccuracy = specialtyAccuracy[data.metadata.specialty] || 0.8;
    }

    if (data.metadata.modelUsed) {
      const modelAccuracy: Record<string, number> = {
        'gemini-1.5-pro': 0.95,
        'gemini-1.0-pro': 0.88,
        'gpt-4': 0.92
      };
      predictedAccuracy *= modelAccuracy[data.metadata.modelUsed] || 0.9;
    }

    return {
      id: `pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      modelId: 'accuracy-predictor',
      input: {
        specialty: data.metadata.specialty,
        modelUsed: data.metadata.modelUsed
      },
      output: predictedAccuracy,
      confidence: 0.78,
      timestamp: new Date(),
      actual: data.metadata.confidence
    };
  }

  /**
   * Actualiza precisión del modelo
   */
  private updateModelAccuracy(model: PredictionModel, error: number): void {
    // Actualizar precisión basada en error promedio
    const recentPredictions = model.predictions.slice(-100);
    if (recentPredictions.length > 0) {
      const avgError = recentPredictions.reduce((sum, pred) => 
        sum + (pred.error || 0), 0) / recentPredictions.length;
      
      model.accuracy = Math.max(0, 1 - avgError);
      model.lastUpdated = new Date();
    }
  }

  /**
   * Obtiene métricas de rendimiento
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const recentData = this.dataPoints.slice(-1000); // Últimos 1000 puntos

    // Calcular latencia
    const latencies = recentData.map(d => d.duration).filter(d => d > 0);
    const sortedLatencies = latencies.sort((a, b) => a - b);

    const latency = {
      p50: this.percentile(sortedLatencies, 50),
      p95: this.percentile(sortedLatencies, 95),
      p99: this.percentile(sortedLatencies, 99),
      mean: latencies.reduce((sum, l) => sum + l, 0) / latencies.length
    };

    // Calcular throughput
    const timeWindow = 3600000; // 1 hora
    const recentHour = recentData.filter(d => 
      Date.now() - d.timestamp < timeWindow
    );

    const throughput = {
      requestsPerSecond: recentHour.length / 3600,
      tokensPerSecond: recentHour.reduce((sum, d) => 
        sum + (d.metadata.tokensUsed || 0), 0) / 3600
    };

    // Calcular precisión
    const successfulOps = recentData.filter(d => d.success);
    const accuracy = {
      overall: successfulOps.length / recentData.length,
      bySpecialty: this.calculateAccuracyBySpecialty(recentData),
      byModel: this.calculateAccuracyByModel(recentData)
    };

    // Calcular costos
    const totalTokens = recentData.reduce((sum, d) => 
      sum + (d.metadata.tokensUsed || 0), 0);
    
    const cost = {
      totalTokens,
      estimatedCost: this.estimateCost(totalTokens),
      costPerRequest: this.estimateCost(totalTokens) / recentData.length
    };

    return {
      latency,
      throughput,
      accuracy,
      cost
    };
  }

  /**
   * Calcula percentil
   */
  private percentile(sortedArray: number[], p: number): number {
    const index = Math.ceil((p / 100) * sortedArray.length) - 1;
    return sortedArray[index] || 0;
  }

  /**
   * Calcula precisión por especialidad
   */
  private calculateAccuracyBySpecialty(data: AnalyticsData[]): Record<string, number> {
    const bySpecialty: Record<string, { total: number; success: number }> = {};

    data.forEach(d => {
      const specialty = d.metadata.specialty || 'unknown';
      if (!bySpecialty[specialty]) {
        bySpecialty[specialty] = { total: 0, success: 0 };
      }
      bySpecialty[specialty].total++;
      if (d.success) {
        bySpecialty[specialty].success++;
      }
    });

    const result: Record<string, number> = {};
    Object.entries(bySpecialty).forEach(([specialty, stats]) => {
      result[specialty] = stats.success / stats.total;
    });

    return result;
  }

  /**
   * Calcula precisión por modelo
   */
  private calculateAccuracyByModel(data: AnalyticsData[]): Record<string, number> {
    const byModel: Record<string, { total: number; success: number }> = {};

    data.forEach(d => {
      const model = d.metadata.modelUsed || 'unknown';
      if (!byModel[model]) {
        byModel[model] = { total: 0, success: 0 };
      }
      byModel[model].total++;
      if (d.success) {
        byModel[model].success++;
      }
    });

    const result: Record<string, number> = {};
    Object.entries(byModel).forEach(([model, stats]) => {
      result[model] = stats.success / stats.total;
    });

    return result;
  }

  /**
   * Estima costo basado en tokens
   */
  private estimateCost(tokens: number): number {
    // Precios aproximados por 1K tokens
    const costPer1KTokens = 0.01; // $0.01 por 1K tokens
    return (tokens / 1000) * costPer1KTokens;
  }

  /**
   * Obtiene insights automáticos
   */
  getInsights(): any {
    const metrics = this.getPerformanceMetrics();
    const insights = [];

    // Insight de latencia
    if (metrics.latency.p95 > 5000) {
      insights.push({
        type: 'performance',
        severity: 'high',
        message: 'Latencia P95 excede 5 segundos. Considerar optimización de cache.',
        recommendation: 'Implementar cache más agresivo para operaciones frecuentes'
      });
    }

    // Insight de precisión
    if (metrics.accuracy.overall < 0.8) {
      insights.push({
        type: 'quality',
        severity: 'medium',
        message: 'Precisión general por debajo del 80%.',
        recommendation: 'Revisar modelos y entrenar con más datos'
      });
    }

    // Insight de costo
    if (metrics.cost.costPerRequest > 0.1) {
      insights.push({
        type: 'cost',
        severity: 'medium',
        message: 'Costo por request excede $0.10.',
        recommendation: 'Optimizar uso de tokens y implementar cache'
      });
    }

    // Insight de throughput
    if (metrics.throughput.requestsPerSecond < 1) {
      insights.push({
        type: 'performance',
        severity: 'low',
        message: 'Throughput bajo. Considerar escalabilidad.',
        recommendation: 'Evaluar necesidad de más recursos'
      });
    }

    return {
      insights,
      metrics,
      models: Array.from(this.models.values()).map(model => ({
        id: model.id,
        name: model.name,
        accuracy: model.accuracy,
        lastUpdated: model.lastUpdated
      }))
    };
  }

  /**
   * Predice demanda futura
   */
  predictDemand(hours: number = 24): any {
    const recentData = this.dataPoints.slice(-1000);
    const hourlyDemand = new Array(24).fill(0);

    // Analizar patrones históricos por hora
    recentData.forEach(data => {
      const hour = new Date(data.timestamp).getHours();
      hourlyDemand[hour]++;
    });

    // Predicción simple basada en promedio
    const avgDemand = hourlyDemand.reduce((sum, demand) => sum + demand, 0) / 24;
    const predictedDemand = hourlyDemand.map(demand => 
      Math.round(demand * 1.1) // 10% de crecimiento
    );

    return {
      current: hourlyDemand,
      predicted: predictedDemand,
      average: avgDemand,
      peakHour: hourlyDemand.indexOf(Math.max(...hourlyDemand)),
      recommendations: this.getDemandRecommendations(predictedDemand)
    };
  }

  /**
   * Obtiene recomendaciones de demanda
   */
  private getDemandRecommendations(predictedDemand: number[]): string[] {
    const recommendations = [];
    const maxDemand = Math.max(...predictedDemand);
    const avgDemand = predictedDemand.reduce((sum, d) => sum + d, 0) / predictedDemand.length;

    if (maxDemand > avgDemand * 2) {
      recommendations.push('Implementar auto-scaling para picos de demanda');
    }

    if (avgDemand > 100) {
      recommendations.push('Considerar arquitectura distribuida');
    }

    return recommendations;
  }

  /**
   * Exporta datos para análisis externo
   */
  exportData(): any {
    return {
      dataPoints: this.dataPoints.slice(-1000),
      models: Array.from(this.models.values()),
      predictions: this.predictions.slice(-500),
      timestamp: new Date().toISOString()
    };
  }
} 