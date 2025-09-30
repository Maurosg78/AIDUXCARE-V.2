export interface SOAPSections {
  subjective: string[];
  objective: string[];
  assessment: string[];
  plan: string[];
}

export interface SOAPNote {
  sections: SOAPSections;
  locale: 'en-CA';
}
