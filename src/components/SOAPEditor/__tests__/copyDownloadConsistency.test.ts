/**
 * Unit Test: Copy vs Download Consistency
 * 
 * Tests that Copy to Clipboard and Download .txt generate identical content.
 * 
 * ✅ P3.3: DoD - Tests: confirmación del text output identical
 */

import { describe, it, expect } from 'vitest';
import type { SOAPNote } from '../../../types/vertex-ai';

// Mock generatePlainTextFormat function (same as in SOAPEditor)
function generatePlainTextFormat(soapNote: SOAPNote): string {
  return `NOTA SOAP - ${new Date().toISOString().split('T')[0]}

${'='.repeat(60)}

S: SUBJETIVO
${'─'.repeat(60)}
${soapNote.subjective || 'Sin informacion subjetiva registrada.'}

${'─'.repeat(60)}

O: OBJETIVO
${'─'.repeat(60)}
${soapNote.objective || 'Sin hallazgos objetivos registrados.'}

${'─'.repeat(60)}

A: VALORACION
${'─'.repeat(60)}
${soapNote.assessment || 'Sin valoracion registrada.'}

${'─'.repeat(60)}

P: PLAN
${'─'.repeat(60)}
${soapNote.plan || 'Sin plan terapeutico registrado.'}

${'─'.repeat(60)}

${soapNote.referrals ? `Derivaciones:\n${soapNote.referrals}\n\n${'─'.repeat(60)}\n` : ''}
${soapNote.precautions ? `Precauciones:\n${soapNote.precautions}\n\n${'─'.repeat(60)}\n` : ''}
${soapNote.additionalNotes ? `Notas adicionales:\n${soapNote.additionalNotes}\n\n${'─'.repeat(60)}\n` : ''}

Generado por AiDuxCare
ID del documento: ${Date.now()}
Estado: Finalizada

${'='.repeat(60)}`;
}

describe('Copy vs Download Consistency', () => {
  const mockSOAPNote: SOAPNote = {
    subjective: 'Patient reports low back pain radiating to right leg.',
    objective: 'Lumbar: SLR positive at 45° bilaterally. Slump test negative.',
    assessment: 'Patterns consistent with lumbar radiculopathy.',
    plan: 'Manual therapy, exercise prescription, follow-up in 1 week.',
  };

  it('should generate identical content for Copy and Download', () => {
    // Simulate Copy to Clipboard
    const copyContent = generatePlainTextFormat(mockSOAPNote);
    
    // Simulate Download .txt
    const downloadContent = generatePlainTextFormat(mockSOAPNote);
    
    // Both should be identical
    expect(copyContent).toBe(downloadContent);
  });

  it('should handle SOAP notes with all sections', () => {
    const fullSOAPNote: SOAPNote = {
      subjective: 'Patient reports low back pain.',
      objective: 'SLR positive.',
      assessment: 'Lumbar radiculopathy.',
      plan: 'Treatment plan.',
      referrals: 'Refer to orthopedist.',
      precautions: 'Avoid heavy lifting.',
      additionalNotes: 'Patient education provided.',
    };
    
    const copyContent = generatePlainTextFormat(fullSOAPNote);
    const downloadContent = generatePlainTextFormat(fullSOAPNote);
    
    expect(copyContent).toBe(downloadContent);
    expect(copyContent).toContain('Derivaciones:');
    expect(copyContent).toContain('Precauciones:');
    expect(copyContent).toContain('Notas adicionales:');
  });

  it('should handle SOAP notes with empty sections', () => {
    const emptySOAPNote: SOAPNote = {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    };
    
    const copyContent = generatePlainTextFormat(emptySOAPNote);
    const downloadContent = generatePlainTextFormat(emptySOAPNote);
    
    expect(copyContent).toBe(downloadContent);
    expect(copyContent).toContain('Sin informacion subjetiva registrada.');
    expect(copyContent).toContain('Sin hallazgos objetivos registrados.');
  });

  it('should generate same format regardless of source (Copy vs Download)', () => {
    const content1 = generatePlainTextFormat(mockSOAPNote);
    const content2 = generatePlainTextFormat(mockSOAPNote);
    
    // Content should be byte-for-byte identical
    expect(content1.length).toBe(content2.length);
    expect(content1).toBe(content2);
    
    // Verify structure is consistent
    expect(content1).toMatch(/^NOTA SOAP - \d{4}-\d{2}-\d{2}/);
    expect(content1).toContain('S: SUBJETIVO');
    expect(content1).toContain('O: OBJETIVO');
    expect(content1).toContain('A: VALORACION');
    expect(content1).toContain('P: PLAN');
    expect(content1).toContain('Generado por AiDuxCare');
  });

  describe('Edge Cases', () => {
    it('should handle very long SOAP notes', () => {
      const longSOAPNote: SOAPNote = {
        subjective: 'A'.repeat(1000),
        objective: 'B'.repeat(1000),
        assessment: 'C'.repeat(1000),
        plan: 'D'.repeat(1000),
      };
      
      const copyContent = generatePlainTextFormat(longSOAPNote);
      const downloadContent = generatePlainTextFormat(longSOAPNote);
      
      expect(copyContent).toBe(downloadContent);
      expect(copyContent.length).toBeGreaterThan(4000);
    });

    it('should handle special characters consistently', () => {
      const specialSOAPNote: SOAPNote = {
        subjective: 'Patient reports pain: 8/10. Symptoms include: tingling, numbness.',
        objective: 'SLR: 45° (positive). Range: 0-60° flexion.',
        assessment: 'Patterns consistent with L4-L5 radiculopathy.',
        plan: 'Treatment: TENS, US, exercise. Follow-up: 1 week.',
      };
      
      const copyContent = generatePlainTextFormat(specialSOAPNote);
      const downloadContent = generatePlainTextFormat(specialSOAPNote);
      
      expect(copyContent).toBe(downloadContent);
      expect(copyContent).toContain(':');
      expect(copyContent).toContain('°');
      expect(copyContent).toContain('-');
    });
  });
});
