import { deIdentifyTranscript } from '../../src/utils/deIdentification';
import { describe, it, expect } from 'vitest';

describe('DeIdentification', () => {
  it('should redact identifiable data', () => {
    const text = 'John Doe was seen in Toronto on 05/10/2025';
    const output = deIdentifyTranscript(text);
    expect(output).toContain('[REDACTED_NAME]');
    expect(output).toContain('[REDACTED_LOCATION]');
    expect(output).toContain('[REDACTED_DATE]');
  });
});
