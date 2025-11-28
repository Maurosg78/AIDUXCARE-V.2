// @ts-nocheck
// @ts-nocheck
import protocols from '../protocols/msk-protocols.json';

interface ClinicalContext {
  region?: string;
  symptoms?: string[];
  duration?: string;
  redFlags?: string[];
  mechanism?: string;
}

export function selectTestsByProtocol(context: ClinicalContext): string[] {
  // Detectar región anatómica
  const region = detectRegion(context);
  if (!region) return [];
  
  // Detectar si es agudo o crónico
  const acuity = detectAcuity(context.duration);
  
  // Obtener protocolo base
  const protocol = ((protocols as any)[region] ?? {})[acuity] as { mandatory: string[]; conditional: Record<string, string[]> } | undefined;
  if (!protocol) return [];
  
  // Comenzar con tests mandatorios
  const selectedTests = [...protocol.mandatory];
  
  // Agregar tests condicionales según el contexto
  if (context.redFlags && context.redFlags.length > 0) {
    selectedTests.push(...(protocol.conditional.if_red_flag || []));
  }
  
  // Detectar si es radicular o mecánico
  const pattern = detectPattern(context.symptoms);
  if (pattern === 'radicular' && protocol.conditional.if_radicular) {
    selectedTests.push(...protocol.conditional.if_radicular);
  } else if (pattern === 'mechanical' && protocol.conditional.if_mechanical) {
    selectedTests.push(...protocol.conditional.if_mechanical);
  }
  
  return selectedTests;
}

function detectRegion(context: ClinicalContext): string {
  const text = JSON.stringify(context).toLowerCase();
  if (text.includes('lumbar') || text.includes('espalda baja')) return 'lumbar';
  if (text.includes('cervical') || text.includes('cuello')) return 'cervical';
  if (text.includes('hombro') || text.includes('shoulder')) return 'shoulder';
  return '';
}

function detectAcuity(duration?: string): 'acute' | 'chronic' {
  if (!duration) return 'acute';
  const days = extractDays(duration);
  return days > 30 ? 'chronic' : 'acute';
}

function extractDays(duration: string): number {
  const match = duration.match(/(\d+)/);
  if (!match) return 0;
  const num = parseInt(match[1]);
  if (duration.includes('mes') || duration.includes('month')) return num * 30;
  if (duration.includes('sem') || duration.includes('week')) return num * 7;
  return num;
}

function detectPattern(symptoms?: string[]): string {
  if (!symptoms) return 'mechanical';
  const symptomsText = symptoms.join(' ').toLowerCase();
  if (symptomsText.includes('irradia') || 
      symptomsText.includes('hormigueo') || 
      symptomsText.includes('entumecimiento')) {
    return 'radicular';
  }
  return 'mechanical';
}

export default selectTestsByProtocol;
