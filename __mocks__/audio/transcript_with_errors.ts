/**
 * Mock de transcripción con errores y diferentes niveles de confianza para testing
 * Contiene segmentos marcados como "poco_claro" y "no_reconocido"
 */
import { v4 as uuidv4 } from 'uuid';

// Definimos la interfaz localmente para evitar problemas con las rutas de importación
export interface TranscriptionSegment {
  id: string;
  timestamp: string;
  actor: 'profesional' | 'paciente' | 'acompañante';
  content: string;
  confidence: 'entendido' | 'poco_claro' | 'no_reconocido';
  approved?: boolean;
  edited?: boolean;
}

// Función para obtener timestamp consistente en tests
const getTestTimestamp = (index: number): string => {
  const baseDate = new Date('2023-10-15T10:00:00Z');
  baseDate.setSeconds(baseDate.getSeconds() + (index * 10));
  return baseDate.toISOString();
};

export const MOCK_ERROR_TRANSCRIPT: TranscriptionSegment[] = [
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(0),
    actor: 'profesional',
    content: 'Buenos días, vamos a revisar sus resultados de laboratorio.',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(1),
    actor: 'paciente',
    content: 'Gracias doctor. Estaba preocupado por... (inaudible)',
    confidence: 'poco_claro'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(2),
    actor: 'profesional',
    content: 'He notado que sus niveles de glucosa están un poco elevados. ¿Ha modificado su dieta recientemente?',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(3),
    actor: 'paciente',
    content: '(ruido de fondo) ...sido difícil mantener... durante las fiestas...',
    confidence: 'poco_claro'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(4),
    actor: 'acompañante',
    content: '(inaudible) ...',
    confidence: 'no_reconocido'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(5),
    actor: 'profesional',
    content: 'Entiendo. Vamos a ajustar su medicación y establecer un plan de seguimiento más riguroso.',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(6),
    actor: 'paciente',
    content: 'Doctor, también quería preguntarle sobre estos dolores de cabeza que...',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(7),
    actor: 'profesional',
    content: '...frecuencia... intensidad...',
    confidence: 'no_reconocido'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(8),
    actor: 'paciente',
    content: 'Casi todos los días, especialmente por la tarde.',
    confidence: 'entendido'
  },
  {
    id: uuidv4(),
    timestamp: getTestTimestamp(9),
    actor: 'acompañante',
    content: 'Y ha estado tomando analgésicos sin receta, pero no le hacen mucho efecto.',
    confidence: 'poco_claro'
  }
]; 