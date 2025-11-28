import type { SOAPNote } from '../types/vertex-ai';

export class SOAPGenerator {
  static generateFromData(
    analysisResults: any,
    physicalEvalResults: any,
    patientData: any
  ): SOAPNote {
    // SUBJETIVO: Síntomas y hallazgos del análisis inicial
    const subjective = this.buildSubjective(analysisResults, patientData);
    
    // OBJETIVO: Todos los datos de evaluación física
    const objective = this.buildObjective(physicalEvalResults);
    
    // EVALUACIÓN: Interpretación clínica
    const assessment = this.buildAssessment(analysisResults, physicalEvalResults);
    
    // PLAN: Recomendaciones basadas en hallazgos
    const plan = this.buildPlan(analysisResults, physicalEvalResults);
    
    return { subjective, objective, assessment, plan };
  }
  
  private static buildSubjective(analysis: any, patient: any): string {
    const parts = [];
    
    // Patient data
    if (patient?.age && patient?.previousDiagnosis) {
      parts.push(`Patient aged ${patient.age} with previous diagnosis of ${patient.previousDiagnosis}.`);
    } else if (patient?.age) {
      parts.push(`Patient aged ${patient.age}.`);
    }
    
    // Main symptoms from analysis
    const symptoms = analysis?.filter((item: any) => 
      item.text.includes('🔍') || item.type === 'symptom'
    );
    if (symptoms?.length > 0) {
      parts.push(`Reports: ${symptoms.map((s: any) => s.text.replace('🔍', '')).join(', ')}.`);
    }
    
    // Current medication
    const meds = analysis?.filter((item: any) => 
      item.text.includes('💊') || item.type === 'medication'
    );
    if (meds?.length > 0) {
      parts.push(`Current medication: ${meds.map((m: any) => m.text.replace('💊', '')).join(', ')}.`);
    }
    
    return parts.join(' ') || 'Patient presents for physiotherapy consultation.';
  }
  
  private static buildObjective(physicalResults: any): string {
    if (!physicalResults || physicalResults.length === 0) {
      return 'Physical evaluation pending completion.';
    }
    
    const parts = [];
    
    // Group by data type
    const byType = {
      pain: [] as any[],
      strength: [] as any[],
      range: [] as any[],
      tests: [] as any[],
      other: [] as any[]
    };
    
    physicalResults.forEach((result: any) => {
      if (result.pain) byType.pain.push(result);
      else if (result.strength) byType.strength.push(result);
      else if (result.degrees) byType.range.push(result);
      else if (result.test) byType.tests.push(result);
      else if (result.raw) byType.other.push(result);
    });
    
    // Pain
    if (byType.pain.length > 0) {
      const painText = byType.pain.map(p => 
        `${p.location || 'General'}: NPRS ${p.pain}/10`
      ).join(', ');
      parts.push(`PAIN: ${painText}.`);
    }
    
    // Range of motion
    if (byType.range.length > 0) {
      const rangeText = byType.range.map(r => 
        `${r.location || ''} ${r.side || ''}: ${r.degrees}°`.trim()
      ).join(', ');
      parts.push(`RANGE OF MOTION: ${rangeText}.`);
    }
    
    // Strength
    if (byType.strength.length > 0) {
      const strengthText = byType.strength.map(s => 
        `${s.location || ''} ${s.side || ''}: ${s.strength}`.trim()
      ).join(', ');
      parts.push(`MUSCLE STRENGTH: ${strengthText}.`);
    }
    
    // Special tests
    if (byType.tests.length > 0) {
      const testText = byType.tests.map(t => 
        `${t.test}: ${t.result || 'performed'}`
      ).join(', ');
      parts.push(`SPECIAL TESTS: ${testText}.`);
    }
    
    // Other findings
    if (byType.other.length > 0) {
      const otherText = byType.other.map(o => o.raw).join('. ');
      parts.push(`OBSERVATIONS: ${otherText}.`);
    }
    
    return parts.join(' ');
  }
  
  private static buildAssessment(analysis: any, physical: any): string {
    const findings = [];
    
    // Identified conditions
    const conditions = analysis?.filter((item: any) => 
      item.type === 'condition' || item.text.includes('🔍')
    );
    if (conditions?.length > 0) {
      findings.push(conditions[0].text.replace('🔍', '').trim());
    }
    
    // Interpretation of physical findings
    const hasLimitation = physical?.some((p: any) => 
      p.result === 'positive' || p.pain > 5 || p.strength?.includes('3/5')
    );
    
    if (hasLimitation) {
      findings.push('with significant functional limitation');
    }
    
    return findings.join(' ') || 'Assessment in progress.';
  }
  
  private static buildPlan(analysis: any, physical: any): string {
    const recommendations = [];
    
    // Based on suggested tests
    const suggestedTests = analysis?.filter((item: any) => 
      item.text.includes('📋')
    );
    
    if (suggestedTests?.length > 0) {
      recommendations.push('Continue evaluation with specific functional tests.');
    }
    
    // Based on findings
    const hasPain = physical?.some((p: any) => p.pain > 3);
    if (hasPain) {
      recommendations.push('Pain management and analgesia techniques.');
    }
    
    const hasWeakness = physical?.some((p: any) => 
      p.strength && parseInt(p.strength) < 4
    );
    if (hasWeakness) {
      recommendations.push('Progressive muscle strengthening.');
    }
    
    const hasRangeLimit = physical?.some((p: any) => 
      p.degrees && parseInt(p.degrees) < 90
    );
    if (hasRangeLimit) {
      recommendations.push('Mobilizations and flexibility exercises.');
    }
    
    recommendations.push('Follow-up according to progression.');
    
    return recommendations.join(' ') || 'Treatment plan to be determined.';
  }
}
