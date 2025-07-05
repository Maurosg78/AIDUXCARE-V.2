import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from "web-vitals";

/**
 * Interfaz para métricas de performance
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: number;
  url: string;
  id: string;
}

/**
 * Servicio para monitorear Web Vitals y enviar métricas de performance
 */
export class WebVitalsService {
  private metrics: PerformanceMetric[] = [];
  private onMetricCallback?: (metric: PerformanceMetric) => void;

  /**
   * Inicializa el monitoreo de Web Vitals
   */
  public initialize(onMetric?: (metric: PerformanceMetric) => void): void {
    this.onMetricCallback = onMetric;

    // Configurar el handler para todas las métricas
    const reportHandler = (metric: Metric) => {
      const performanceMetric: PerformanceMetric = {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
        url: window.location.href,
        id: metric.id,
      };

      this.metrics.push(performanceMetric);

      // Log para desarrollo
      if (import.meta.env.DEV) {
        console.log(`🎯 Web Vital: ${metric.name}`, {
          value: Math.round(metric.value),
          rating: metric.rating,
          entries: metric.entries,
        });
      }

      // Callback personalizado
      this.onMetricCallback?.(performanceMetric);
    };

    // Registrar todos los Web Vitals
    onCLS(reportHandler);
    onINP(reportHandler);
    onFCP(reportHandler);
    onLCP(reportHandler);
    onTTFB(reportHandler);
  }

  /**
   * Obtiene todas las métricas recolectadas
   */
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Obtiene métricas por tipo
   */
  public getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((metric) => metric.name === name);
  }

  /**
   * Obtiene el promedio de una métrica específica
   */
  public getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((total, metric) => total + metric.value, 0);
    return sum / metrics.length;
  }

  /**
   * Genera reporte de performance
   */
  public getPerformanceReport(): {
    summary: Record<
      string,
      { average: number; latest: number; rating: string }
    >;
    metrics: PerformanceMetric[];
    timestamp: number;
  } {
    const metricsNames = ["CLS", "INP", "FCP", "LCP", "TTFB"];
    const summary: Record<
      string,
      { average: number; latest: number; rating: string }
    > = {};

    metricsNames.forEach((name) => {
      const metrics = this.getMetricsByName(name);
      const latest = metrics[metrics.length - 1];

      summary[name] = {
        average: Math.round(this.getAverageMetric(name)),
        latest: latest ? Math.round(latest.value) : 0,
        rating: latest?.rating || "unknown",
      };
    });

    return {
      summary,
      metrics: this.metrics,
      timestamp: Date.now(),
    };
  }

  /**
   * Limpia todas las métricas
   */
  public clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Evalúa si la performance general es buena
   */
  public isPerformanceGood(): boolean {
    const latestMetrics = ["CLS", "INP", "FCP", "LCP", "TTFB"]
      .map((name) => {
        const metrics = this.getMetricsByName(name);
        return metrics[metrics.length - 1];
      })
      .filter(Boolean);

    if (latestMetrics.length === 0) return true;

    const goodMetrics = latestMetrics.filter(
      (metric) => metric.rating === "good",
    );
    return goodMetrics.length / latestMetrics.length >= 0.8;
  }
}

// Instancia singleton
export const webVitalsService = new WebVitalsService();
