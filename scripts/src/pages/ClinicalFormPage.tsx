import React, { useState } from 'react';
import {
  FormSectionTitle,
  BodyText,
  Caption,
  Label,
  Button,
  QuickActionButton,
  FinishConsultationButton,
  Icon,
  ClinicalStatusIcon,
  RiskLevelIcon,
  SOAPSectionCard,
  AIAssistantCard,
  PatientHistoryCard,
  AudioTranscriptionCard,
  QuickActionsCard,
  TwoColumnLayout,
  colors,
  spacing,
} from '../shared/components/UI';

import {
  Patient,
  Visit,
  SOAPForm,
  AISuggestion,
  AudioTranscription,
  VitalSigns,
  ClinicalEvolution,
  RiskLevel,
  ClinicalViewState,
} from '../types/clinical';

// === DATOS MOCK ===
const mockPatient: Patient = {
  id: 'patient-001',
  name: 'Andrea Bultó',
  age: 29,
  gender: 'female',
  insuranceId: 'ASEG-29381',
  email: 'andrea@aiduxcare.test',
};

const mockVisit: Visit = {
  id: 'visit-002',
  patientId: 'patient-001',
  professionalId: 'prof-001',
  date: '2024-01-15T14:30:00Z',
  type: 'seguimiento',
  status: 'in_progress',
  notes: 'Visita de seguimiento por dolor lumbo-cervical',
};

const mockSOAPForm: SOAPForm = {
  id: 'soap-002',
  visitId: 'visit-002',
  subjective: 'Paciente refiere mejora parcial del dolor cervical, pero persistencia del dolor lumbar, especialmente al final de la jornada laboral. Ha implementado algunas de las recomendaciones ergonómicas y realiza los ejercicios diariamente.',
  objective: 'Exploración física:\n- Reducción de contractura en trapecio bilateral\n- Mejoría en rango de movilidad cervical\n- Persistencia de puntos gatillo en región lumbar',
  assessment: 'Evolución favorable del dolor cervical. Persistencia de dolor lumbar mecánico. Cumplimiento parcial del plan terapéutico.',
  plan: '1. Continuar ejercicios cervicales\n2. Intensificar ejercicios lumbares\n3. Evaluación ergonómica del puesto de trabajo\n4. Control en 2 semanas',
  notes: '',
  status: 'draft',
  createdAt: '2024-01-15T14:30:00Z',
  updatedAt: '2024-01-15T14:35:00Z',
};

const mockAISuggestions: AISuggestion[] = [
  {
    id: 'ai-001',
    visitId: 'visit-002',
    type: 'recommendation',
    content: 'Considerar antiinflamatorio tópico para zona lumbar',
    confidence: 85,
    status: 'pending',
    section: 'plan',
    createdAt: '2024-01-15T14:32:00Z',
  },
  {
    id: 'ai-002',
    visitId: 'visit-002',
    type: 'clinical',
    content: 'Derivar a fisioterapia especializada en columna',
    confidence: 92,
    status: 'pending',
    section: 'plan',
    createdAt: '2024-01-15T14:33:00Z',
  },
  {
    id: 'ai-003',
    visitId: 'visit-002',
    type: 'warning',
    content: 'Solicitar RMN lumbar si no mejora en 2 semanas',
    confidence: 78,
    status: 'pending',
    section: 'plan',
    createdAt: '2024-01-15T14:34:00Z',
  },
];

const mockVitalSigns: VitalSigns = {
  bloodPressure: { systolic: 120, diastolic: 80 },
  heartRate: 72,
  temperature: 36.5,
};

const mockClinicalEvolution: ClinicalEvolution = {
  status: 'improved',
  description: 'Dolor: 8/10 → 4/10, Movilidad: +30%',
  date: '2024-01-15',
};

const mockRiskLevel: RiskLevel = {
  level: 'medium',
  factors: ['Persistencia dolor lumbar', 'Factores ergonómicos'],
  recommendations: ['Evaluación ergonómica', 'Seguimiento estrecho'],
};

const mockAudioTranscription: AudioTranscription = {
  id: 'audio-001',
  visitId: 'visit-002',
  content: 'La paciente refiere que el dolor cervical ha mejorado considerablemente...',
  duration: 323,
  status: 'recording',
  createdAt: '2024-01-15T14:30:00Z',
};

// === COMPONENTE HEADER CLÍNICO ===
const ClinicalHeader: React.FC<{
  patient: Patient;
  visit: Visit;
}> = ({ patient, visit }) => {
  const headerStyle: React.CSSProperties = {
    height: '100px',
    backgroundColor: colors.white,
    borderBottom: `2px solid ${colors.gray[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `0 ${spacing[6]}`,
  };

  const patientInfoStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
  };

  const visitInfoStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
    textAlign: 'center',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing[3],
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <header style={headerStyle}>
      <div style={patientInfoStyle}>
        <div style={{ fontSize: '18px', fontWeight: '600', color: colors.gray[900] }}>
          <Icon name="user" size="sm" color={colors.gray[600]} /> {patient.name}, {patient.age} años
        </div>
        <Caption color="textSecondary">
          ID: {patient.insuranceId}
        </Caption>
      </div>

      <div style={visitInfoStyle}>
        <div style={{ fontSize: '16px', fontWeight: '500', color: colors.gray[700] }}>
          <Icon name="calendar" size="sm" color={colors.gray[600]} /> Visita de {visit.type}
        </div>
        <Caption color="textSecondary">
          {formatDate(visit.date)}
        </Caption>
      </div>

      <div style={actionsStyle}>
        <QuickActionButton leftIcon="document-duplicate">
          Guardar
        </QuickActionButton>
        <FinishConsultationButton>
          Finalizar
        </FinishConsultationButton>
        <QuickActionButton leftIcon="printer">
          Imprimir
        </QuickActionButton>
      </div>
    </header>
  );
};

// === COMPONENTE SECCIÓN SOAP ===
const SOAPSection: React.FC<{
  title: string;
  content: string;
  aiSuggestion?: AISuggestion;
  vitalSigns?: VitalSigns;
  riskLevel?: RiskLevel;
}> = ({ title, content, aiSuggestion, vitalSigns, riskLevel }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);

  const sectionStyle: React.CSSProperties = {
    marginBottom: spacing[6],
  };

  const contentStyle: React.CSSProperties = {
    minHeight: '120px',
    padding: spacing[4],
    border: `1px solid ${colors.gray[300]}`,
    borderRadius: '8px',
    backgroundColor: colors.white,
    fontSize: '16px',
    lineHeight: '1.6',
    color: colors.gray[700],
    fontFamily: 'Inter, sans-serif',
    resize: 'vertical' as const,
    width: '100%',
  };

  const suggestionStyle: React.CSSProperties = {
    backgroundColor: colors.primary[50],
    borderLeft: `4px solid ${colors.primary[500]}`,
    padding: spacing[3],
    marginTop: spacing[3],
    borderRadius: '6px',
  };

  const vitalSignsStyle: React.CSSProperties = {
    backgroundColor: colors.success[50],
    padding: spacing[2],
    borderRadius: '6px',
    marginTop: spacing[3],
    display: 'flex',
    gap: spacing[4],
    flexWrap: 'wrap' as const,
  };

  const riskIndicatorStyle: React.CSSProperties = {
    backgroundColor: colors.warning[100],
    color: colors.warning[800],
    padding: `${spacing[2]} ${spacing[3]}`,
    borderRadius: '6px',
    marginTop: spacing[3],
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  };

  return (
    <SOAPSectionCard style={sectionStyle}>
      <div style={{ marginBottom: spacing[4] }}>
        <FormSectionTitle>{title}</FormSectionTitle>
      </div>

      {isEditing ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          style={contentStyle}
          onBlur={() => setIsEditing(false)}
          autoFocus
        />
      ) : (
        <div
          style={contentStyle}
          onClick={() => setIsEditing(true)}
        >
          {content || 'Haz clic para editar...'}
        </div>
      )}

      {aiSuggestion && (
        <div style={suggestionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            <Icon name="beaker" size="sm" color={colors.primary[600]} />
            <Caption weight="medium" color={colors.primary[700]}>
              Sugerencia IA: {aiSuggestion.content}
            </Caption>
          </div>
        </div>
      )}

      {vitalSigns && (
        <div style={vitalSignsStyle}>
          <Caption weight="medium" color={colors.success[700]}>
            Signos Vitales:
          </Caption>
          {vitalSigns.bloodPressure && (
            <Caption color={colors.success[700]}>
              TA: {vitalSigns.bloodPressure.systolic}/{vitalSigns.bloodPressure.diastolic} mmHg
            </Caption>
          )}
          {vitalSigns.heartRate && (
            <Caption color={colors.success[700]}>
              FC: {vitalSigns.heartRate} lpm
            </Caption>
          )}
          {vitalSigns.temperature && (
            <Caption color={colors.success[700]}>
              Tª: {vitalSigns.temperature}°C
            </Caption>
          )}
        </div>
      )}

      {riskLevel && (
        <div style={riskIndicatorStyle}>
          <RiskLevelIcon level={riskLevel.level} size="sm" />
          <Caption weight="semibold" color={colors.warning[800]}>
            Nivel de Riesgo: {riskLevel.level.toUpperCase()}
          </Caption>
        </div>
      )}
    </SOAPSectionCard>
  );
};

// === COMPONENTE ASISTENTE IA ===
const AIAssistant: React.FC<{
  suggestions: AISuggestion[];
}> = ({ suggestions }) => {
  const assistantStyle: React.CSSProperties = {
    marginBottom: spacing[6],
  };

  const statusStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  };

  const suggestionItemStyle: React.CSSProperties = {
    backgroundColor: colors.white,
    padding: spacing[2],
    borderRadius: '6px',
    marginBottom: spacing[2],
    border: `1px solid ${colors.gray[200]}`,
  };

  return (
    <AIAssistantCard style={assistantStyle}>
      <div style={{ marginBottom: spacing[4] }}>
        <FormSectionTitle color={colors.success[700]}>
          🤖 Copiloto Clínico
        </FormSectionTitle>
      </div>

      <div style={statusStyle}>
        <div style={{
          width: '8px',
          height: '8px',
          backgroundColor: colors.success[500],
          borderRadius: '50%',
        }} />
        <Caption weight="medium" color={colors.success[700]}>
          Activo - Analizando...
        </Caption>
      </div>

      <div>
        <Label style={{ marginBottom: spacing[3] }}>💡 Sugerencias</Label>
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} style={suggestionItemStyle}>
            <BodyText size="sm" style={{ marginBottom: spacing[1] }}>
              {suggestion.content}
            </BodyText>
            <Caption color="textSecondary">
              Confianza: {suggestion.confidence}%
            </Caption>
          </div>
        ))}
      </div>
    </AIAssistantCard>
  );
};

// === COMPONENTE HISTORIAL PACIENTE ===
const PatientHistory: React.FC<{
  evolution: ClinicalEvolution;
}> = ({ evolution }) => {
  const historyStyle: React.CSSProperties = {
    marginBottom: spacing[6],
  };

  return (
    <PatientHistoryCard style={historyStyle}>
      <div style={{ marginBottom: spacing[4] }}>
        <FormSectionTitle color={colors.warning[800]}>
          📚 Historial Relevante
        </FormSectionTitle>
      </div>

      <div style={{ marginBottom: spacing[3] }}>
        <Caption weight="medium" color={colors.warning[800]}>
          📅 Visita Anterior (8 Ene)
        </Caption>
        <BodyText size="sm" color={colors.warning[800]}>
          Dolor inicial 8/10<br />
          Contractura severa
        </BodyText>
      </div>

      <div style={{ marginTop: spacing[3] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
          <ClinicalStatusIcon status={evolution.status} size="sm" />
          <Caption weight="medium" color={colors.success[700]}>
            Evolución
          </Caption>
        </div>
        <BodyText size="sm" color={colors.success[700]}>
          {evolution.description}
        </BodyText>
      </div>
    </PatientHistoryCard>
  );
};

// === COMPONENTE TRANSCRIPCIÓN AUDIO ===
const AudioTranscription: React.FC<{
  transcription: AudioTranscription;
}> = ({ transcription }) => {
  const audioStyle: React.CSSProperties = {
    marginBottom: spacing[6],
  };

  const statusStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AudioTranscriptionCard style={audioStyle}>
      <div style={{ marginBottom: spacing[4] }}>
        <FormSectionTitle color={colors.primary[800]}>
          🎤 Audio de la Consulta
        </FormSectionTitle>
      </div>

      <div style={statusStyle}>
        <div style={{
          width: '8px',
          height: '8px',
          backgroundColor: colors.error[500],
          borderRadius: '50%',
        }} />
        <Caption weight="medium" color={colors.error[600]}>
          Grabando... {formatDuration(transcription.duration)}
        </Caption>
      </div>

      <div style={{
        backgroundColor: colors.white,
        padding: spacing[2],
        borderRadius: '6px',
        fontStyle: 'italic',
      }}>
        <BodyText size="sm" color={colors.gray[700]}>
          "{transcription.content}"
        </BodyText>
      </div>
    </AudioTranscriptionCard>
  );
};

// === COMPONENTE ACCIONES RÁPIDAS ===
const QuickActions: React.FC = () => {
  const actionsStyle: React.CSSProperties = {
    marginBottom: spacing[6],
  };

  const actionButtonStyle: React.CSSProperties = {
    width: '100%',
    marginBottom: spacing[2],
    justifyContent: 'flex-start',
  };

  return (
    <QuickActionsCard style={actionsStyle}>
      <div style={{ marginBottom: spacing[4] }}>
        <FormSectionTitle color={colors.gray[700]}>
          ⚡ Acciones Rápidas
        </FormSectionTitle>
      </div>

      <QuickActionButton leftIcon="document-text" style={actionButtonStyle}>
        Generar Receta
      </QuickActionButton>
      <QuickActionButton leftIcon="chart-pie" style={actionButtonStyle}>
        Ver Métricas
      </QuickActionButton>
      <QuickActionButton leftIcon="envelope" style={actionButtonStyle}>
        Enviar Resumen
      </QuickActionButton>
      <QuickActionButton leftIcon="printer" style={actionButtonStyle}>
        Imprimir Ficha
      </QuickActionButton>
    </QuickActionsCard>
  );
};

// === COMPONENTE BARRA INFERIOR ===
const BottomBar: React.FC = () => {
  const barStyle: React.CSSProperties = {
    height: '80px',
    backgroundColor: colors.gray[50],
    borderTop: `1px solid ${colors.gray[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `0 ${spacing[6]}`,
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  };

  return (
    <div style={barStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
        <Icon name="check-circle" size="sm" color={colors.success[500]} />
        <Caption color="textSecondary">
          Guardado automático - Última actualización: 14:35
        </Caption>
      </div>

      <Caption weight="medium" color={colors.success[600]}>
        📊 Progreso: 75% completado
      </Caption>

      <FinishConsultationButton>
        🎯 Finalizar Consulta
      </FinishConsultationButton>
    </div>
  );
};

// === COMPONENTE PRINCIPAL ===
const ClinicalFormPage: React.FC = () => {
  // Columna izquierda - Formulario SOAP
  const leftColumn = (
    <div>
      <SOAPSection
        title="🗣️ Subjetivo"
        content={mockSOAPForm.subjective}
        aiSuggestion={mockAISuggestions.find(s => s.section === 'subjective')}
      />
      
      <SOAPSection
        title="🔍 Objetivo"
        content={mockSOAPForm.objective}
        vitalSigns={mockVitalSigns}
      />
      
      <SOAPSection
        title="🎯 Evaluación"
        content={mockSOAPForm.assessment}
        riskLevel={mockRiskLevel}
      />
      
      <SOAPSection
        title="📋 Plan"
        content={mockSOAPForm.plan}
        aiSuggestion={mockAISuggestions.find(s => s.section === 'plan')}
      />
    </div>
  );

  // Columna derecha - Panel lateral
  const rightColumn = (
    <div>
      <AIAssistant suggestions={mockAISuggestions} />
      <PatientHistory evolution={mockClinicalEvolution} />
      <AudioTranscription transcription={mockAudioTranscription} />
      <QuickActions />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.gray[50], paddingBottom: '80px' }}>
      <ClinicalHeader patient={mockPatient} visit={mockVisit} />
      
      <div style={{ padding: `${spacing[6]} 0` }}>
        <TwoColumnLayout
          leftColumn={leftColumn}
          rightColumn={rightColumn}
        />
      </div>
      
      <BottomBar />
    </div>
  );
};

export default ClinicalFormPage; 