/**
 * @fileoverview Pipeline Integration Tests - UI to Pipeline Connection
 * @version 1.0.0 Enterprise
 * @author AiDuxCare Development Team
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProfessionalWorkflowPage } from '../../pages/ProfessionalWorkflowPage';
import { ProfessionalProfileProvider } from '../../context/ProfessionalProfileContext';
import { useProfessionalProfile } from '../../hooks/useProfessionalProfile';
import { useAuth } from '../../hooks/useAuth';
import { useTranscript } from '../../hooks/useTranscript';
import { useProcessedEntities } from '../../hooks/useProcessedEntities';
import { useSoapData } from '../../hooks/useSoapData';
import { ClinicalDecisionsService } from '../../services/clinicalDecisionsService';

// Mock de los hooks y servicios
vi.mock('../../hooks/useProfessionalProfile');
vi.mock('../../hooks/useAuth');
vi.mock('../../hooks/useTranscript');
vi.mock('../../hooks/useProcessedEntities');
vi.mock('../../hooks/useSoapData');
vi.mock('../../services/clinicalDecisionsService');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

// Mock de Firebase
vi.mock('../../lib/firebase', () => ({
  auth: {},
  db: {}
}));

describe('Pipeline Integration - UI to Pipeline Connection', () => {
  const mockProfile = {
    fullName: 'Dr. María González',
    professionalTitle: 'Fisioterapeuta',
    specialty: 'Fisioterapia Ortopédica',
    email: 'maria@aiduxcare.com'
  };

  const mockUser = {
    displayName: 'Dr. María González',
    email: 'maria@aiduxcare.com',
    professionalTitle: 'Fisioterapeuta',
    specialty: 'Fisioterapia Ortopédica',
    country: 'España'
  };

  const mockTranscript = 'El paciente refiere dolor cervical irradiado hacia el brazo derecho, con parestesias en los dedos índice y medio.';

  const mockEntities = [
    {
      id: 'entity_1',
      type: 'symptom',
      text: 'dolor cervical irradiado',
      confidence: 0.85,
      context: 'dolor cervical'
    },
    {
      id: 'entity_2',
      type: 'anatomy',
      text: 'brazo derecho',
      confidence: 0.90,
      context: 'brazo derecho'
    }
  ];

  const mockInsights = [
    {
      id: 'insight_1',
      title: 'Dolor musculoesquelético identificado',
      description: 'Paciente presenta síntomas dolorosos',
      category: 'diagnosis',
      severity: 'high',
      confidence: 0.85,
      clinicalJustification: 'Síntomas dolorosos consistentes'
    }
  ];

  const mockSoap = {
    soap: {
      subjective: {
        chiefComplaint: 'Dolor cervical irradiado',
        historyOfPresentIllness: 'Dolor de 3 semanas de evolución',
        functionalLimitations: 'Limitación en movimientos cervicales',
        relevantHistory: 'Sin antecedentes traumáticos'
      },
      objective: {
        inspection: 'Paciente con postura compensatoria',
        palpation: 'Dolor a la palpación cervical',
        rangeOfMotion: 'Limitación en rotación derecha',
        strengthTesting: 'Fuerza muscular preservada',
        specialTests: 'Test de Spurling positivo',
        functionalAssessment: 'Limitación funcional moderada'
      },
      assessment: {
        primaryDiagnosis: 'Cervicalgia mecánica',
        differentialDiagnoses: ['Radiculopatía cervical', 'Síndrome miofascial'],
        prognosis: 'Bueno con tratamiento adecuado',
        goals: 'Reducir dolor y mejorar movilidad'
      },
      plan: {
        interventions: ['Terapia manual', 'Ejercicios de movilidad'],
        homeExercises: 'Ejercicios de estiramiento cervical',
        followUp: 'Control en 1 semana',
        patientEducation: 'Educación en ergonomía',
        nextSession: 'Próxima sesión en 1 semana'
      },
      qualityScore: 85,
      reviewRequired: false,
      clinicalComments: ['Evaluación clínica completa realizada']
    },
    clinicalComments: [],
    qualityScore: 85,
    reviewRequired: false,
    complianceFlags: ['HIPAA_COMPLIANT'],
    processingTime: 1500,
    analysisMetadata: {
      entitiesProcessed: 2,
      insightsProcessed: 1,
      averageConfidence: 0.875,
      criticalFindingsCount: 1
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar transcripción real del hook useTranscript', async () => {
    const mockUseTranscript = vi.mocked(useTranscript);
    mockUseTranscript.mockReturnValue({
      transcript: mockTranscript,
      loading: false,
      error: null,
      isRecording: false,
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      clearTranscript: vi.fn()
    });

    const mockUseProcessedEntities = vi.mocked(useProcessedEntities);
    mockUseProcessedEntities.mockReturnValue({
      entities: [],
      insights: [],
      loading: false,
      error: null,
      processTranscript: vi.fn(),
      clearEntities: vi.fn()
    });

    const mockUseSoapData = vi.mocked(useSoapData);
    mockUseSoapData.mockReturnValue({
      soap: null,
      loading: false,
      error: null,
      generateSoap: vi.fn(),
      clearSoap: vi.fn(),
      refresh: vi.fn()
    });

    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false, isAuthenticated: true, login: vi.fn(), logout: vi.fn() });

    const mockUseProfessionalProfile = vi.mocked(useProfessionalProfile);
    mockUseProfessionalProfile.mockReturnValue({ profile: mockProfile, loading: false, error: null });

    render(
      <BrowserRouter>
        <ProfessionalProfileProvider>
          <ProfessionalWorkflowPage />
        </ProfessionalProfileProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(mockTranscript)).toBeInTheDocument();
    });
  });

  it('debe mostrar alertas críticas derivadas de insights reales', async () => {
    const mockUseTranscript = vi.mocked(useTranscript);
    mockUseTranscript.mockReturnValue({
      transcript: mockTranscript,
      loading: false,
      error: null,
      isRecording: false,
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      clearTranscript: vi.fn()
    });

    const mockUseProcessedEntities = vi.mocked(useProcessedEntities);
    mockUseProcessedEntities.mockReturnValue({
      entities: mockEntities,
      insights: mockInsights,
      loading: false,
      error: null,
      processTranscript: vi.fn(),
      clearEntities: vi.fn()
    });

    const mockUseSoapData = vi.mocked(useSoapData);
    mockUseSoapData.mockReturnValue({
      soap: null,
      loading: false,
      error: null,
      generateSoap: vi.fn(),
      clearSoap: vi.fn(),
      refresh: vi.fn()
    });

    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false, isAuthenticated: true, login: vi.fn(), logout: vi.fn() });

    const mockUseProfessionalProfile = vi.mocked(useProfessionalProfile);
    mockUseProfessionalProfile.mockReturnValue({ profile: mockProfile, loading: false, error: null });

    render(
      <BrowserRouter>
        <ProfessionalProfileProvider>
          <ProfessionalWorkflowPage />
        </ProfessionalProfileProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dolor musculoesquelético identificado')).toBeInTheDocument();
    });
  });

  it('debe mostrar highlights automáticos derivados de entidades reales', async () => {
    const mockUseTranscript = vi.mocked(useTranscript);
    mockUseTranscript.mockReturnValue({
      transcript: mockTranscript,
      loading: false,
      error: null,
      isRecording: false,
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      clearTranscript: vi.fn()
    });

    const mockUseProcessedEntities = vi.mocked(useProcessedEntities);
    mockUseProcessedEntities.mockReturnValue({
      entities: mockEntities,
      insights: mockInsights,
      loading: false,
      error: null,
      processTranscript: vi.fn(),
      clearEntities: vi.fn()
    });

    const mockUseSoapData = vi.mocked(useSoapData);
    mockUseSoapData.mockReturnValue({
      soap: null,
      loading: false,
      error: null,
      generateSoap: vi.fn(),
      clearSoap: vi.fn(),
      refresh: vi.fn()
    });

    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false, isAuthenticated: true, login: vi.fn(), logout: vi.fn() });

    const mockUseProfessionalProfile = vi.mocked(useProfessionalProfile);
    mockUseProfessionalProfile.mockReturnValue({ profile: mockProfile, loading: false, error: null });

    render(
      <BrowserRouter>
        <ProfessionalProfileProvider>
          <ProfessionalWorkflowPage />
        </ProfessionalProfileProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('dolor cervical irradiado')).toBeInTheDocument();
      expect(screen.getByText('(85%)')).toBeInTheDocument();
    });
  });

  it('debe mostrar resumen clínico SOAP generado por SOAPGenerationService', async () => {
    const mockUseTranscript = vi.mocked(useTranscript);
    mockUseTranscript.mockReturnValue({
      transcript: mockTranscript,
      loading: false,
      error: null,
      isRecording: false,
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      clearTranscript: vi.fn()
    });

    const mockUseProcessedEntities = vi.mocked(useProcessedEntities);
    mockUseProcessedEntities.mockReturnValue({
      entities: mockEntities,
      insights: mockInsights,
      loading: false,
      error: null,
      processTranscript: vi.fn(),
      clearEntities: vi.fn()
    });

    const mockUseSoapData = vi.mocked(useSoapData);
    mockUseSoapData.mockReturnValue({
      soap: mockSoap,
      loading: false,
      error: null,
      generateSoap: vi.fn(),
      clearSoap: vi.fn(),
      refresh: vi.fn()
    });

    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false, isAuthenticated: true, login: vi.fn(), logout: vi.fn() });

    const mockUseProfessionalProfile = vi.mocked(useProfessionalProfile);
    mockUseProfessionalProfile.mockReturnValue({ profile: mockProfile, loading: false, error: null });

    render(
      <BrowserRouter>
        <ProfessionalProfileProvider>
          <ProfessionalWorkflowPage />
        </ProfessionalProfileProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Resumen')).toBeInTheDocument();
      expect(screen.getByText('Clínico SOAP')).toBeInTheDocument();
      // Buscar el texto específico en el resumen SOAP usando un selector más específico
      const soapSection = screen.getByText('Resumen').closest('div');
      expect(soapSection).toBeInTheDocument();
      expect(screen.getByText('Cervicalgia mecánica')).toBeInTheDocument();
      expect(screen.getByText('Calidad: 85/100')).toBeInTheDocument();
    });
  });

  it('debe persistir decisiones clínicas al confirmar alertas', async () => {
    const mockRecordClinicalDecision = vi.mocked(ClinicalDecisionsService.recordClinicalDecision);
    mockRecordClinicalDecision.mockResolvedValue({
      success: true,
      message: 'Decisión clínica registrada exitosamente',
      decisionId: 'test_decision_id'
    });

    const mockUseTranscript = vi.mocked(useTranscript);
    mockUseTranscript.mockReturnValue({
      transcript: mockTranscript,
      loading: false,
      error: null,
      isRecording: false,
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      clearTranscript: vi.fn()
    });

    const mockUseProcessedEntities = vi.mocked(useProcessedEntities);
    mockUseProcessedEntities.mockReturnValue({
      entities: mockEntities,
      insights: mockInsights,
      loading: false,
      error: null,
      processTranscript: vi.fn(),
      clearEntities: vi.fn()
    });

    const mockUseSoapData = vi.mocked(useSoapData);
    mockUseSoapData.mockReturnValue({
      soap: null,
      loading: false,
      error: null,
      generateSoap: vi.fn(),
      clearSoap: vi.fn(),
      refresh: vi.fn()
    });

    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false, isAuthenticated: true, login: vi.fn(), logout: vi.fn() });

    const mockUseProfessionalProfile = vi.mocked(useProfessionalProfile);
    mockUseProfessionalProfile.mockReturnValue({ profile: mockProfile, loading: false, error: null });

    render(
      <BrowserRouter>
        <ProfessionalProfileProvider>
          <ProfessionalWorkflowPage />
        </ProfessionalProfileProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      const confirmButton = screen.getByText('✓ Confirmar');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(mockRecordClinicalDecision).toHaveBeenCalledWith({
        sessionId: expect.any(String),
        itemId: 'insight_1',
        action: 'confirm',
        userId: 'maria@aiduxcare.com',
        itemType: 'alert',
        itemTitle: 'Dolor musculoesquelético identificado',
        itemDescription: 'Paciente presenta síntomas dolorosos'
      });
    });
  });

  it('debe mostrar estados de carga correctamente', async () => {
    const mockUseTranscript = vi.mocked(useTranscript);
    mockUseTranscript.mockReturnValue({
      transcript: '',
      loading: true,
      error: null,
      isRecording: false,
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      clearTranscript: vi.fn()
    });

    const mockUseProcessedEntities = vi.mocked(useProcessedEntities);
    mockUseProcessedEntities.mockReturnValue({
      entities: [],
      insights: [],
      loading: false,
      error: null,
      processTranscript: vi.fn(),
      clearEntities: vi.fn()
    });

    const mockUseSoapData = vi.mocked(useSoapData);
    mockUseSoapData.mockReturnValue({
      soap: null,
      loading: false,
      error: null,
      generateSoap: vi.fn(),
      clearSoap: vi.fn(),
      refresh: vi.fn()
    });

    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false, isAuthenticated: true, login: vi.fn(), logout: vi.fn() });

    const mockUseProfessionalProfile = vi.mocked(useProfessionalProfile);
    mockUseProfessionalProfile.mockReturnValue({ profile: mockProfile, loading: false, error: null });

    render(
      <BrowserRouter>
        <ProfessionalProfileProvider>
          <ProfessionalWorkflowPage />
        </ProfessionalProfileProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Procesando transcripción...')).toHaveLength(2);
    });
  });

  it('debe mostrar errores del pipeline correctamente', async () => {
    const mockUseTranscript = vi.mocked(useTranscript);
    mockUseTranscript.mockReturnValue({
      transcript: '',
      loading: false,
      error: 'Error al procesar transcripción',
      isRecording: false,
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      clearTranscript: vi.fn()
    });

    const mockUseProcessedEntities = vi.mocked(useProcessedEntities);
    mockUseProcessedEntities.mockReturnValue({
      entities: [],
      insights: [],
      loading: false,
      error: null,
      processTranscript: vi.fn(),
      clearEntities: vi.fn()
    });

    const mockUseSoapData = vi.mocked(useSoapData);
    mockUseSoapData.mockReturnValue({
      soap: null,
      loading: false,
      error: null,
      generateSoap: vi.fn(),
      clearSoap: vi.fn(),
      refresh: vi.fn()
    });

    const mockUseAuth = vi.mocked(useAuth);
    mockUseAuth.mockReturnValue({ user: mockUser, loading: false, isAuthenticated: true, login: vi.fn(), logout: vi.fn() });

    const mockUseProfessionalProfile = vi.mocked(useProfessionalProfile);
    mockUseProfessionalProfile.mockReturnValue({ profile: mockProfile, loading: false, error: null });

    render(
      <BrowserRouter>
        <ProfessionalProfileProvider>
          <ProfessionalWorkflowPage />
        </ProfessionalProfileProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Error: Error al procesar transcripción')).toBeInTheDocument();
    });
  });
});
