/**
 * LAUNCH: SERVICIO DE OPTIMIZACIÓN DE MARATÓN
 * Optimiza el rendimiento del pipeline de procesamiento médico
 */

export interface MarathonMetrics {
  requestsPerMinute: number;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  throughput: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface OptimizationConfig {
  batchSize: number;
  concurrencyLimit: number;
  cacheEnabled: boolean;
  compressionEnabled: boolean;
  timeoutMs: number;
  retryAttempts: number;
}

export class MarathonOptimizationService {
  private metrics: MarathonMetrics = {
    requestsPerMinute: 0,
    averageResponseTime: 0,
    successRate: 100,
    errorRate: 0,
    throughput: 0,
    activeConnections: 0,
    memoryUsage: 0,
    cpuUsage: 0
  };

  private config: OptimizationConfig = {
    batchSize: 10,
    concurrencyLimit: 5,
    cacheEnabled: true,
    compressionEnabled: true,
    timeoutMs: 5000,
    retryAttempts: 3
  };

  private cache = new Map<string, any>();
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;

  /**
   * Optimiza el procesamiento de peticiones en lote
   */
  async processBatch(requests: Array<{text: string, priority: number}>): Promise<any[]> {
    const startTime = Date.now();
    
    // Ordenar por prioridad
    const sortedRequests = requests.sort((a, b) => b.priority - a.priority);
    
    // Procesar en lotes optimizados
    const batches = this.chunkArray(sortedRequests, this.config.batchSize);
    const results: any[] = [];

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(request => this.processRequest(request.text))
      );
      
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : { error: result.reason }
      ));

      // Pausa entre lotes para evitar sobrecarga
      await this.delay(100);
    }

    const endTime = Date.now();
    this.updateMetrics(endTime - startTime, results.length, results.filter(r => !r.error).length);

    return results;
  }

  /**
   * Procesa una petición individual con optimizaciones
   */
  private async processRequest(text: string): Promise<any> {
    const cacheKey = this.generateCacheKey(text);
    
    // Verificar cache
    if (this.config.cacheEnabled && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Procesar con reintentos
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const result = await this.makeOptimizedRequest(text);
        
        // Guardar en cache
        if (this.config.cacheEnabled) {
          this.cache.set(cacheKey, result);
        }
        
        return result;
      } catch (error) {
        if (attempt === this.config.retryAttempts) {
          throw error;
        }
        await this.delay(1000 * attempt); // Backoff exponencial
      }
    }
  }

  /**
   * Realiza petición optimizada con compresión y timeout
   */
  private async makeOptimizedRequest(text: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch('http://localhost:5001/aiduxcare-v2/us-east1/aiduxcareApi/clinical-nlp/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': this.config.compressionEnabled ? 'gzip, deflate' : 'identity'
        },
        body: JSON.stringify({ text }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Actualiza métricas de rendimiento
   */
  private updateMetrics(processingTime: number, totalRequests: number, successfulRequests: number): void {
    this.metrics.averageResponseTime = processingTime / totalRequests;
    this.metrics.requestsPerMinute = (totalRequests / (processingTime / 60000));
    this.metrics.successRate = (successfulRequests / totalRequests) * 100;
    this.metrics.errorRate = 100 - this.metrics.successRate;
    this.metrics.throughput = totalRequests / (processingTime / 1000);
  }

  /**
   * Divide array en lotes
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size; i++) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Genera clave de cache
   */
  private generateCacheKey(text: string): string {
    return btoa(text).slice(0, 32);
  }

  /**
   * Delay asíncrono
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtiene métricas actuales
   */
  getMetrics(): MarathonMetrics {
    return { ...this.metrics };
  }

  /**
   * Actualiza configuración
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Limpia cache
   */
  clearCache(): void {
    this.cache.clear();
  }
} 