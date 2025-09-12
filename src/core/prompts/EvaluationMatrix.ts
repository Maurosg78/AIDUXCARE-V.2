export class ClinicalEvaluationMatrix {
  static criteria = [
    {
      name: 'DATA_COMPLETENESS',
      maxPoints: 20,
      required: true,
      evaluate: (response: any) => {
        let score = 0;
        // 5 puntos por cada sección con datos
        if (response.redFlags?.length > 0) score += 5;
        if (response.entities?.length > 0) score += 5;
        if (response.yellowFlags?.length > 0) score += 5;
        if (response.physicalTests?.length > 0) score += 5;
        
        console.log(`[EVAL] Data Completeness: ${score}/20`);
        return score;
      }
    },
    {
      name: 'CRITICAL_SAFETY',
      maxPoints: 25,
      required: true,
      evaluate: (response: any, transcript: string) => {
        if (!transcript.toLowerCase().includes("doesn't see the point")) {
          console.log('[EVAL] No critical content in transcript');
          return 25;
        }
        
        const responseStr = JSON.stringify(response).toLowerCase();
        const found = responseStr.includes('suicidal ideation');
        const score = found ? 25 : 0;
        console.log(`[EVAL] Critical Safety: ${score}/25 (suicidal ideation ${found ? 'detected' : 'MISSED'})`);
        return score;
      }
    },
    {
      name: 'MEDICATION_NORMALIZATION',
      maxPoints: 20,
      required: true,
      evaluate: (response: any) => {
        let medications = [];
        if (Array.isArray(response.entities)) {
          medications = response.entities.filter((e: any) => e.type === 'medication');
        }
        
        let score = medications.length > 0 ? 20 : 0;
        
        // Penalizar si hay nombres no normalizados
        medications.forEach((med: any) => {
          if (med.name?.includes('something') || med.name?.includes('-')) {
            score -= 5;
          }
        });
        
        console.log(`[EVAL] Medications: ${Math.max(0, score)}/20 (found ${medications.length})`);
        return Math.max(0, score);
      }
    },
    {
      name: 'SCOPE_COMPLIANCE',
      maxPoints: 20,
      required: true,
      evaluate: (response: any) => {
        const responseStr = JSON.stringify(response).toLowerCase();
        const violations = ['blood test', 'x-ray', 'metabolic panel'];
        const hasViolation = violations.some(v => responseStr.includes(v));
        const score = hasViolation ? 0 : 20;
        console.log(`[EVAL] Scope Compliance: ${score}/20`);
        return score;
      }
    },
    {
      name: 'TEST_APPROPRIATENESS',
      maxPoints: 15,
      required: true,
      evaluate: (response: any) => {
        const tests = response.physicalTests || [];
        let score = 0;
        
        if (tests.length >= 3) score = 15;
        else if (tests.length >= 2) score = 10;
        else if (tests.length >= 1) score = 5;
        
        console.log(`[EVAL] Tests: ${score}/15 (${tests.length} tests)`);
        return score;
      }
    }
  ];
  
  static evaluate(response: any, transcript: string) {
    console.log('═══════════════════════════════════════');
    console.log('EVALUACIÓN DETALLADA:');
    
    let totalPossible = 0;
    let totalEarned = 0;
    const details: Record<string, number> = {};
    
    for (const criterion of this.criteria) {
      const points = criterion.evaluate(response, transcript);
      totalPossible += criterion.maxPoints;
      totalEarned += points;
      details[criterion.name] = points;
    }
    
    const score = Math.round((totalEarned / totalPossible) * 100);
    
    console.log('─────────────────────────────────────');
    console.log(`TOTAL: ${totalEarned}/${totalPossible} = ${score}%`);
    console.log('═══════════════════════════════════════');
    
    return { score, details, missingCritical: [] };
  }
}
