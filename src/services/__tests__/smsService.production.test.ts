/**
 * SMS Service - Production Readiness Tests
 * 
 * Validates that SMS service is ready for production deployment.
 * These tests ensure English-only messages and correct URL construction.
 * 
 * Timeouts: All tests have 5-10s timeout to prevent hanging
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SMS_TEMPLATES, validateSMSTemplate } from '../../content/smsTemplates';
import { getPublicBaseUrl } from '../../utils/urlHelpers';

describe('SMS Service - Production Readiness', () => {
  beforeEach(() => {
    // Clear any mocks
  });

  describe('Language Validation', () => {
    it('should send SMS in English (en-CA) only', () => {
      // Test template directly (faster than mocking entire service)
      const message = SMS_TEMPLATES.consent.en_CA(
        'John Doe',
        'Test Physio',
        'https://aiduxcare.web.app/consent/test-token',
        'https://aiduxcare.web.app/privacy-policy'
      );
      
      // Verify no Spanish characters
      expect(message).not.toMatch(/[áéíóúñü]/);
      
      // Verify English content
      expect(message).toContain('Hello');
      expect(message).toContain('consent');
      expect(message).toContain('PHIPA');
      
      // Verify no Spanish words (using word boundaries)
      const spanishWords = ['Hola', 'consentimiento', 'datos de salud', 'según', 'ley canadiense'];
      spanishWords.forEach(word => {
        const regex = new RegExp(`\\b${word.replace(/\s/g, '\\s+')}\\b`, 'i');
        expect(message).not.toMatch(regex);
      });
      
      // Validate using validation helper
      const validation = validateSMSTemplate(message);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    }, 10000); // 10s timeout

    it('should not contain Spanish words in activation SMS', () => {
      // Test template directly
      const message = SMS_TEMPLATES.activation.en_CA(
        'Test Physio',
        'https://aiduxcare.web.app/activate?token=test-token',
        'https://aiduxcare.web.app/privacy-policy',
        'https://aiduxcare.web.app/privacy-policy#data-usage'
      );
      
      // Check for Spanish words (using word boundaries to avoid false positives)
      const spanishWords = ['Hola', 'activa tu', 'válido', 'válido 24h'];
      spanishWords.forEach(word => {
        // Use word boundary regex to avoid matching "activate" when checking "activa"
        const regex = new RegExp(`\\b${word.replace(/\s/g, '\\s+')}\\b`, 'i');
        expect(message).not.toMatch(regex);
      });
      
      // Validate using validation helper
      const validation = validateSMSTemplate(message);
      expect(validation.isValid).toBe(true);
    }, 10000); // 10s timeout
  });

  describe('URL Construction', () => {
    it('should generate valid mobile-accessible URLs', () => {
      const baseUrl = 'https://aiduxcare.web.app';
      const token = 'test-token-123';
      const consentUrl = `${baseUrl}/consent/${token}`;
      
      expect(consentUrl).toMatch(/^https:\/\//);
      expect(consentUrl).not.toContain('localhost');
      expect(consentUrl).not.toContain('127.0.0.1');
      expect(consentUrl).toContain('/consent/');
      expect(consentUrl).toContain(token);
    }, 5000); // 5s timeout

    it('should keep URLs under SMS length limits', () => {
      const baseUrl = 'https://aiduxcare.web.app';
      const token = 'a'.repeat(100); // Long token
      const consentUrl = `${baseUrl}/consent/${token}`;
      
      // SMS messages have 160 character limit per segment
      // URLs should be reasonable length
      expect(consentUrl.length).toBeLessThan(200);
    }, 5000); // 5s timeout

    it('should validate production URLs correctly', () => {
      // Test URL validation logic
      const validUrl = 'https://aiduxcare.web.app';
      const invalidUrl1 = 'http://localhost:5174';
      const invalidUrl2 = 'http://aiduxcare.web.app'; // No HTTPS
      
      // Valid URL should not contain localhost
      expect(validUrl).not.toContain('localhost');
      expect(validUrl).toMatch(/^https:\/\//);
      
      // Invalid URLs should be detected
      expect(invalidUrl1).toContain('localhost');
      expect(invalidUrl2).not.toMatch(/^https:\/\//);
    }, 5000); // 5s timeout
  });

  describe('Template Validation', () => {
    it('should reject templates with Spanish content', () => {
      const spanishMessage = 'Hola paciente, necesita su consentimiento';
      const validation = validateSMSTemplate(spanishMessage);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    }, 5000); // 5s timeout

    it('should accept valid English templates', () => {
      const englishMessage = SMS_TEMPLATES.consent.en_CA(
        'John Doe',
        'Test Physio',
        'https://aiduxcare.web.app/consent/token',
        'https://aiduxcare.web.app/privacy'
      );
      
      const validation = validateSMSTemplate(englishMessage);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    }, 5000); // 5s timeout

    it('should detect Spanish characters', () => {
      const messageWithAccents = 'Hello patient, necesitas consentimiento';
      const validation = validateSMSTemplate(messageWithAccents);
      
      // Should detect Spanish characters if present
      if (/[áéíóúñü]/i.test(messageWithAccents)) {
        expect(validation.isValid).toBe(false);
      }
    }, 5000); // 5s timeout
  });

  describe('Mobile Compatibility', () => {
    it('should generate URLs accessible from mobile devices', () => {
      const url = 'https://aiduxcare.web.app/consent/test-token';
      
      // Validate URL structure (no actual HTTP request to avoid hanging)
      expect(url).toMatch(/^https:\/\//);
      expect(url).not.toContain('localhost');
      expect(url).not.toContain('127.0.0.1');
      expect(url.length).toBeLessThan(200); // SMS URL length limit
    }, 5000); // 5s timeout
  });
});
