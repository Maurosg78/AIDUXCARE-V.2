import { describe, it, expect } from 'vitest';
import { isFirebaseEnabled } from '@/lib/isFirebaseEnabled';

describe("firebase alias", () => {
  it("por defecto usa stub", () => {
    expect(isFirebaseEnabled()).toBe(false);
  });
});
