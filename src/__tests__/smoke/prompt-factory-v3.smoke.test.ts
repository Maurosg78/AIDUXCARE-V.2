import { describe, it, expect } from 'vitest'
import { PromptFactory as PFv3 } from '../../core/ai/PromptFactory-v3'

describe('PromptFactory-v3 smoke', () => {
  const baseParams = {
    contextoPaciente: 'Paciente adulto sin comorbilidades graves.',
    instrucciones: 'Prioriza seguridad y red flags.',
    transcript: 'Patient reports lower back pain for 2 weeks; two recent falls; ibuprofen 400 mg bid.'
  }

  it('genera prompt con esquema en español (claves) y JSON-only instruction', () => {
    const p = PFv3.create(baseParams)
    // Claves críticas del esquema
    const keys = [
      '"motivo_consulta"', '"hallazgos_clinicos"', '"contexto_ocupacional"',
      '"contexto_psicosocial"', '"medicacion_actual"', '"antecedentes_medicos"',
      '"hallazgos_relevantes"', '"diagnosticos_probables"', '"red_flags"', '"yellow_flags"',
      '"evaluaciones_fisicas_sugeridas"', '"plan_tratamiento_sugerido"',
      '"derivacion_recomendada"', '"pronostico_estimado"', '"notas_seguridad"', '"riesgo_legal"'
    ]
    for (const k of keys) expect(p).toContain(k)

    // Indicaciones críticas
    expect(p.toLowerCase()).toContain('solo un json')           // JSON-only
    expect(p.toLowerCase()).toContain('sin prosa ni markdown')  // no prose/markdown
    // Reglas de idioma
    expect(p.toLowerCase()).toContain('mismo idioma que la transcripción')
  })

  it('incluye la transcripción sin alterarla', () => {
    const p = PFv3.create(baseParams)
    expect(p).toContain(baseParams.transcript)
  })
})
