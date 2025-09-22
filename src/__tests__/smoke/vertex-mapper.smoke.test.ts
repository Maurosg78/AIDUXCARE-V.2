import { describe, it, expect } from 'vitest'
import { mapVertexToSpanish } from '../../utils/vertexFieldMapper'

describe('vertexFieldMapper bilingual smoke', () => {
  it('mapea medicamentos desde current_medications_reported.likely_medication', () => {
    const vertex = {
      patient_name: 'Margaret Thompson',
      age: 72,
      chief_complaint: 'Severe hip pain',
      current_medications_reported: [
        { patient_description: 'Gabba-something', likely_medication: 'Gabapentin', reason: 'Nerve pain' },
        { patient_description: 'That blue pill for sleeping', likely_medication: 'Zolpidem or Alprazolam', reason: 'Sleeping' },
        { patient_description: 'Metta-forming', likely_medication: 'Metformin', reason: 'Diabetes' },
        { patient_description: 'Lissino-something', likely_medication: 'Lisinopril', reason: 'Blood pressure' }
      ],
      history_of_present_illness: {
        social_isolation_indicators: 'Lives alone since husband passed away'
      }
    }

    const mapped = mapVertexToSpanish(vertex)
    expect(mapped).toBeTruthy()
    expect(Array.isArray(mapped.medicacion_actual)).toBe(true)
    // Debe contener nombres normalizados
    expect(mapped.medicacion_actual).toEqual(
      expect.arrayContaining(['Gabapentin','Zolpidem or Alprazolam','Metformin','Lisinopril'])
    )
  })

  it('limpia entradas triviales de contexto_psicosocial como "Paciente de 72"', () => {
    const vertex = {
      age: 72,
      history_of_present_illness: { living_situation: 'Lives alone' }
    }
    const mapped = mapVertexToSpanish(vertex)
    expect(Array.isArray(mapped.contexto_psicosocial)).toBe(true)
    // No debe contener "Paciente de 72"
    expect(mapped.contexto_psicosocial.find((x: string) => /Paciente\s+de\s+72/i.test(x))).toBeUndefined()
  })

  it('garantiza arrays por defecto y sin nulls en campos principales', () => {
    const mapped = mapVertexToSpanish({})
    const arrayKeys = [
      'hallazgos_clinicos','contexto_ocupacional','contexto_psicosocial','medicacion_actual',
      'antecedentes_medicos','hallazgos_relevantes','diagnosticos_probables',
      'yellow_flags','red_flags','evaluaciones_fisicas_sugeridas','plan_tratamiento_sugerido'
    ]
    for (const k of arrayKeys) {
      expect(Array.isArray((mapped as any)[k])).toBe(true)
    }
    // Claves string pueden existir aunque vacías
    const stringKeys = ['motivo_consulta','derivacion_recomendada','pronostico_estimado','notas_seguridad','riesgo_legal']
    for (const k of stringKeys) {
      expect((mapped as any)[k] === undefined || typeof (mapped as any)[k] === 'string').toBe(true)
    }
  })
})
