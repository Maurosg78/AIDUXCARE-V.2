export class PromptVersions {
  static getPrompt(version: string, transcript: string, lang: 'en' | 'es') {
    if (lang === 'en') {
      return `Extract clinical information following physiotherapy scope.

STRICT CATEGORIZATION:
- redFlags: ONLY conditions requiring immediate medical referral (per Cochrane/NICE guidelines)
- entities: medications (normalized) and chief complaints ONLY
- yellowFlags: ONLY psychosocial risk factors (per STarT Back Tool)
- physicalTests: MUST include relevant tests with evidence base

MANDATORY:
1. If "doesn't see the point" appears → redFlag: "Suicidal ideation - immediate mental health referral needed"
2. Include AT LEAST 3 relevant physical tests
3. NO repetition between sections
4. Medications: use generic names ONLY

TRANSCRIPT: "${transcript}"

Return structured JSON:
{
  "redFlags": ["condition (source: guideline)"],
  "entities": [
    {"type":"medication","name":"generic name","indication":"condition"},
    {"type":"symptom","name":"chief complaint","duration":"timeframe","severity":"mild/moderate/severe"}
  ],
  "yellowFlags": ["psychosocial factor only"],
  "physicalTests": [
    {"name":"test name","sensitivity":0.XX,"specificity":0.XX,"indication":"why relevant"}
  ]
}`;
    }
    return `[Spanish version]`;
  }
}
