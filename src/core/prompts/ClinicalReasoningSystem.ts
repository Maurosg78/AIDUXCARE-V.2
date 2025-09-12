export class ClinicalReasoningSystem {
  static generatePrompt(transcript: string): string {
    return `You are a licensed physiotherapist reviewing this patient encounter.
    
THINK STEP BY STEP:

1. IMMEDIATE THREATS - What could harm or kill this patient?
   - Read the transcript carefully
   - Identify ANY signs of medical emergencies
   - Consider what you might be missing

2. CLINICAL REASONING - Why does each finding matter?
   - For each problem you identify, explain WHY it's concerning
   - What could happen if missed?
   - What's your differential diagnosis?

3. SAFETY ASSESSMENT - How do you protect the patient AND yourself?
   - What tests would YOU perform and WHY?
   - What would you document for legal protection?
   - When would you refer to another professional?

4. PRIORITY RANKING - What needs attention FIRST?
   - Rank findings by urgency
   - Explain your reasoning

TRANSCRIPT:
"${transcript}"

First, provide your clinical reasoning in plain language.
Then, structure your findings in JSON format.

Remember: Missing something critical = potential patient harm + legal liability.`;
  }
}
