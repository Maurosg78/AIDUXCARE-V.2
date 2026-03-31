import { STRIP_PAIN_SCALE_ID, stripPainScaleTranscript } from './stripPainScale';
import { CONFLICTING_SYMPTOMS_ID, conflictingSymptomsTranscript } from './conflictingSymptoms';

export { STRIP_PAIN_SCALE_ID, CONFLICTING_SYMPTOMS_ID };

export function applyMutatorById(id: string, transcript: string): string {
  if (id === STRIP_PAIN_SCALE_ID) return stripPainScaleTranscript(transcript);
  if (id === CONFLICTING_SYMPTOMS_ID) return conflictingSymptomsTranscript(transcript);
  return transcript;
}

export function listMutatorIds(): string[] {
  return [STRIP_PAIN_SCALE_ID, CONFLICTING_SYMPTOMS_ID];
}
