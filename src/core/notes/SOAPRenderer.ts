import { SOAPNote } from './SOAPTypes';
import { SOAP_HEADINGS } from '../../shared/config/locale';

export function renderMarkdown(note: SOAPNote): string {
  const lines: string[] = [];
  
  lines.push(`# ${SOAP_HEADINGS.en.subjective}`);
  lines.push(...note.sections.subjective.map(t => `- ${t}`));
  
  lines.push(`\n# ${SOAP_HEADINGS.en.objective}`);
  lines.push(...note.sections.objective.map(t => `- ${t}`));
  
  lines.push(`\n# ${SOAP_HEADINGS.en.assessment}`);
  lines.push(...note.sections.assessment.map(t => `- ${t}`));
  
  lines.push(`\n# ${SOAP_HEADINGS.en.plan}`);
  lines.push(...note.sections.plan.map(t => `- ${t}`));
  
  return lines.join('\n');
}
