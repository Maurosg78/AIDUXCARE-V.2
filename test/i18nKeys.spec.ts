import { describe, it, expect } from 'vitest';
import en from '../src/locales/en.json';
import es from '../src/locales/es.json';

function flattenKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  Object.entries(obj || {}).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  });
  return keys;
}

describe('i18n clinical namespace integrity', () => {
  it('clinical.* keys should be aligned between en and es', () => {
    const enClinical = (en as any).clinical || {};
    const esClinical = (es as any).clinical || {};

    const enKeys = flattenKeys(enClinical).sort();
    const esKeys = flattenKeys(esClinical).sort();

    expect(enKeys).toEqual(esKeys);
  });
});

