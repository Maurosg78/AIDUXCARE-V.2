import { describe, it, expect, beforeEach } from 'vitest';
import { MedicalChunkingSystem } from '../MedicalChunkingSystem';

describe('MedicalChunkingSystem', () => {
  let chunker: MedicalChunkingSystem;
  
  beforeEach(() => {
    chunker = new MedicalChunkingSystem();
  });

  describe('Casos básicos', () => {
    it('No debe chunkear textos cortos (<2500 tokens)', () => {
      const shortText = 'Patient reports lower back pain for 3 days.';
      const result = chunker.processTranscript(shortText);
      
      expect(result.requiresChunking).toBe(false);
      expect(result.chunks.length).toBe(1);
      expect(result.chunks[0].hasOverlap).toBe(false);
    });

    it('Debe chunkear textos largos (>2500 tokens)', () => {
      // ~3000 tokens de texto médico
      const longText = Array(600).fill('Patient reports chronic pain medication history').join(' ');
      const result = chunker.processTranscript(longText);
      
      expect(result.requiresChunking).toBe(true);
      expect(result.chunks.length).toBeGreaterThan(1);
    });
  });

  describe('Preservación de contexto crítico', () => {
    it('NUNCA debe separar negaciones médicas', () => {
      const criticalText = `
        El paciente reporta dolor severo en el pecho.
        No tiene antecedentes cardíacos.
        Sin dolor al respirar.
        Niega ideación suicida.
      `.repeat(100);
      
      const result = chunker.processTranscript(criticalText);
      
      result.chunks.forEach(chunk => {
        if (chunk.text.includes('No tiene')) {
          expect(chunk.text).toContain('antecedentes');
        }
        if (chunk.text.includes('Sin dolor')) {
          expect(chunk.text).toContain('respirar');
        }
        if (chunk.text.includes('Niega')) {
          expect(chunk.text).toContain('ideación suicida');
        }
      });
    });
  });

  describe('Performance', () => {
    it('Debe procesar 45 min de texto en <1 segundo', () => {
      const massiveText = Array(3000).fill('Patient clinical history finding').join(' ');
      
      const startTime = Date.now();
      const result = chunker.processTranscript(massiveText);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000);
      expect(result.chunks.length).toBeGreaterThan(0);
    });
  });
});
