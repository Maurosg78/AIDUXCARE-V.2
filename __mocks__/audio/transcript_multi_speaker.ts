/**
 * Mock de transcripción con múltiples oradores para testing
 * Contiene una conversación completa entre profesional, paciente y acompañante
 * con diferentes niveles de confianza
 */
import { TranscriptionSegment } from './transcript_with_errors';
import { v4 as uuidv4 } from 'uuid';

// Función para obtener timestamp consistente en tests
const getTestTimestamp = (index: number): string => {
  const baseDate = new Date('2023-10-15T10:00:00Z');
  baseDate.setSeconds(baseDate.getSeconds() + (index * 10));
  return baseDate.toISOString();
};

export const MOCK_MULTI_SPEAKER_TRANSCRIPT: TranscriptionSegment[] = [
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(0),
    actor: 'profesional',
    content: 'Buenos días, soy el Dr. Martínez. ¿Cómo se encuentra hoy?',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(1),
    actor: 'paciente',
    content: 'Buenos días doctor. Vengo por el dolor en la rodilla derecha que llevo sintiendo varias semanas.',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(2),
    actor: 'profesional',
    content: '¿Puede describirme cómo es ese dolor? ¿Es constante o aparece con ciertos movimientos?',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(3),
    actor: 'paciente',
    content: 'Es más fuerte cuando subo escaleras o me levanto después de estar sentado mucho tiempo.',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(4),
    actor: 'acompañante',
    content: 'También le duele por las noches. A veces se despierta por el dolor y tiene que tomar analgésicos.',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(5),
    actor: 'profesional',
    content: '¿Ha notado inflamación en la rodilla? ¿O algún sonido al mover la articulación?',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(6),
    actor: 'paciente',
    content: 'Sí, a veces se me hincha, sobre todo al final del día. Y siento como si crujiera cuando la doblo.',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(7),
    actor: 'profesional',
    content: 'Vamos a examinar la rodilla y solicitar algunas pruebas diagnósticas para determinar la causa exacta.',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(8),
    actor: 'acompañante',
    content: 'Doctor, ¿cree que podría necesitar fisioterapia? Ya tuvo problemas similares hace unos años.',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(9),
    actor: 'profesional',
    content: 'Es posible. Después de ver los resultados, evaluaremos si necesita fisioterapia o si hay que considerar otras opciones de tratamiento.',
    confidence: 'entendido'
  }
]; 