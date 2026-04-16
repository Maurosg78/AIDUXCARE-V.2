declare module 'web-vitals' {
  export type MetricRating = 'good' | 'needs-improvement' | 'poor';

  export interface Metric {
    name: string;
    value: number;
    rating: MetricRating;
    id: string;
    entries: PerformanceEntry[];
  }

  export function onCLS(callback: (metric: Metric) => void): void;
  export function onINP(callback: (metric: Metric) => void): void;
  export function onFCP(callback: (metric: Metric) => void): void;
  export function onLCP(callback: (metric: Metric) => void): void;
  export function onTTFB(callback: (metric: Metric) => void): void;
}
