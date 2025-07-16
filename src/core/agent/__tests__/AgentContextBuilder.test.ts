import { describe, it, vi, beforeEach, afterEach, expect as vitestExpect } from 'vitest';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { buildAgentContext } from '../AgentContextBuilder';
import { AgentContext, MemoryBlock } from '../../../types/agent';
import supabase from '../../../core/auth/supabaseClient';

chai.use(chaiAsPromised);

// Mock de supabase
vi.mock('../../../core/auth/supabaseClient', () => ({
  default: {
    from: vi.fn()
  }
}));

type PostgrestMock = any;

describe('AgentContextBuilder', () => {
  const mockDate = new Date('2023-06-15T10:00:00Z');
  const visitId = 'test-visit-123';
  
  const mockMemoryBlocks: MemoryBlock[] = [
    {
      id: 'block-1',
      type: 'contextual',
      content: 'Paciente presenta dolor abdominal intenso',
      created_at: '2023-05-15T10:30:00Z'
    },
    {
      id: 'block-2',
      type: 'persistent',
      content: 'Historial de hipertensión arterial',
      created_at: '2023-05-10T08:15:00Z'
    },
    {
      id: 'block-3',
      type: 'semantic',
      content: 'Dolor abdominal puede indicar apendicitis',
      created_at: '2023-05-15T10:35:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
    
    const mockSupabaseQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockMemoryBlocks,
        error: null
      })
    };
    vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery as PostgrestMock);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe construir un contexto válido con bloques de memoria', async () => {
    const result = await buildAgentContext(visitId);
    expect(result).to.deep.equal({
      visitId,
      blocks: mockMemoryBlocks,
      metadata: {
        createdAt: mockDate,
        updatedAt: mockDate
      }
    });
    vitestExpect(supabase.from).toHaveBeenCalledWith('memory_blocks');
  });

  it('debe manejar errores de la base de datos correctamente', async () => {
    const mockError = new Error('Error de base de datos');
    const mockErrorQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: mockError
      })
    };
    vi.mocked(supabase.from).mockReturnValueOnce(mockErrorQuery as PostgrestMock);
    await expect(buildAgentContext(visitId)).to.be.rejectedWith(mockError);
  });

  it('debe manejar el caso cuando no hay bloques de memoria', async () => {
    const mockEmptyQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null
      })
    };
    vi.mocked(supabase.from).mockReturnValueOnce(mockEmptyQuery as PostgrestMock);
    const result = await buildAgentContext(visitId);
    expect(result).to.deep.equal({
      visitId,
      blocks: [],
      metadata: {
        createdAt: mockDate,
        updatedAt: mockDate
      }
    });
  });

  it('debe rechazar con un error si falla la consulta', async () => {
    const dbError = new Error('Error de conexión');
    vi.mocked(supabase.from).mockImplementationOnce(() => { throw dbError; });
    await expect(buildAgentContext(visitId)).to.be.rejectedWith(dbError);
  });

  it('debe cumplir con el tipo AgentContext', async () => {
    const result = await buildAgentContext(visitId);
    const validateAgentContext = (context: AgentContext): boolean => {
      return (
        typeof context.visitId === 'string' &&
        Array.isArray(context.blocks) &&
        context.metadata &&
        context.metadata.createdAt instanceof Date &&
        context.metadata.updatedAt instanceof Date
      );
    };
    expect(validateAgentContext(result)).to.be.true;
    result.blocks.forEach(block => {
      expect(block).to.have.property('id');
      expect(block).to.have.property('type');
      expect(block).to.have.property('content');
      expect(block).to.have.property('created_at');
    });
  });

  it('debe filtrar bloques de memoria con datos incompletos', async () => {
    const invalidBlocks = [
      { id: 'block-1', type: 'contextual' },
      { id: 'block-2', content: 'Contenido sin tipo' },
      { id: 'block-3', type: 'semantic', created_at: '2023-05-15T10:35:00Z' },
      ...mockMemoryBlocks
    ];
    const mockQueryWithInvalidBlocks = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: invalidBlocks,
        error: null
      })
    };
    vi.mocked(supabase.from).mockReturnValueOnce(mockQueryWithInvalidBlocks as PostgrestMock);
    const result = await buildAgentContext(visitId);
    expect(result.blocks).to.deep.equal(mockMemoryBlocks);
    expect(result.blocks.length).to.equal(mockMemoryBlocks.length);
  });

  it('debe manejar correctamente diferentes formatos de fecha en created_at', async () => {
    const blocksWithDifferentDateFormats = [
      {
        id: 'block-1',
        type: 'contextual',
        content: 'Contenido con fecha ISO',
        created_at: '2023-05-15T10:30:00Z'
      },
      {
        id: 'block-2',
        type: 'persistent',
        content: 'Contenido con fecha Unix',
        created_at: '1684155000000'
      },
      {
        id: 'block-3',
        type: 'semantic',
        content: 'Contenido con fecha local',
        created_at: '2023-05-15 10:30:00'
      }
    ];
    const mockQueryWithDifferentDates = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: blocksWithDifferentDateFormats,
        error: null
      })
    };
    vi.mocked(supabase.from).mockReturnValueOnce(mockQueryWithDifferentDates as PostgrestMock);
    const result = await buildAgentContext(visitId);
    result.blocks.forEach(block => {
      expect(new Date(block.created_at).toString()).to.not.equal('Invalid Date');
    });
  });

  it('debe manejar bloques de memoria con contenido muy largo', async () => {
    const longContent = 'A'.repeat(10000);
    const blocksWithLongContent = [
      {
        id: 'block-1',
        type: 'contextual',
        content: longContent,
        created_at: '2023-05-15T10:30:00Z'
      }
    ];
    const mockQueryWithLongContent = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: blocksWithLongContent,
        error: null
      })
    };
    vi.mocked(supabase.from).mockReturnValueOnce(mockQueryWithLongContent as PostgrestMock);
    const result = await buildAgentContext(visitId);
    expect(result.blocks.length).to.equal(blocksWithLongContent.length);
    expect(result.blocks[0].content).to.equal(longContent);
  });

  it('debe actualizar correctamente los metadatos de tiempo', async () => {
    const result = await buildAgentContext(visitId);
    expect(result.metadata.createdAt.getTime()).to.equal(mockDate.getTime());
    expect(result.metadata.updatedAt.getTime()).to.equal(mockDate.getTime());
  });
}); 