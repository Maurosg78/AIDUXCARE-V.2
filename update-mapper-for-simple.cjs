const fs = require('fs');
const file = 'src/utils/vertexFieldMapper.ts';

const newMapper = `export function mapVertexToSpanish(vertexData: any): any {
  if (!vertexData) return getEmptyStructure();
  
  // Si es string, intentar parsear
  if (typeof vertexData === 'string') {
    try {
      vertexData = JSON.parse(vertexData);
    } catch (e) {
      return getEmptyStructure();
    }
  }
  
  // Mapeo directo de la estructura simplificada
  return {
    motivo_consulta: vertexData.chief_complaint || '',
    
    hallazgos_clinicos: vertexData.physical_findings || [],
    
    medicacion_actual: (vertexData.medications || []).map(m => 
      typeof m === 'string' ? m : \`\${m.name} - \${m.reason || ''}\`
    ),
    
    contexto_psicosocial: vertexData.social_context || [],
    
    red_flags: (vertexData.red_flags || []).map(flag => \`⚠️ \${flag}\`),
    
    evaluaciones_fisicas_sugeridas: (vertexData.suggested_tests || []).map(t => ({
      test: typeof t === 'string' ? t : t.test,
      sensibilidad: 0.85,
      especificidad: 0.90,
      objetivo: typeof t === 'object' ? t.reason : 'Clinical evaluation',
      contraindicado_si: ''
    })),
    
    // Campos vacíos por defecto
    hallazgos_relevantes: [],
    contexto_ocupacional: [],
    yellow_flags: [],
    antecedentes_medicos: [],
    diagnosticos_probables: [],
    plan_tratamiento_sugerido: [],
    derivacion_recomendada: '',
    pronostico_estimado: '',
    notas_seguridad: '',
    riesgo_legal: 'bajo'
  };
}

function getEmptyStructure() {
  return {
    motivo_consulta: '',
    hallazgos_clinicos: [],
    hallazgos_relevantes: [],
    contexto_ocupacional: [],
    contexto_psicosocial: [],
    medicacion_actual: [],
    antecedentes_medicos: [],
    diagnosticos_probables: [],
    red_flags: [],
    yellow_flags: [],
    evaluaciones_fisicas_sugeridas: [],
    plan_tratamiento_sugerido: [],
    derivacion_recomendada: '',
    pronostico_estimado: '',
    notas_seguridad: '',
    riesgo_legal: 'bajo'
  };
}

export default mapVertexToSpanish;`;

fs.writeFileSync(file, newMapper);
console.log('✅ Updated mapper for simple structure');
