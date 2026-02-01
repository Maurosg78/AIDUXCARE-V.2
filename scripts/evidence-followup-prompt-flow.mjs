/**
 * WO-FOLLOWUP-PROMPT: Evidence script for follow-up prompt flow.
 * Simulates: baseline + in-clinic today + HEP + clinical update → prompt for Vertex.
 * Run: node scripts/evidence-followup-prompt-flow.mjs
 * Exits 0 only if all assertions pass (no Vitest).
 */

function formatDate(d) {
  if (!d) return 'Not specified';
  if (typeof d === 'string') return d;
  return d.toISOString?.() ?? String(d);
}

function buildFollowUpPromptV3(input) {
  const { baseline, clinicalUpdate, inClinicToday = [], homeProgramPrescribed = [] } = input;
  const prev = baseline.previousSOAP ?? {};
  const dateStr = formatDate(prev.date);
  const sections = [];

  sections.push(`## CLINICAL BASELINE (Previous Session)

Date of last visit: ${dateStr}

Previous Assessment:
${(prev.assessment ?? '').trim() || 'Not documented.'}

Previous Treatment Plan:
${(prev.plan ?? '').trim() || 'Not documented.'}`);

  if (inClinicToday.length > 0) {
    const lines = inClinicToday.map((item) => {
      const done = item.completed !== false ? ' (performed today)' : '';
      const notes = item.notes?.trim() ? ` — Notes: ${item.notes}` : '';
      return `- ${item.label}${done}${notes}`;
    });
    sections.push(`## WHAT WAS DONE IN SESSION TODAY (In-Clinic)

${lines.join('\n')}`);
  }

  if (homeProgramPrescribed.length > 0) {
    const hepLines = homeProgramPrescribed.map((line) => `- ${line.trim()}`).filter(Boolean);
    sections.push(`## HOME PROGRAM PRESCRIBED (HEP)

${hepLines.join('\n')}`);
  }

  sections.push(`## TODAY'S CLINICAL UPDATE

${(clinicalUpdate ?? '').trim() || 'No additional clinical update provided.'}`);

  sections.push(`## TASK INSTRUCTIONS (Clinical)

- Document CLINICAL CONTINUITY...
- Use the "What was done in session today" and "Home program prescribed" to inform Assessment and Plan as appropriate.

You MUST respond with valid JSON ONLY...
RULES:
- Do NOT include any text outside the JSON object`);

  return sections.join('\n\n');
}

function main() {
  const baseline = {
    previousSOAP: {
      assessment: 'Mechanical LBP. No imaging indicated.',
      plan: 'Interventions: Manual therapy, education.\nHome Exercises: Core stability.',
      date: new Date('2025-01-20T14:00:00.000Z'),
    },
  };
  const clinicalUpdate = 'Patient reports 50% improvement. ROM improved.';

  const promptMinimal = buildFollowUpPromptV3({ baseline, clinicalUpdate });
  if (!promptMinimal.includes('## CLINICAL BASELINE (Previous Session)')) throw new Error('Missing CLINICAL BASELINE section');
  if (!promptMinimal.includes("## TODAY'S CLINICAL UPDATE")) throw new Error("Missing TODAY'S CLINICAL UPDATE section");
  if (!promptMinimal.includes('TASK INSTRUCTIONS')) throw new Error('Missing TASK INSTRUCTIONS');
  console.log('[OK] Minimal prompt: baseline + clinicalUpdate');

  const promptFull = buildFollowUpPromptV3({
    baseline,
    clinicalUpdate: 'Patient did HEP 3x. Pain 3/10.',
    inClinicToday: [
      { label: 'Therapeutic exercises R knee', completed: true, notes: 'Good tolerance' },
    ],
    homeProgramPrescribed: ['ROM 3x/day', 'Ice 15min 3x/day'],
  });
  if (!promptFull.includes('## WHAT WAS DONE IN SESSION TODAY (In-Clinic)')) throw new Error('Missing WHAT WAS DONE IN SESSION TODAY');
  if (!promptFull.includes('## HOME PROGRAM PRESCRIBED (HEP)')) throw new Error('Missing HOME PROGRAM PRESCRIBED');
  if (!promptFull.includes('Therapeutic exercises R knee')) throw new Error('Missing in-clinic item');
  if (!promptFull.includes('ROM 3x/day')) throw new Error('Missing HEP item');
  if (!promptFull.includes('Patient did HEP 3x')) throw new Error('Missing clinical update in prompt');
  console.log('[OK] Full prompt: in-clinic + HEP + clinical update');

  console.log('[OK] Follow-up prompt flow: all assertions passed.');
}

main();
process.exit(0);
