const fs = require('fs');
const file = 'src/orchestration/prompts/schema-constrained-prompt.ts';

const simplePrompt = `/**
 * Simple Consistent Clinical Extraction Prompt
 * Ensures consistent output structure
 */

export const generateSchemaConstrainedPrompt = (transcript: string): string => {
  return \`
Extract clinical information from this transcript and return ONLY valid JSON with this EXACT structure:

{
  "chief_complaint": "main symptom or complaint as string",
  "physical_findings": ["finding 1", "finding 2"],
  "medications": [{"name": "med name", "reason": "why"}],
  "social_context": ["social factor 1", "social factor 2"],
  "red_flags": ["critical issue 1", "critical issue 2"],
  "suggested_tests": [{"test": "test name", "reason": "why needed"}]
}

RULES:
- Return ONLY the JSON, no extra text
- Use empty arrays [] if no data found
- Keep field names EXACTLY as shown
- All strings in English

TRANSCRIPT:
\${transcript}
\`;
};

export const PROMPT_VERSION = "3.0.0-simplified";`;

fs.writeFileSync(file, simplePrompt);
console.log('✅ Simplified prompt for consistent structure');
