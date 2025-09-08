export class AiduxMetrics {
  static getAverageWordCount(output: string): number {
    if (!output) return 0;
    return output.trim().split(/\s+/).filter(Boolean).length;
  }

  static summarize(
    tests: Array<{ sensibilidad?: number; especificidad?: number }>,
    output: string
  ) {
    const valid = (tests || []).filter(t => t.sensibilidad && t.especificidad);
    const avgWords = AiduxMetrics.getAverageWordCount(output);
    return { count: valid.length, avgWords };
  }
}
export default AiduxMetrics;
