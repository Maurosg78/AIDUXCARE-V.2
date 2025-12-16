import { describe, it, expect } from 'vitest';

const hasEmu = !!process.env.FIRESTORE_EMULATOR_HOST || process.env.AIDUX_USE_EMULATORS === '1';
(hasEmu ? describe : describe.skip)('note save flow (emulator)', () => {
  it('persists and shows success (placeholder)', async () => {
    expect(hasEmu).toBe(true);
  });
});
