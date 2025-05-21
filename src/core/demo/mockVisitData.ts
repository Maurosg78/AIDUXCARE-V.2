import { vi } from "vitest";
import { v4 as uuidv4 } from 'uuid';
import { MCPContext, MCPMemoryBlock } from '@/core/mcp/schema';
import type { AgentSuggestion, SuggestionField } from '@/types/agent';
import { TranscriptionSegment } from '@/core/audio/AudioCaptureService';
import { AuditLogEntry } from '@/core/audit/AuditLogger';

/**
 * Información simulada del paciente para la demo
 */
export const mockPatient = {
  id: 'patient-demo-001',
  name: 'Alejandro Sánchez',
  age: 68,
  gender: 'Masculino',
  insuranceId: 'INS-54321',
  birthDate: '1955-08-15',
};

/**
 * Información simulada de la visita para la demo
 */
export const mockVisit = {
  id: 'visit-demo-20230615',
  date: '2023-06-15T09:30:00Z',
  type: 'Consulta de seguimiento',
  provider: 'Dra. Carmen Ruiz',
  department: 'Medicina Interna',
  facility: 'Hospital Universitario AiduxCare',
};

/**
 * Tipo extendido para los bloques de memoria en el contexto de la demo
 * que incluye las propiedades opcionales necesarias
 */
export interface ExtendedMCPMemoryBlock extends MCPMemoryBlock {
  visit_id?: string;
  patient_id?: string;
  timestamp: string;
  validated: boolean;
}

/**
 * Contexto MCP simulado para la demo
 */
export const mockMCPContext: MCPContext = {
  contextual: {
    source: 'demo-ehr',
    data: [
      {
        id: 'ctx-demo-1',
        type: 'contextual',
        content: 'Paciente masculino de 68 años acude a consulta de seguimiento por hipertensión y diabetes tipo 2. Refiere episodios de mareo ocasional al levantarse y dolor intermitente en extremidades inferiores.',
        timestamp: new Date('2023-06-15T09:35:00Z').toISOString(),
        visit_id: 'visit-demo-20230615',
        patient_id: 'patient-demo-001',
        validated: true
      } as ExtendedMCPMemoryBlock,
      {
        id: 'ctx-demo-2',
        type: 'contextual',
        content: 'Signos vitales: TA 152/88 mmHg, FC 76 lpm, FR 16 rpm, T 36.5°C, SatO2 97%, Glucemia capilar 156 mg/dL.',
        timestamp: new Date('2023-06-15T09:40:00Z').toISOString(), 
        visit_id: 'visit-demo-20230615',
        patient_id: 'patient-demo-001',
        validated: true
      } as ExtendedMCPMemoryBlock,
      {
        id: 'ctx-demo-3',
        type: 'contextual',
        content: 'Medicación actual: Metformina 850mg c/12h, Enalapril 10mg c/24h, Amlodipino 5mg c/24h, AAS 100mg c/24h.',
        timestamp: new Date('2023-06-15T09:42:00Z').toISOString(),
        visit_id: 'visit-demo-20230615',
        patient_id: 'patient-demo-001',
        validated: true
      } as ExtendedMCPMemoryBlock
    ]
  },
  persistent: {
    source: 'demo-ehr-history',
    data: [
      {
        id: 'per-demo-1',
        type: 'persistent',
        content: 'Diagnósticos: Hipertensión arterial esencial (I10) desde 2015, Diabetes mellitus tipo 2 (E11) desde 2018, Dislipemia mixta (E78.2) desde 2019.',
        timestamp: new Date('2021-03-10T11:20:00Z').toISOString(),
        patient_id: 'patient-demo-001',
        validated: true
      } as ExtendedMCPMemoryBlock,
      {
        id: 'per-demo-2',
        type: 'persistent',
        content: 'Antecedentes quirúrgicos: Apendicectomía (1985), Colecistectomía laparoscópica (2010).',
        timestamp: new Date('2020-05-22T14:15:00Z').toISOString(),
        patient_id: 'patient-demo-001',
        validated: true
      } as ExtendedMCPMemoryBlock,
      {
        id: 'per-demo-3',
        type: 'persistent',
        content: 'Alergias: Penicilina (reacción cutánea severa), Sulfamidas (reacción moderada).',
        timestamp: new Date('2019-09-03T10:45:00Z').toISOString(),
        patient_id: 'patient-demo-001',
        validated: true
      } as ExtendedMCPMemoryBlock
    ]
  },
  semantic: {
    source: 'demo-knowledge',
    data: [
      {
        id: 'sem-demo-1',
        type: 'semantic',
        content: 'Últimos resultados de laboratorio (2023-05-20): Glucemia 142 mg/dL, HbA1c 7.2%, Creatinina 1.1 mg/dL, Colesterol total 195 mg/dL, HDL 45 mg/dL, LDL 120 mg/dL, Triglicéridos 156 mg/dL.',
        timestamp: new Date('2023-05-25T08:30:00Z').toISOString(),
        patient_id: 'patient-demo-001',
        validated: true
      } as ExtendedMCPMemoryBlock,
      {
        id: 'sem-demo-2',
        type: 'semantic',
        content: 'Último fondo de ojo (2023-01-15): Retinopatía diabética no proliferativa leve en ojo derecho. Sin alteraciones en ojo izquierdo.',
        timestamp: new Date('2023-01-20T15:10:00Z').toISOString(),
        patient_id: 'patient-demo-001',
        validated: true
      } as ExtendedMCPMemoryBlock
    ]
  }
};

/**
 * Sugerencias del agente simuladas para la demo
 */
export const mockAgentSuggestions: AgentSuggestion[] = [
  {
    id: uuidv4(),
    sourceBlockId: 'ctx-demo-2',
    type: 'warning',
    content: 'La presión arterial del paciente (152/88 mmHg) está por encima del objetivo terapéutico para un paciente diabético (140/90 mmHg). Considerar ajuste en la medicación antihipertensiva.',
    field: 'vitals',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
    sourceBlockId: 'ctx-demo-1',
    type: 'recommendation',
    content: 'Evaluar neuropatía diabética por el dolor en extremidades inferiores. Aplicar escala DN4 o similar para valoración.',
    field: 'symptoms',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
    sourceBlockId: 'sem-demo-1',
    type: 'info',
    content: 'HbA1c 7.2%. Objetivo terapéutico por guía ADA 2023 para este paciente: <7.0%. Considerar revisar tratamiento diabetológico.',
    field: 'lab_results',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
    sourceBlockId: 'ctx-demo-1',
    type: 'recommendation',
    content: 'Episodios de mareo al levantarse sugieren hipotensión ortostática. Realizar prueba de ortostatismo en consulta y educar al paciente sobre medidas preventivas.',
    field: 'symptoms',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: uuidv4(),
    sourceBlockId: 'per-demo-3',
    type: 'warning',
    content: 'Paciente alérgico a Penicilina y Sulfamidas. Documentar prominentemente en historia clínica y verificar que no existan interacciones con medicación actual.',
    field: 'history',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * Transcripciones de audio simuladas para la demo
 */
export const mockTranscription: TranscriptionSegment[] = [
  {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    actor: 'profesional',
    content: 'Buenos días, Don Alejandro. ¿Cómo se ha encontrado desde la última visita?',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    actor: 'paciente',
    content: 'Buenos días, doctora. Pues mire, en general estoy mejor, pero sigo con esos mareos cuando me levanto rápido por las mañanas.',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    actor: 'profesional',
    content: '¿Ha tomado la tensión en casa como le recomendé?',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    actor: 'paciente',
    content: 'Sí, me la he tomado todas las mañanas. Los valores están entre 140 y 155 la máxima, y entre 85 y 90 la mínima.',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    actor: 'profesional',
    content: 'Y respecto a los dolores en las piernas que me mencionó la última vez, ¿continúan?',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    actor: 'paciente',
    content: 'Sí, sobre todo por las noches. Es como un hormigueo y a veces calambres.',
    confidence: 'poco_claro'
  },
  {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    actor: 'acompañante',
    content: 'También ha tenido episodios de visión borrosa un par de veces, aunque no duraron mucho.',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    actor: 'profesional',
    content: 'Entiendo. Vamos a hacer una exploración completa y ajustar el tratamiento. También le pediré una analítica completa.',
    confidence: 'entendido'
  }
];

/**
 * Logs de auditoría simulados para la demo
 */
export const mockAuditLogs: AuditLogEntry[] = [
  {
    timestamp: new Date('2023-06-15T09:35:00Z').toISOString(),
    user_id: 'user-demo-001',
    event_type: 'visit.created',
    visit_id: 'visit-demo-20230615',
    details: {
      visit_id: 'visit-demo-20230615',
      patient_id: 'patient-demo-001'
    }
  },
  {
    timestamp: new Date('2023-06-15T09:40:00Z').toISOString(),
    user_id: 'user-demo-001',
    event_type: 'mcp.context.generated',
    visit_id: 'visit-demo-20230615',
    details: {
      visit_id: 'visit-demo-20230615',
      blocks_count: 7
    }
  },
  {
    timestamp: new Date('2023-06-15T09:41:00Z').toISOString(),
    user_id: 'user-demo-001',
    event_type: 'agent.suggestions.generated',
    visit_id: 'visit-demo-20230615',
    details: {
      visit_id: 'visit-demo-20230615',
      suggestions_count: 5
    }
  }
];

/**
 * Datos del EMR simulados para la demo
 */
export const mockEMRData = {
  subjective: 'Paciente refiere episodios de mareo al levantarse por las mañanas. Continúa con dolor tipo hormigueo y ocasionales calambres en MMII, predominantemente nocturnos. Familiar refiere episodios breves de visión borrosa en dos ocasiones.',
  objective: 'TA 152/88 mmHg, FC 76 lpm, FR 16 rpm, T 36.5°C, SatO2 97%, Glucemia capilar 156 mg/dL. Exploración cardiopulmonar: rítmico, sin soplos, murmullo vesicular conservado. MMII: pulsos presentes y simétricos, sin edemas, sensibilidad táctil y vibratoria ligeramente disminuida en ambos pies.',
  assessment: 'Hipertensión arterial con control subóptimo.\nDiabetes mellitus tipo 2 con posible inicio de neuropatía periférica.',
  plan: 'Ajuste de medicación: Aumentar Amlodipino a 10mg c/24h.\nSolicitar: HbA1c, perfil renal, iones, ECG, microalbuminuria.\nDerivación a Oftalmología para valoración de retinopatía.\nRecomendaciones específicas sobre manejo de hipotensión ortostática.',
  notes: 'Próxima revisión en 1 mes con resultados. El paciente comprende los cambios en el tratamiento y los signos de alarma que requieren atención inmediata.'
};

/**
 * ID del usuario simulado para la demo
 */
export const mockUserId = 'user-demo-001'; 