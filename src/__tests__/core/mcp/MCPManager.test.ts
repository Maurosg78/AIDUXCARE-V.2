import { describe, it, expect } from 'vitest';
import { MCPManager } from '../../../core/mcp/MCPManager';

// TEST MIGRADO: Ahora solo valida estructura mockeada de Firestore

describe('MCPManager (Firestore migrado)', () => {
  const manager = MCPManager.getInstance();

  it('debería devolver contexto vacío con source firestore', async () => {
    const result = await manager.buildContext();
    expect(result).toEqual({
      contextual: { source: 'firestore', data: [] },
      persistent: { source: 'firestore', data: [] },
      semantic: { source: 'firestore', data: [] }
    });
  });
}); 