import { describe, expect, it } from 'vitest';

import { findViolationsForFile } from '../../scripts/check-direct-writes-outside-facade.mjs';

describe('write facade gate', () => {
  it('accepts writes inside an allowlisted facade file', () => {
    const diff = [
      'diff --git a/src/services/PersistenceService.ts b/src/services/PersistenceService.ts',
      '@@ -10,0 +11,1 @@',
      '+await setDoc(docRef, payload);',
    ].join('\n');

    const violations = findViolationsForFile(
      'src/services/PersistenceService.ts',
      diff,
      new Set(['src/services/PersistenceService.ts'])
    );

    expect(violations).toEqual([]);
  });

  it('blocks direct writes added outside the facade', () => {
    const diff = [
      'diff --git a/src/pages/NotesPage.tsx b/src/pages/NotesPage.tsx',
      '@@ -44,0 +45,2 @@',
      '+const result = await supabase.from(\'notes\')',
      '+  .insert(payload);',
    ].join('\n');

    const violations = findViolationsForFile(
      'src/pages/NotesPage.tsx',
      diff,
      new Set(['src/services/PersistenceService.ts'])
    );

    expect(violations).toEqual([
      {
        file: 'src/pages/NotesPage.tsx',
        line: 46,
        content: '.insert(payload);',
      },
    ]);
  });
});
