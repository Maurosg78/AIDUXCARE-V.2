export class StrictEvaluationMatrix {
  static evaluate(response: any, transcript: string): any {
    const evaluation = {
      score: 100,
      penalties: [],
      bonuses: [],
      details: {}
    };
    
    // PENALIZACIONES SEVERAS
    
    // 1. Duplicados (-10 cada uno)
    const duplicates = this.findDuplicates(response);
    if (duplicates > 0) {
      evaluation.score -= duplicates * 10;
      evaluation.penalties.push({
        reason: `${duplicates} duplicados entre secciones`,
        points: -duplicates * 10
      });
    }
    
    // 2. Mala categorización (-15 cada error)
    const catErrors = this.checkCategorization(response);
    if (catErrors > 0) {
      evaluation.score -= catErrors * 15;
      evaluation.penalties.push({
        reason: `${catErrors} elementos mal categorizados`,
        points: -catErrors * 15
      });
    }
    
    // 3. Sin fuentes médicas (-25)
    if (!this.hasMedicalSources(response)) {
      evaluation.score -= 25;
      evaluation.penalties.push({
        reason: 'No cita fuentes médicas/guidelines',
        points: -25
      });
    }
    
    // 4. Tests sin justificación (-20)
    const unjustifiedTests = this.checkTestJustification(response);
    if (unjustifiedTests > 0) {
      evaluation.score -= 20;
      evaluation.penalties.push({
        reason: `${unjustifiedTests} tests sin justificación clínica`,
        points: -20
      });
    }
    
    // 5. Red flags críticos no detectados (-15 cada uno)
    const missedCritical = this.checkCriticalDetection(response, transcript);
    if (missedCritical.length > 0) {
      evaluation.score -= missedCritical.length * 15;
      evaluation.penalties.push({
        reason: `No detectó: ${missedCritical.join(', ')}`,
        points: -missedCritical.length * 15
      });
    }
    
    // 6. NUEVA: Información en logs pero no en UI (-30)
    const hiddenInfo = this.checkHiddenInformation(response, transcript);
    if (hiddenInfo.length > 0) {
      evaluation.score -= 30;
      evaluation.penalties.push({
        reason: `Información crítica solo en logs: ${hiddenInfo.join(', ')}`,
        points: -30
      });
    }
    
    // 7. NUEVA: Score inflado injustificadamente (-20)
    if (this.isScoreInflated(response, transcript)) {
      evaluation.score -= 20;
      evaluation.penalties.push({
        reason: 'Score inflado para caso complejo sin justificación',
        points: -20
      });
    }
    
    // BONUSES (máximo +10)
    
    // Cita guidelines específicas (+5)
    if (/NICE|Cochrane|WHO|CDC/i.test(JSON.stringify(response))) {
      evaluation.score += 5;
      evaluation.bonuses.push({
        reason: 'Cita guidelines específicas',
        points: 5
      });
    }
    
    // Todos los tests con evidencia (+5)
    if (this.allTestsHaveEvidence(response)) {
      evaluation.score += 5;
      evaluation.bonuses.push({
        reason: 'Todos los tests con sensibilidad/especificidad',
        points: 5
      });
    }
    
    evaluation.score = Math.max(0, Math.min(100, evaluation.score));
    
    // Log detallado
    console.log('═══════════════════════════════════════');
    console.log('EVALUACIÓN ESTRICTA:');
    evaluation.penalties.forEach(p => 
      console.log(`❌ ${p.reason}: ${p.points}`)
    );
    evaluation.bonuses.forEach(b => 
      console.log(`✅ ${b.reason}: +${b.points}`)
    );
    console.log('─────────────────────────────────────');
    console.log(`SCORE FINAL: ${evaluation.score}/100`);
    console.log('═══════════════════════════════════════');
    
    return evaluation;
  }
  
  private static checkHiddenInformation(response: any, transcript: string): string[] {
    const hidden = [];
    
    // Información crítica que debería estar en redFlags pero no está visible
    if (transcript.includes('fallen twice') && transcript.includes('bruising')) {
      const redFlagsStr = JSON.stringify(response.redFlags || []).toLowerCase();
      if (!redFlagsStr.includes('fracture') || !redFlagsStr.includes('fall')) {
        hidden.push('caídas múltiples + hematomas');
      }
    }
    
    // Información de medicamentos confusa que no se clarifica
    if (transcript.includes('Gabba-something') || transcript.includes('blue pill')) {
      const meds = response.entities?.filter(e => e.type === 'medication') || [];
      if (meds.length === 0) {
        hidden.push('medicamentos no identificados');
      }
    }
    
    // Signos de depresión/suicidio no categorizados correctamente
    if (transcript.includes("doesn't see the point") && transcript.includes('burden')) {
      const yellowFlags = JSON.stringify(response.yellowFlags || []).toLowerCase();
      if (!yellowFlags.includes('depression') && !yellowFlags.includes('burden')) {
        hidden.push('signos depresivos complejos');
      }
    }
    
    return hidden;
  }
  
  private static isScoreInflated(response: any, transcript: string): boolean {
    // Si el transcript indica caso complejo/grave pero el análisis es superficial
    const complexityIndicators = [
      'fallen twice', 'bruising', 'confused', 'dehydrated', 
      'doesn\'t see the point', 'burden', 'drinking more', 'lives alone'
    ];
    
    const foundIndicators = complexityIndicators.filter(indicator => 
      transcript.toLowerCase().includes(indicator.toLowerCase())
    ).length;
    
    // Si hay 4+ indicadores de complejidad, el análisis debe ser muy detallado
    if (foundIndicators >= 4) {
      const totalItems = (response.redFlags?.length || 0) + 
                       (response.entities?.length || 0) + 
                       (response.yellowFlags?.length || 0) + 
                       (response.physicalTests?.length || 0);
      
      // Para casos complejos, esperamos 15+ items bien categorizados
      return totalItems < 15;
    }
    
    return false;
  }
  
  // ... resto de métodos privados sin cambios
  private static findDuplicates(response: any): number {
    const allTexts = [];
    ['redFlags', 'yellowFlags', 'entities'].forEach(section => {
      (response[section] || []).forEach((item: any) => {
        const text = typeof item === 'string' ? item : item.name;
        allTexts.push(text?.toLowerCase());
      });
    });
    
    const unique = new Set(allTexts);
    return allTexts.length - unique.size;
  }
  
  private static checkCategorization(response: any): number {
    let errors = 0;
    
    (response.yellowFlags || []).forEach((flag: string) => {
      if (/confus|dizz|pain|weak/i.test(flag)) errors++;
    });
    
    (response.redFlags || []).forEach((flag: string) => {
      if (!/suicid|cauda|fracture|cancer|infect|chest|neurolog/i.test(flag)) {
        errors++;
      }
    });
    
    return errors;
  }
  
  private static hasMedicalSources(response: any): boolean {
    const str = JSON.stringify(response);
    return /guideline|evidence|protocol|criteria/i.test(str);
  }
  
  private static checkTestJustification(response: any): number {
    const tests = response.physicalTests || [];
    return tests.filter((t: any) => !t.indication).length;
  }
  
  private static checkCriticalDetection(response: any, transcript: string): string[] {
    const missed = [];
    const responseStr = JSON.stringify(response).toLowerCase();
    
    if (transcript.includes("doesn't see the point") && 
        !responseStr.includes('suicidal')) {
      missed.push('ideación suicida');
    }
    
    if (transcript.includes('fallen twice') && 
        !responseStr.includes('fall')) {
      missed.push('caídas recurrentes');
    }
    
    if (transcript.includes('guarding') && 
        !responseStr.includes('fracture')) {
      missed.push('posible fractura');
    }
    
    return missed;
  }
  
  private static allTestsHaveEvidence(response: any): boolean {
    const tests = response.physicalTests || [];
    return tests.length > 0 && tests.every((t: any) => 
      t.sensitivity && t.specificity && t.indication
    );
  }
}
