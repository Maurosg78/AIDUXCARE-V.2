import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProfessionalProfile } from '../hooks/useProfessionalProfile';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { useNavigate } from 'react-router-dom';
import { useTranscript } from '../hooks/useTranscript';
import { useProcessedEntities } from '../hooks/useProcessedEntities';
import { useSoapData } from '../hooks/useSoapData';
import { ClinicalDecisionsService } from '../services/clinicalDecisionsService';
import { PageHeader, Button, Card } from '../shared/ui';

interface Alerta {
  id: string;
  mensaje: string;
  sugerencia: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface Highlight {
  id: string;
  contenido: string;
  selected?: boolean;
  confidence: number;
}

export const ProfessionalWorkflowPage = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useProfessionalProfile();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(1);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [alertasPersistentes, setAlertasPersistentes] = useState<Alerta[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [sessionId] = useState(`session_${Date.now()}`);

  // Hooks del pipeline real
  const { 
    transcript, 
    loading: transcriptLoading, 
    error: transcriptError, 
    isRecording, 
    startRecording, 
    stopRecording 
  } = useTranscript({ 
    enableDemo: process.env.NODE_ENV === 'development' 
  });

  const { 
    entities, 
    insights, 
    loading: entitiesLoading, 
    error: entitiesError 
  } = useProcessedEntities({ 
    sessionId, 
    transcript, 
    autoProcess: true 
  });

  const { 
    soap, 
    loading: soapLoading, 
    error: soapError 
  } = useSoapData({ 
    sessionId, 
    entities, 
    insights, 
    userId: user?.email || undefined,
    autoGenerate: true 
  });

  // Timer de grabación
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      let seconds = 0;
      interval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        setRecordingTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Convertir insights a alertas
  useEffect(() => {
    if (insights && insights.length > 0) {
      const alertasFromInsights: Alerta[] = insights
        .filter(insight => insight.severity === 'high' || insight.severity === 'critical')
        .map(insight => ({
          id: insight.id,
          mensaje: insight.title,
          sugerencia: insight.description,
          severity: insight.severity
        }));
      setAlertasPersistentes(alertasFromInsights);
    }
  }, [insights]);

  // Convertir entidades a highlights
  useEffect(() => {
    if (entities && entities.length > 0) {
      const highlightsFromEntities: Highlight[] = entities
        .filter(entity => entity.confidence > 0.7)
        .map(entity => ({
          id: entity.id,
          contenido: entity.text,
          confidence: entity.confidence,
          selected: false
        }));
      setHighlights(highlightsFromEntities);
    }
  }, [entities]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const confirmarAlerta = async (alertaId: string) => {
    try {
      const alerta = alertasPersistentes.find(a => a.id === alertaId);
      if (alerta && user?.email) {
        await ClinicalDecisionsService.recordClinicalDecision({
          sessionId,
          itemId: alertaId,
          action: 'confirm',
          userId: user.email,
          itemType: 'alert',
          itemTitle: alerta.mensaje,
          itemDescription: alerta.sugerencia
        });
      }
      setAlertasPersistentes(prev => prev.filter(a => a.id !== alertaId));
    } catch (error) {
      console.error('Error al confirmar alerta:', error);
    }
  };

  const descartarAlerta = async (alertaId: string) => {
    try {
      const alerta = alertasPersistentes.find(a => a.id === alertaId);
      if (alerta && user?.email) {
        await ClinicalDecisionsService.recordClinicalDecision({
          sessionId,
          itemId: alertaId,
          action: 'discard',
          userId: user.email,
          itemType: 'alert',
          itemTitle: alerta.mensaje,
          itemDescription: alerta.sugerencia
        });
      }
      setAlertasPersistentes(prev => prev.filter(a => a.id !== alertaId));
    } catch (error) {
      console.error('Error al descartar alerta:', error);
    }
  };

  const guardarMetrica = async (alertaId: string) => {
    try {
      const alerta = alertasPersistentes.find(a => a.id === alertaId);
      if (alerta && user?.email) {
        await ClinicalDecisionsService.recordClinicalDecision({
          sessionId,
          itemId: alertaId,
          action: 'save',
          userId: user.email,
          itemType: 'alert',
          itemTitle: alerta.mensaje,
          itemDescription: alerta.sugerencia
        });
      }
      setAlertasPersistentes(prev => prev.filter(a => a.id !== alertaId));
    } catch (error) {
      console.error('Error al guardar métrica:', error);
    }
  };

  const toggleHighlight = (highlightId: string) => {
    setHighlights(prev => prev.map(h => 
      h.id === highlightId ? { ...h, selected: !h.selected } : h
    ));
  };

  const handleLogout = async () => {
    try {
      await firebaseAuthService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  // Eliminar duplicados en highlights
  const uniqueHighlights = highlights.filter((highlight, index, self) =>
    index === self.findIndex(h => h.contenido === highlight.contenido)
  );

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="text-text-secondary font-light">Cargando flujo profesional...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="text-error text-xl">Error al cargar perfil</div>
          <Button onClick={() => navigate('/command-center')}>
            Volver al Centro de Comando
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Flujo Clínico Profesional"
        subtitle={`Sesión: ${sessionId} | Profesional: ${profile?.fullName || 'N/A'}`}
      >
        <Button variant="outline" onClick={handleLogout}>
          Cerrar Sesión
        </Button>
      </PageHeader>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Pestañas de navegación con diseño consistente */}
        <div className="flex space-x-2 mb-6">
          <button 
            onClick={() => setActiveSection(1)}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeSection === 1 
                ? 'bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Anamnesis Clínica
          </button>
          <button 
            onClick={() => setActiveSection(2)}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeSection === 2 
                ? 'bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Evaluación Física
          </button>
          <button 
            onClick={() => setActiveSection(3)}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeSection === 3 
                ? 'bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Resumen Clínico
          </button>
        </div>

        {/* Banner paciente con diseño consistente */}
        <Card className="mb-6">
          <h2 className="text-2xl font-light text-gray-900 mb-3 tracking-tight">
            María{' '}
            <span className="bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-medium">
              González
            </span>
          </h2>
          <div className="flex space-x-6 text-sm text-gray-600 mb-4 font-light">
            <span>45 años</span>
            <span>Dolor cervical irradiado</span>
            <span>Última visita: 15 Ene 2025</span>
          </div>
          
          <div className="grid grid-cols-2 gap-6 text-sm text-gray-700 font-light">
            <div><strong className="text-gray-900">Tratamiento:</strong> Ejercicios cervicales, tecarterapia</div>
            <div><strong className="text-gray-900">Medicamentos:</strong> Ibuprofeno 400mg cada 8h</div>
            <div><strong className="text-gray-900">Alergias:</strong> Penicilina</div>
            <div><strong className="text-gray-900">Alertas previas:</strong> Hipertensión controlada</div>
          </div>
        </Card>

        {/* Grabación con diseño consistente */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text">
                Grabación de Consulta
              </h2>
              <p className="text-text-secondary mt-1">
                {isRecording ? 'Grabando...' : 'Listo para grabar'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-mono text-text">
                  {recordingTime}
                </div>
                <div className="text-sm text-text-secondary">
                  Duración
                </div>
              </div>
              
              <Button
                onClick={toggleRecording}
                variant={isRecording ? 'secondary' : 'primary'}
                loading={transcriptLoading}
              >
                {isRecording ? 'Detener' : 'Iniciar'} Grabación
              </Button>
            </div>
          </div>
        </Card>

        {/* Layout principal con diseño consistente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* IZQUIERDA - Transcripción */}
          <Card className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
            <h3 className="text-xl font-light text-gray-900 mb-4 tracking-tight">
              Transcripción en{' '}
              <span className="bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-medium">
                Tiempo Real
              </span>
            </h3>
            <div className="min-h-[400px] bg-gray-50 p-6 rounded-xl border border-gray-200">
              {transcriptLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                  <span className="ml-3 text-gray-600">Procesando transcripción...</span>
                </div>
              ) : transcriptError ? (
                <div className="text-red-600 text-center">
                  Error: {transcriptError}
                </div>
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap font-light leading-relaxed">
                  {transcript || 'Presiona "Iniciar Grabación" para comenzar'}
                </p>
              )}
            </div>
          </Card>
          
          {/* DERECHA - Alertas y Highlights */}
          <div className="space-y-6">
            {/* Alertas Críticas */}
            <Card className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
              <h3 className="text-xl font-light text-gray-900 mb-4 tracking-tight">
                Alertas{' '}
                <span className="bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-medium">
                  Críticas
                </span>
              </h3>
              <div className="space-y-4">
                {entitiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                    <span className="ml-3 text-gray-600">Analizando entidades...</span>
                  </div>
                ) : entitiesError ? (
                  <div className="text-red-600 text-center py-4">
                    Error: {entitiesError}
                  </div>
                ) : alertasPersistentes.length > 0 ? (
                  alertasPersistentes.map(alerta => (
                    <div key={alerta.id} className="border-l-4 border-red-500 bg-red-50 p-4 rounded-xl">
                      <p className="font-medium text-red-800 text-sm">{alerta.mensaje}</p>
                      <p className="text-red-600 text-xs mt-2 font-light">{alerta.sugerencia}</p>
                      <div className="flex gap-3 mt-4">
                        <Button 
                          onClick={() => confirmarAlerta(alerta.id)}
                          variant="success"
                          size="sm"
                        >
                          ✓ Confirmar
                        </Button>
                        <Button 
                          onClick={() => descartarAlerta(alerta.id)}
                          variant="outline"
                          size="sm"
                        >
                          ✗ Descartar
                        </Button>
                        <Button 
                          onClick={() => guardarMetrica(alerta.id)}
                          variant="primary"
                          size="sm"
                        >
                          💾 Guardar
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    No hay alertas críticas identificadas
                  </div>
                )}
              </div>
            </Card>
            
            {/* Highlights Automáticos */}
            <Card className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
              <h3 className="text-xl font-light text-gray-900 mb-4 tracking-tight">
                Highlights{' '}
                <span className="bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-medium">
                  Automáticos
                </span>
              </h3>
              <div className="space-y-3">
                {entitiesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                    <span className="ml-3 text-gray-600">Generando highlights...</span>
                  </div>
                ) : entitiesError ? (
                  <div className="text-red-600 text-center py-4">
                    Error: {entitiesError}
                  </div>
                ) : uniqueHighlights.length > 0 ? (
                  uniqueHighlights.map(highlight => (
                    <div key={highlight.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <input 
                        type="checkbox" 
                        onChange={() => toggleHighlight(highlight.id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700 font-light">{highlight.contenido}</span>
                      <span className="text-xs text-gray-500">({Math.round(highlight.confidence * 100)}%)</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    No hay highlights automáticos disponibles
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Resumen Clínico SOAP */}
        {soap && (
          <Card className="mt-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
            <h3 className="text-xl font-light text-gray-900 mb-4 tracking-tight">
              Resumen{' '}
              <span className="bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-medium">
                Clínico SOAP
              </span>
            </h3>
            {soapLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                <span className="ml-3 text-gray-600">Generando resumen clínico...</span>
              </div>
            ) : soapError ? (
              <div className="text-red-600 text-center py-4">
                Error: {soapError}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Subjetivo</h4>
                  <p className="text-sm text-gray-700 mb-4">{soap.soap.subjective.chiefComplaint}</p>
                  
                  <h4 className="font-medium text-gray-900 mb-2">Objetivo</h4>
                  <p className="text-sm text-gray-700 mb-4">{soap.soap.objective.inspection}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Evaluación</h4>
                  <p className="text-sm text-gray-700 mb-4">{soap.soap.assessment.primaryDiagnosis}</p>
                  
                  <h4 className="font-medium text-gray-900 mb-2">Plan</h4>
                  <p className="text-sm text-gray-700 mb-4">{soap.soap.plan.interventions.join(', ')}</p>
                </div>
              </div>
            )}
            {soap && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Calidad: {soap.qualityScore}/100
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    soap.reviewRequired 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {soap.reviewRequired ? 'Requiere Revisión' : 'Aprobado'}
                  </span>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}; 