import logger from '@/shared/utils/logger';
declare function requestMicrophonePermission(): Promise<MediaStream>;
type SpeechCtor = new () => ISpeechRecognition;

interface ISpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous?: boolean;
  onresult: (e: SpeechRecognitionEvent) => void;
  onerror: (e: SpeechRecognitionErrorEvent) => void;
  start(): void;
  stop(): void;
  abort(): void;
}

export function initializeRecognition(): ISpeechRecognition {
  const w = window as Window & {
    webkitSpeechRecognition?: SpeechCtor;
    SpeechRecognition?: SpeechCtor;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) {
    throw new Error('Speech recognition not supported');
  }
  const rec = new Ctor();
  rec.interimResults = true;
  return rec;
}
import React, {} from 'react';

// Tipos para Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface AudioSegment {
  id: string;
  content: string;
  confidence: number;
  isFinal: boolean;
  timestamp: Date;
  speaker?: 'patient' | 'professional';
}

interface EnhancedAudioCaptureProps {
  onTranscriptionComplete: (segments: AudioSegment[]) => void;
  onTranscriptionUpdate?: (segments: AudioSegment[]) => void;
  language?: 'es' | 'en';
  className?: string;
}

export const EnhancedAudioCapture: React.FC<EnhancedAudioCaptureProps> = ({
  onTranscriptionComplete,
  onTranscriptionUpdate,
  language = 'es',
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, _setIsSupported] = useState(true);
  const [permissionStatus, _setPermissionStatus] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [recordingTime, setRecordingTime] = useState(0);
  const [segments, setSegments] = useState<AudioSegment[]>([]);
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef<unknown>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Verificar soporte del navegador
  useEffect(() => {
  if (!isSupported) return;
  // TODO: put your recognition setup & cleanup here
}, [isSupported, language, onTranscriptionUpdate]);

  // Detectar hablante basado en contenido
  const _detectSpeaker = (text: string): 'patient' | 'professional' => {
    const patientPatterns = [
      /me duele/i, /siento/i, /tengo/i, /padezco/i, /sufro/i,
      /no puedo/i, /me molesta/i, /me preocupa/i, /me siento/i
    ];
    
    const professionalPatterns = [
      /observo/i, /evalúo/i, /diagnóstico/i, /tratamiento/i,
      /recomiendo/i, /prescribo/i, /examino/i, /analizo/i
    ];

    const patientMatches = patientPatterns.filter(pattern => pattern.test(text)).length;
    const professionalMatches = professionalPatterns.filter(pattern => pattern.test(text)).length;

    return patientMatches > professionalMatches ? 'patient' : 'professional';
  };

  // Iniciar grabación
  const startRecording = async () => {
    if (isRecording) return;

    try {
      setError('');
      setSegments([]);
      setRecordingTime(0);

      // Solicitar permisos
      const stream = await requestMicrophonePermission();
      if (!stream) return;

      // Inicializar reconocimiento
      const recognition = initializeRecognition();
      if (!recognition) {
        setError('No se pudo inicializar el reconocimiento de voz');
        return;
      }

      recognitionRef.current = recognition;

      // Iniciar reconocimiento
      recognition.start();

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      logger.error('Error al iniciar grabación:', error);
      setError('Error al iniciar la grabación');
    }
  };

  // Detener grabación
  const stopRecording = () => {
    if (!isRecording) return;

    try {
      if (recognitionRef.current) {
        (recognitionRef.current as { stop(): void }).stop();
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsRecording(false);
      setIsProcessing(true);

      // Simular procesamiento final
      setTimeout(() => {
        const finalSegments = segments.filter(s => s.isFinal);
        onTranscriptionComplete(finalSegments);
        setIsProcessing(false);
      }, 1000);

    } catch (error) {
      logger.error('Error al detener grabación:', error);
      setError('Error al detener la grabación');
    }
  };

  // Formatear tiempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Limpiar transcripción
  const clearTranscription = () => {
    setSegments([]);
    setError('');
  };

  if (!isSupported) {
    return (
      <div className={`bg-white border rounded-lg p-6 text-center ${className}`} style={{ borderColor: '#BDC3C7' }}>
        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#E74C3C' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <h3 className="font-medium text-sm mb-2" style={{ color: '#2C3E50' }}>
          Navegador no compatible
        </h3>
          <p className="text-xs" style={{ color: '#BDC3C7' }}>
            Este navegador no soporta reconocimiento de voz.
          </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`} style={{ borderColor: '#BDC3C7' }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: '#BDC3C7' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <h3 className="font-medium text-sm" style={{ color: '#2C3E50' }}>
              Captura de Audio
            </h3>
          </div>
          <div className="text-sm font-mono" style={{ color: '#BDC3C7' }}>
            {formatTime(recordingTime)}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="p-4 border-b" style={{ borderColor: '#BDC3C7' }}>
        {permissionStatus === 'pending' && (
          <div className="text-center">
            <p className="text-sm mb-3" style={{ color: '#2C3E50' }}>
              Se requiere acceso al micrófono
            </p>
            <button
              onClick={requestMicrophonePermission}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              Permitir Micrófono
            </button>
          </div>
        )}

        {permissionStatus === 'denied' && (
          <div className="text-center">
            <p className="text-sm mb-3" style={{ color: '#E74C3C' }}>
              Acceso al micrófono denegado
            </p>
            <p className="text-xs" style={{ color: '#BDC3C7' }}>
              Por favor, habilita el micrófono en la configuración del navegador
            </p>
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-sm" style={{ color: '#E74C3C' }}>
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 border-b" style={{ borderColor: '#BDC3C7' }}>
        <div className="flex space-x-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={permissionStatus !== 'granted'}
              className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                </svg>
                <span>Iniciar Grabación</span>
              </div>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
                </svg>
                <span>Detener Grabación</span>
              </div>
            </button>
          )}

          {segments.length > 0 && (
            <button
              onClick={clearTranscription}
              className="px-4 py-3 border rounded-lg text-sm hover:bg-gray-50 transition-colors"
              style={{ borderColor: '#BDC3C7', color: '#2C3E50' }}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Transcription */}
      <div className="p-4">
        <h4 className="font-medium text-sm mb-3" style={{ color: '#2C3E50' }}>
          Transcripción en Tiempo Real
        </h4>
        
        {segments.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#BDC3C7' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
            </svg>
            <p className="text-sm" style={{ color: '#BDC3C7' }}>
              {isRecording ? 'Habla ahora...' : 'Inicia la grabación para comenzar'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {segments.map((segment) => (
              <div
                key={segment.id}
                className={`p-3 rounded-lg border ${
                  segment.isFinal ? 'bg-white' : 'bg-yellow-50'
                }`}
                style={{ borderColor: segment.isFinal ? '#BDC3C7' : '#F59E0B' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      segment.speaker === 'patient' ? 'bg-blue-400' : 'bg-green-400'
                    }`}></div>
                    <span className="text-xs font-medium" style={{ color: '#BDC3C7' }}>
                      {segment.speaker === 'patient' ? 'Paciente' : 'Profesional'}
                    </span>
                    {!segment.isFinal && (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        En progreso
                      </span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: '#BDC3C7' }}>
                    {segment.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm" style={{ color: '#2C3E50' }}>
                  {segment.content}
                </p>
                {segment.isFinal && (
                  <div className="mt-2 text-xs" style={{ color: '#BDC3C7' }}>
                    Confianza: {Math.round(segment.confidence * 100)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isProcessing && (
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm" style={{ color: '#2C3E50' }}>
                Procesando transcripción...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

}
export default EnhancedAudioCapture; 
