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
    
    // Datos del paciente
    parts.push(`Paciente de ${patient.edad} con diagnóstico de ${patient.diagnosticoPrevio}.`);
    
    // Síntomas principales del análisis
    const symptoms = analysis?.filter((item: any) => 
      item.text.includes('🔍') || item.type === 'symptom'
    );
    if (symptoms?.length > 0) {
      parts.push(`Refiere: ${symptoms.map((s: any) => s.text.replace('🔍', '')).join(', ')}.`);
    }
    
    // Medicación actual
    const meds = analysis?.filter((item: any) => 
      item.text.includes('💊') || item.type === 'medication'
    );
    if (meds?.length > 0) {
      parts.push(`Medicación actual: ${meds.map((m: any) => m.text.replace('💊', '')).join(', ')}.`);
    }
    
    return parts.join(' ') || 'Paciente acude a consulta de fisioterapia.';
  }
  
  private static buildObjective(physicalResults: any): string {
    if (!physicalResults || physicalResults.length === 0) {
      return 'Pendiente evaluación física completa.';
    }
    
    const parts = [];
    
    // Agrupar por tipo de dato
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
    
    // Dolor
    if (byType.pain.length > 0) {
      const painText = byType.pain.map(p => 
        `${p.location || 'General'}: EVA ${p.pain}/10`
      ).join(', ');
      parts.push(`DOLOR: ${painText}.`);
    }
    
    // Rangos articulares
    if (byType.range.length > 0) {
      const rangeText = byType.range.map(r => 
        `${r.location || ''} ${r.side || ''}: ${r.degrees}°`.trim()
      ).join(', ');
      parts.push(`RANGOS ARTICULARES: ${rangeText}.`);
    }
    
    // Fuerza
    if (byType.strength.length > 0) {
      const strengthText = byType.strength.map(s => 
        `${s.location || ''} ${s.side || ''}: ${s.strength}`.trim()
      ).join(', ');
      parts.push(`FUERZA MUSCULAR: ${strengthText}.`);
    }
    
    // Tests específicos
    if (byType.tests.length > 0) {
      const testText = byType.tests.map(t => 
        `${t.test}: ${t.result || 'realizado'}`
      ).join(', ');
      parts.push(`TESTS ESPECIALES: ${testText}.`);
    }
    
    // Otros hallazgos
    if (byType.other.length > 0) {
      const otherText = byType.other.map(o => o.raw).join('. ');
      parts.push(`OBSERVACIONES: ${otherText}.`);
    }
    
    return parts.join(' ');
  }
  
  private static buildAssessment(analysis: any, physical: any): string {
    const findings = [];
    
    // Condiciones identificadas
    const conditions = analysis?.filter((item: any) => 
      item.type === 'condition' || item.text.includes('🔍')
    );
    if (conditions?.length > 0) {
      findings.push(conditions[0].text.replace('🔍', '').trim());
    }
    
    // Interpretación de hallazgos físicos
    const hasLimitation = physical?.some((p: any) => 
      p.result === 'positivo' || p.pain > 5 || p.strength?.includes('3/5')
    );
    
    if (hasLimitation) {
      findings.push('con limitación funcional significativa');
    }
    
    return findings.join(' ') || 'Evaluación en proceso.';
  }
  
  private static buildPlan(analysis: any, physical: any): string {
    const recommendations = [];
    
    // Basado en tests sugeridos
    const suggestedTests = analysis?.filter((item: any) => 
      item.text.includes('📋')
    );
    
    if (suggestedTests?.length > 0) {
      recommendations.push('Continuar evaluación con tests funcionales específicos.');
    }
    
    // Basado en hallazgos
    const hasPain = physical?.some((p: any) => p.pain > 3);
    if (hasPain) {
      recommendations.push('Técnicas de analgesia y control del dolor.');
    }
    
    const hasWeakness = physical?.some((p: any) => 
      p.strength && parseInt(p.strength) < 4
    );
    if (hasWeakness) {
      recommendations.push('Fortalecimiento muscular progresivo.');
    }
    
    const hasRangeLimit = physical?.some((p: any) => 
      p.degrees && parseInt(p.degrees) < 90
    );
    if (hasRangeLimit) {
      recommendations.push('Movilizaciones y ejercicios de flexibilidad.');
    }
    
    recommendations.push('Seguimiento según evolución.');
    
    return recommendations.join(' ') || 'Plan terapéutico a determinar.';
  }
}
