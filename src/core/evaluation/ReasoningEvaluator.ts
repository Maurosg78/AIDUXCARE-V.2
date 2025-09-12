export class ReasoningEvaluator {
  static evaluate(response: any, transcript: string): {
    score: number;
    feedback: string[];
    strengths: string[];
    gaps: string[];
  } {
    const evaluation = {
      score: 0,
      feedback: [],
      strengths: [],
      gaps: []
    };
    
    // Evaluar si detectó amenazas críticas
    const criticalThreats = this.evaluateThreatDetection(response, transcript);
    evaluation.score += criticalThreats.score;
    if (criticalThreats.missed.length > 0) {
      evaluation.gaps.push(`Missed critical threats: ${criticalThreats.missed.join(', ')}`);
    }
    if (criticalThreats.detected.length > 0) {
      evaluation.strengths.push(`Detected: ${criticalThreats.detected.join(', ')}`);
    }
    
    // Evaluar calidad del razonamiento
    const reasoning = this.evaluateReasoningQuality(response);
    evaluation.score += reasoning.score;
    evaluation.feedback.push(...reasoning.feedback);
    
    // Evaluar plan de seguridad
    const safety = this.evaluateSafetyPlan(response);
    evaluation.score += safety.score;
    if (safety.hasTestJustification) {
      evaluation.strengths.push('Tests are clinically justified');
    } else {
      evaluation.gaps.push('Tests lack clinical justification');
    }
    
    return evaluation;
  }
  
  private static evaluateThreatDetection(response: any, transcript: string): any {
    const detected = [];
    const missed = [];
    let score = 0;
    
    const responseText = JSON.stringify(response).toLowerCase();
    
    // Caso específico del transcript de prueba
    if (transcript.includes("doesn't see the point")) {
      if (responseText.includes('suicid')) {
        detected.push('Suicidal ideation');
        score += 25;
      } else {
        missed.push('SUICIDAL IDEATION - CRITICAL MISS');
        score -= 50; // Penalización severa
      }
    }
    
    if (transcript.includes('fallen twice')) {
      if (responseText.includes('fall')) {
        detected.push('Fall risk');
        score += 15;
      } else {
        missed.push('Recurrent falls');
      }
    }
    
    if (transcript.includes('confused about')) {
      if (responseText.includes('delir') || responseText.includes('confus')) {
        detected.push('Cognitive impairment');
        score += 15;
      } else {
        missed.push('Confusion/delirium');
      }
    }
    
    return { score: Math.max(0, score), detected, missed };
  }
  
  private static evaluateReasoningQuality(response: any): any {
    const feedback = [];
    let score = 0;
    
    // ¿Explicó POR QUÉ cada hallazgo es importante?
    const hasWhyExplanation = /because|due to|risk of|could lead|may cause/i.test(
      JSON.stringify(response)
    );
    
    if (hasWhyExplanation) {
      score += 20;
      feedback.push('Provides clinical reasoning');
    } else {
      feedback.push('Lacks explanation of clinical significance');
    }
    
    return { score, feedback };
  }
  
  private static evaluateSafetyPlan(response: any): any {
    let score = 0;
    let hasTestJustification = false;
    
    if (response.physicalTests && Array.isArray(response.physicalTests)) {
      response.physicalTests.forEach((test: any) => {
        if (test.indication && test.indication.length > 20) {
          hasTestJustification = true;
          score += 5;
        }
      });
    }
    
    // ¿Documentó para protección legal?
    if (response.redFlags && response.redFlags.length > 0) {
      score += 10; // Documentar red flags = protección legal
    }
    
    return { score: Math.min(25, score), hasTestJustification };
  }
}
