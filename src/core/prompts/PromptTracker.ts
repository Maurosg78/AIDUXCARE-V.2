export class PromptTracker {
  private static readonly STORAGE_KEY = 'aiduxcare_prompt_library';
  
  static saveAnalysis(analysis: any) {
    try {
      const existing = this.getAllAnalyses();
      existing.push({
        ...analysis,
        id: `analysis-${Date.now()}`
      });
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
      console.log('[PromptTracker] Saved: Score', analysis.score + '/100');
    } catch (error) {
      console.error('[PromptTracker] Error saving:', error);
    }
  }
  
  static getAllAnalyses() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  static generateReport() {
    const analyses = this.getAllAnalyses();
    if (analyses.length === 0) return 'No hay análisis guardados';
    
    const scores = analyses.map((a: any) => a.score);
    const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    return {
      totalAnalyses: analyses.length,
      averageScore: Math.round(avgScore),
      bestScore: maxScore,
      worstScore: minScore,
      lastAnalysis: analyses[analyses.length - 1]
    };
  }
  
  static clearAll() {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('[PromptTracker] All analyses cleared');
  }
}
