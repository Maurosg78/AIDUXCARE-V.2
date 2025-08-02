import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface Alerta {
  id: number;
  mensaje: string;
  sugerencia: string;
}

interface Highlight {
  id: number;
  contenido: string;
  selected?: boolean;
}

export const ProfessionalWorkflowPage = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState('00:00');
  const [transcriptionText, setTranscriptionText] = useState('');
  const [alertasPersistentes, setAlertasPersistentes] = useState<Alerta[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);

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

  // Datos simulados para testing
  const alertasSimuladas: Alerta[] = [
    {
      id: 1,
      mensaje: "POSIBLE IATROGENIA: Aspirina + anticoagulantes",
      sugerencia: "¿Está segura que es aspirina y no otro analgésico?"
    },
    {
      id: 2,
      mensaje: "RIESGO ALERGIA: Penicilina mencionada",
      sugerencia: "¿Está segura que es aspirina?"
    }
  ];

  const highlightsSimulados: Highlight[] = [
    { id: 1, contenido: "Posible síndrome opérculo torácico" },
    { id: 2, contenido: "Evaluar compromiso neurológico" },
    { id: 3, contenido: "Considerar estudios de imagen" },
    { id: 4, contenido: "Revisar medicación actual" }
  ];

  // Eliminar duplicados en highlights
  const uniqueHighlights = highlights.filter((highlight, index, self) =>
    index === self.findIndex(h => h.contenido === highlight.contenido)
  );

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Generar highlights finales
      setHighlights(highlightsSimulados);
      setTranscriptionText("Transcripción simulada: El paciente refiere dolor cervical irradiado hacia el brazo derecho, con parestesias en los dedos índice y medio. El dolor se agrava con movimientos de flexión cervical y rotación hacia la derecha. No refiere traumatismo previo. El dolor comenzó hace 3 semanas de forma progresiva.");
    } else {
      setIsRecording(true);
      setTranscriptionText('');
      setHighlights([]);
      // Agregar alertas simuladas
      setAlertasPersistentes(alertasSimuladas);
    }
  };

  const confirmarAlerta = (alertaId: number) => {
    setAlertasPersistentes(prev => prev.filter(a => a.id !== alertaId));
  };

  const descartarAlerta = (alertaId: number) => {
    setAlertasPersistentes(prev => prev.filter(a => a.id !== alertaId));
  };

  const guardarMetrica = (alertaId: number) => {
    setAlertasPersistentes(prev => prev.filter(a => a.id !== alertaId));
  };

  const toggleHighlight = (highlightId: number) => {
    setHighlights(prev => prev.map(h => 
      h.id === highlightId ? { ...h, selected: !h.selected } : h
    ));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="professional-workflow min-h-screen bg-gray-50">
      {/* === 1. ESTRUCTURA BÁSICA === */}
      {/* Header con datos profesional */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-semibold text-gray-800">AiDuxCare | Asistente clínico impulsado por inteligencia artificial</div>
              <div className="text-sm text-gray-600">
                {user?.professionalTitle}. {user?.displayName} | {user?.specialty}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Duración: {formatDuration(0)}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Pestañas de navegación */}
        <div className="flex space-x-2 mb-6">
          <button 
            onClick={() => setActiveSection(1)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeSection === 1 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Anamnesis Clínica
          </button>
          <button 
            onClick={() => setActiveSection(2)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeSection === 2 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Evaluación Física
          </button>
          <button 
            onClick={() => setActiveSection(3)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeSection === 3 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Resumen Clínico
          </button>
        </div>

        {/* === 2. BANNER PACIENTE COMPACTO === */}
        <div className="bg-blue-50 p-4 rounded-xl mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">María González</h2>
          <div className="flex space-x-4 text-sm text-gray-600 mb-3">
            <span>45 años</span>
            <span>Dolor cervical irradiado</span>
            <span>Última visita: 15 Ene 2025</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-700">
            <div><strong>Tratamiento:</strong> Ejercicios cervicales, tecarterapia</div>
            <div><strong>Medicamentos:</strong> Ibuprofeno 400mg cada 8h</div>
            <div><strong>Alergias:</strong> Penicilina</div>
            <div><strong>Alertas previas:</strong> Hipertensión controlada</div>
          </div>
        </div>

        {/* === 3. GRABACIÓN PROMINENTE === */}
        <div className="bg-white p-4 rounded-xl mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={toggleRecording}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isRecording 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isRecording ? 'Finalizar Análisis' : 'Iniciar Grabación'}
              </button>
              <span className="text-lg font-mono">{recordingTime}</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'animate-pulse bg-red-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-600">{isRecording ? 'Grabando...' : 'Listo para grabar'}</span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cámara
              </button>
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Subir
              </button>
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Bluetooth
              </button>
            </div>
          </div>
        </div>

        {/* === 4. LAYOUT 50%-50% === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* IZQUIERDA - Transcripción */}
          <div className="bg-white p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Transcripción en Tiempo Real</h3>
            <div className="min-h-[400px] bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {transcriptionText || 'Presiona "Iniciar Grabación" para comenzar'}
              </p>
            </div>
          </div>
          
          {/* DERECHA - Alertas y Highlights */}
          <div className="space-y-4">
            {/* Alertas Críticas */}
            <div className="bg-white p-4 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Alertas Críticas</h3>
              <div className="space-y-2">
                {alertasPersistentes.map(alerta => (
                  <div key={alerta.id} className="border-l-4 border-red-500 bg-red-50 p-3 rounded">
                    <p className="font-medium text-red-800">{alerta.mensaje}</p>
                    <p className="text-red-600 text-sm mt-1">{alerta.sugerencia}</p>
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={() => confirmarAlerta(alerta.id)}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                      >
                        ✓ Confirmar
                      </button>
                      <button 
                        onClick={() => descartarAlerta(alerta.id)}
                        className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                      >
                        ✗ Descartar
                      </button>
                      <button 
                        onClick={() => guardarMetrica(alerta.id)}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        💾 Guardar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Highlights Automáticos */}
            <div className="bg-white p-4 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Highlights Automáticos</h3>
              <div className="space-y-2">
                {uniqueHighlights.map(highlight => (
                  <div key={highlight.id} className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      onChange={() => toggleHighlight(highlight.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{highlight.contenido}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 