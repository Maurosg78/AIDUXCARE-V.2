export class DynamicScoringSystem {
  private static readonly STORAGE_KEY = 'aiduxcare_analysis_library';
  
  // Guardar análisis y recalcular todos los scores
  static saveAndRecalculate(newAnalysis: any) {
    const library = this.getLibrary();
    
    // Agregar el nuevo análisis con score inicial
    const analysisWithId = {
      ...newAnalysis,
      id: `analysis-${Date.now()}`,
      timestamp: Date.now(),
      absoluteScore: this.calculateAbsoluteScore(newAnalysis)
    };
    
    library.push(analysisWithId);
    
    // Encontrar el mejor análisis
    const bestScore = Math.max(...library.map(a => a.absoluteScore));
    
    // Recalcular scores relativos
    library.forEach(analysis => {
      analysis.relativeScore = Math.round((analysis.absoluteScore / bestScore) * 100);
      analysis.isBest = analysis.absoluteScore === bestScore;
    });
    
    // Ordenar por score
    library.sort((a, b) => b.absoluteScore - a.absoluteScore);
    
    // Guardar
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(library));
    
    console.log(`📊 Nuevo análisis: Score relativo ${analysisWithId.relativeScore}/100`);
    console.log(`📈 Ranking: #${library.findIndex(a => a.id === analysisWithId.id) + 1} de ${library.length}`);
    
    return analysisWithId;
  }
  
  // Calcular score absoluto con criterios estrictos
  private static calculateAbsoluteScore(analysis: any): number {
    let score = 100; // Empezar con 100 y penalizar
    const penalties: string[] = [];
    
    // PENALIZACIONES SEVERAS
    
    // 1. Duplicados entre secciones (-10 cada uno)
    const duplicates = this.findDuplicates(analysis);
    score -= duplicates.count * 10;
    if (duplicates.count > 0) {
      penalties.push(`Duplicados: -${duplicates.count * 10}`);
    }
    
    // 2. Mala categorización (-15)
    const miscategorized = this.checkCategorization(analysis);
    score -= miscategorized * 15;
    if (miscategorized > 0) {
      penalties.push(`Mal categorizados: -${miscategorized * 15}`);
    }
    
    // 3. Falta de fuentes médicas (-25)
    if (!this.hasProperSources(analysis)) {
      score -= 25;
      penalties.push(`Sin fuentes: -25`);
    }
    
    // 4. Tests sin evidencia (-20)
    if (!this.testsHaveEvidence(analysis)) {
      score -= 20;
      penalties.push(`Tests sin evidencia: -20`);
    }
    
    // 5. Red flags críticos faltantes (-15 cada uno)
    const missingCritical = this.checkMissingCritical(analysis);
    score -= missingCritical * 15;
    if (missingCritical > 0) {
      penalties.push(`Red flags faltantes: -${missingCritical * 15}`);
    }
    
    console.log('⚠️ Penalizaciones:', penalties.join(', '));
    
    return Math.max(0, score);
  }
  
  private static findDuplicates(analysis: any): {count: number, items: string[]} {
    const seen = new Set();
    const duplicates = [];
    
    ['redFlags', 'yellowFlags', 'entities'].forEach(section => {
      (analysis[section] || []).forEach((item: any) => {
        const key = typeof item === 'string' ? 
          item.toLowerCase() : 
          (item.name || '').toLowerCase();
        
        if (seen.has(key)) {
          duplicates.push(key);
        }
        seen.add(key);
      });
    });
    
    return {count: duplicates.length, items: duplicates};
  }
  
  private static checkCategorization(analysis: any): number {
    let errors = 0;
    
    // Yellow flags no deben tener síntomas físicos
    (analysis.yellowFlags || []).forEach((flag: string) => {
      if (/confusion|dizz|pain|fracture/i.test(flag)) {
        errors++;
      }
    });
    
    // Red flags deben ser solo emergencias reales
    (analysis.redFlags || []).forEach((flag: string) => {
      if (!/suicidal|cauda|fracture|cancer|chest/i.test(flag)) {
        errors++;
      }
    });
    
    return errors;
  }
  
  private static hasProperSources(analysis: any): boolean {
    const str = JSON.stringify(analysis);
    return /Cochrane|NICE|STarT|guideline|evidence/i.test(str);
  }
  
  private static testsHaveEvidence(analysis: any): boolean {
    const tests = analysis.physicalTests || [];
    return tests.every((test: any) => 
      test.sensitivity && test.specificity && test.indication
    );
  }
  
  private static checkMissingCritical(analysis: any): number {
    let missing = 0;
    const redFlagsStr = JSON.stringify(analysis.redFlags || []).toLowerCase();
    
    // Verificar si el transcript mencionaba estos pero no están en red flags
    if (analysis.transcript?.includes("doesn't see the point") && 
        !redFlagsStr.includes('suicidal')) {
      missing++;
    }
    
    if (analysis.transcript?.includes("fallen twice") && 
        !redFlagsStr.includes('fall')) {
      missing++;
    }
    
    return missing;
  }
  
  static getLibrary() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  static getBestAnalysis() {
    const library = this.getLibrary();
    return library.find(a => a.isBest) || null;
  }
}
