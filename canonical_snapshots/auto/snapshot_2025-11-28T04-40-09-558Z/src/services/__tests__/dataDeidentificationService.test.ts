/**
 * Unit Tests for DataDeidentificationService
 * 
 * Tests deidentification, reidentification, validation, and audit logging
 */

import { 
  deidentify, 
  reidentify, 
  validateDeidentification,
  type DeidentificationResult,
  type IdentifierMap 
} from '../dataDeidentificationService';

describe('DataDeidentificationService', () => {
  describe('deidentify', () => {
    it('should remove patient names', () => {
      const text = 'Patient John Smith presents with lower back pain.';
      const result = deidentify(text);
      
      expect(result.deidentifiedText).toContain('[NAME_');
      expect(result.deidentifiedText).not.toContain('John Smith');
      expect(result.removedCount).toBeGreaterThan(0);
      expect(Object.keys(result.identifiersMap).length).toBeGreaterThan(0);
    });

    it('should remove phone numbers', () => {
      const text = 'Contact patient at 416-555-1234 or (416) 555-5678.';
      const result = deidentify(text);
      
      expect(result.deidentifiedText).toContain('[PHONE_');
      expect(result.deidentifiedText).not.toContain('416-555-1234');
      expect(result.deidentifiedText).not.toContain('(416) 555-5678');
      expect(result.removedCount).toBeGreaterThanOrEqual(2);
    });

    it('should remove postal codes', () => {
      const text = 'Patient lives at postal code M5H 2N2.';
      const result = deidentify(text);
      
      expect(result.deidentifiedText).toContain('[POSTALCODE_');
      expect(result.deidentifiedText).not.toContain('M5H 2N2');
      expect(result.removedCount).toBeGreaterThan(0);
    });

    it('should remove email addresses', () => {
      const text = 'Contact patient at john.doe@example.com.';
      const result = deidentify(text);
      
      expect(result.deidentifiedText).toContain('[EMAIL_');
      expect(result.deidentifiedText).not.toContain('john.doe@example.com');
      expect(result.removedCount).toBeGreaterThan(0);
    });

    it('should remove health card numbers', () => {
      const text = 'Health card number: 1234-567-890-AB';
      const result = deidentify(text);
      
      expect(result.deidentifiedText).toContain('[HEALTHCARD_');
      expect(result.deidentifiedText).not.toContain('1234-567-890-AB');
      expect(result.removedCount).toBeGreaterThan(0);
    });

    it('should handle multiple identifiers', () => {
      const text = 'Patient Jane Doe, phone 416-555-1234, postal code M5H 2N2, email jane@example.com';
      const result = deidentify(text);
      
      expect(result.removedCount).toBeGreaterThanOrEqual(4);
      expect(result.deidentifiedText).toContain('[NAME_');
      expect(result.deidentifiedText).toContain('[PHONE_');
      expect(result.deidentifiedText).toContain('[POSTALCODE_');
      expect(result.deidentifiedText).toContain('[EMAIL_');
    });

    it('should handle empty text', () => {
      const result = deidentify('');
      
      expect(result.deidentifiedText).toBe('');
      expect(result.removedCount).toBe(0);
      expect(Object.keys(result.identifiersMap).length).toBe(0);
    });

    it('should handle text without identifiers', () => {
      const text = 'Patient presents with lower back pain. No other concerns.';
      const result = deidentify(text);
      
      expect(result.deidentifiedText).toBe(text);
      expect(result.removedCount).toBe(0);
    });

    it('should preserve clinical context', () => {
      const text = 'Patient John Smith presents with lower back pain. ROM limited in flexion.';
      const result = deidentify(text);
      
      // Clinical terms should remain
      expect(result.deidentifiedText).toContain('lower back pain');
      expect(result.deidentifiedText).toContain('ROM');
      expect(result.deidentifiedText).toContain('flexion');
      // Name should be removed
      expect(result.deidentifiedText).not.toContain('John Smith');
    });
  });

  describe('reidentify', () => {
    it('should restore identifiers from placeholders', () => {
      const deidentifiedText = 'Patient [NAME_1] presents with lower back pain.';
      const identifiersMap: IdentifierMap = {
        '[NAME_1]': 'John Smith'
      };
      
      const result = reidentify(deidentifiedText, identifiersMap);
      
      expect(result).toContain('John Smith');
      expect(result).not.toContain('[NAME_1]');
    });

    it('should restore multiple identifiers', () => {
      const deidentifiedText = 'Patient [NAME_1], phone [PHONE_1], postal code [POSTALCODE_1]';
      const identifiersMap: IdentifierMap = {
        '[NAME_1]': 'Jane Doe',
        '[PHONE_1]': '416-555-1234',
        '[POSTALCODE_1]': 'M5H 2N2'
      };
      
      const result = reidentify(deidentifiedText, identifiersMap);
      
      expect(result).toContain('Jane Doe');
      expect(result).toContain('416-555-1234');
      expect(result).toContain('M5H 2N2');
      expect(result).not.toContain('[NAME_');
      expect(result).not.toContain('[PHONE_');
      expect(result).not.toContain('[POSTALCODE_');
    });

    it('should handle empty mapping', () => {
      const text = 'Patient [NAME_1] presents with pain.';
      const identifiersMap: IdentifierMap = {};
      
      const result = reidentify(text, identifiersMap);
      
      expect(result).toBe(text); // Should remain unchanged
    });

    it('should handle text without placeholders', () => {
      const text = 'Patient presents with lower back pain.';
      const identifiersMap: IdentifierMap = {
        '[NAME_1]': 'John Smith'
      };
      
      const result = reidentify(text, identifiersMap);
      
      expect(result).toBe(text); // Should remain unchanged
    });

    it('should handle round-trip deidentification/reidentification', () => {
      const originalText = 'Patient John Smith, phone 416-555-1234, presents with lower back pain.';
      const deidentified = deidentify(originalText);
      const reidentified = reidentify(deidentified.deidentifiedText, deidentified.identifiersMap);
      
      // Should restore original identifiers
      expect(reidentified).toContain('John Smith');
      expect(reidentified).toContain('416-555-1234');
      // Clinical context should be preserved
      expect(reidentified).toContain('lower back pain');
    });
  });

  describe('validateDeidentification', () => {
    it('should detect remaining identifiers', () => {
      const text = 'Patient John Smith presents with pain.';
      const remaining = validateDeidentification(text);
      
      expect(remaining.length).toBeGreaterThan(0);
      expect(remaining.some(id => id.includes('John'))).toBeTruthy();
    });

    it('should not flag placeholders as identifiers', () => {
      const text = 'Patient [NAME_1] presents with pain.';
      const remaining = validateDeidentification(text);
      
      // Placeholders should not be flagged
      expect(remaining.every(id => !id.startsWith('['))).toBeTruthy();
    });

    it('should return empty array for properly deidentified text', () => {
      const text = 'Patient [NAME_1] presents with lower back pain. No identifiers remain.';
      const remaining = validateDeidentification(text);
      
      // Should not flag placeholders or clinical terms
      expect(remaining.length).toBe(0);
    });

    it('should detect multiple remaining identifiers', () => {
      const text = 'Patient John Smith, phone 416-555-1234, email john@example.com';
      const remaining = validateDeidentification(text);
      
      expect(remaining.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined input', () => {
      const result1 = deidentify(null as any);
      const result2 = deidentify(undefined as any);
      
      expect(result1.deidentifiedText).toBe('');
      expect(result2.deidentifiedText).toBe('');
      expect(result1.removedCount).toBe(0);
      expect(result2.removedCount).toBe(0);
    });

    it('should handle very long text', () => {
      const longText = 'Patient John Smith. '.repeat(1000);
      const result = deidentify(longText);
      
      expect(result.deidentifiedText.length).toBeGreaterThan(0);
      expect(result.removedCount).toBeGreaterThan(0);
    });

    it('should handle special characters in identifiers', () => {
      const text = 'Email: test+user@example.com, Phone: (416) 555-1234';
      const result = deidentify(text);
      
      expect(result.removedCount).toBeGreaterThan(0);
      expect(result.deidentifiedText).toContain('[EMAIL_');
      expect(result.deidentifiedText).toContain('[PHONE_');
    });
  });
});

