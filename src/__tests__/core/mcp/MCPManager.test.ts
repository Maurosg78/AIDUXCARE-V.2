import { describe, it, expect, beforeEach } from 'vitest';
import { MCPManager } from '@/core/mcp/MCPManager';
import { MCPMemoryBlock } from '@/core/mcp/schema';

// TEST MIGRADO: Ahora solo valida estructura mockeada de Firestore

describe('MCPManager (Firestore migrado)', () => {
  const manager = new MCPManager();
  const mockVisitId = 'visit-test-123';
  const mockPatientId = 'patient-test-456';

  it('debería devolver contexto vacío con source firestore', async () => {
    const result = await manager.buildContext(mockVisitId, mockPatientId);
    expect(result).toEqual({
      contextual: { source: 'firestore', data: [] },
      persistent: { source: 'firestore', data: [] },
      semantic: { source: 'firestore', data: [] }
    });
  });
}); 