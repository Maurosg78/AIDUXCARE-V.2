import { SOAPNote, SOAPSections } from './SOAPTypes';

export interface ChecklistSignal {
  speaker: 'clinician' | 'patient' | 'other';
  text: string;
  tag?: 'symptom' | 'finding' | 'test' | 'diagnosis' | 'intervention' | 'plan' | 'other';
}

export class SOAPBuilder {
  static fromChecklist(items: ChecklistSignal[]): SOAPNote {
    const s: SOAPSections = {
      subjective: [],
      objective: [],
      assessment: [],
      plan: [],
    };

    for (const it of items) {
      switch (it.tag) {
        case 'symptom':
          s.subjective.push(it.text);
          break;
        case 'finding':
        case 'test':
          s.objective.push(it.text);
          break;
        case 'diagnosis':
          s.assessment.push(it.text);
          break;
        case 'intervention':
        case 'plan':
          s.plan.push(it.text);
          break;
        default:
          s.subjective.push(it.text);
      }
    }

    return { sections: s, locale: 'en-CA' };
  }
}
