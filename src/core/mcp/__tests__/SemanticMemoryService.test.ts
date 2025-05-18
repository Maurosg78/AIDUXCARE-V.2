import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { SemanticMemoryService, SemanticMemoryBlock } from '../SemanticMemoryService';
import { v4 as uuidv4 } from 'uuid';

describe('SemanticMemoryService', () => {
  let service: SemanticMemoryService;
  
  // Bloques semánticos de prueba con distintos niveles de importance y relevance_score
  const mockBlocks: SemanticMemoryBlock[] = [
    {
      id: uuidv4(),
      visit_id: 'visit-1',
      patient_id: 'patient-1',
      user_id: 'user-1',
      concept: 'Hipertensión',
      category: 'diagnóstico',
      importance: 'high',
      relevance_score: 0.9,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      visit_id: 'visit-1',
      patient_id: 'patient-1',
      user_id: 'user-1',
      concept: 'Dolor abdominal leve',
      category: 'observación',
      importance: 'low',
      relevance_score: 0.3,
      source_text: 'El paciente refiere dolor abdominal ocasional',
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      visit_id: 'visit-2',
      patient_id: 'patient-1',
      user_id: 'user-1',
      concept: 'Riesgo cardíaco',
      category: 'riesgo',
      importance: 'medium',
      relevance_score: 0.6,
      created_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      visit_id: 'visit-3',
      patient_id: 'patient-2',
      user_id: 'user-2',
      concept: 'Alergia a penicilina',
      category: 'alerta',
      importance: 'high',
      relevance_score: 0.95,
      created_at: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    // Inicializar el servicio y resetear los datos antes de cada prueba
    service = new SemanticMemoryService();
    SemanticMemoryService._resetSemanticBlocksArray();
  });

  afterEach(() => {
    // Limpiar los datos después de cada prueba
    SemanticMemoryService._resetSemanticBlocksArray();
  });

  describe('saveSemanticBlock', () => {
    it('debe guardar un nuevo bloque semántico correctamente', async () => {
      const result = await service.saveSemanticBlock(mockBlocks[0]);
      
      expect(result).toBe(true);
      
      const blocks = SemanticMemoryService._getSemanticBlocksArray();
      expect(blocks.length).toBe(1);
      expect(blocks[0].concept).toBe('Hipertensión');
      expect(blocks[0].importance).toBe('high');
    });

    it('debe actualizar un bloque existente si tiene el mismo ID', async () => {
      // Guardar el bloque original
      await service.saveSemanticBlock(mockBlocks[0]);
      
      // Crear una versión actualizada del mismo bloque
      const updatedBlock: SemanticMemoryBlock = {
        ...mockBlocks[0],
        concept: 'Hipertensión severa',
        relevance_score: 1.0
      };
      
      // Actualizar el bloque
      const result = await service.saveSemanticBlock(updatedBlock);
      
      expect(result).toBe(true);
      
      // Verificar que se actualizó correctamente
      const blocks = SemanticMemoryService._getSemanticBlocksArray();
      expect(blocks.length).toBe(1);
      expect(blocks[0].concept).toBe('Hipertensión severa');
      expect(blocks[0].relevance_score).toBe(1.0);
    });

    it('debe rechazar bloques con campos obligatorios faltantes', async () => {
      // Bloque incompleto sin campos obligatorios
      const incompleteBlock = {
        id: uuidv4(),
        concept: 'Incompleto',
        category: 'prueba',
        importance: 'low' as const,
        relevance_score: 0.3,
        created_at: new Date().toISOString()
      };
      
      // @ts-ignore - ignorar error de tipado para probar el caso
      const result = await service.saveSemanticBlock(incompleteBlock);
      
      expect(result).toBe(false);
      expect(SemanticMemoryService._getSemanticBlocksArray().length).toBe(0);
    });

    it('debe rechazar bloques con relevance_score fuera del rango 0-1', async () => {
      // Bloque con relevance_score inválido
      const invalidBlock: SemanticMemoryBlock = {
        ...mockBlocks[0],
        relevance_score: 1.5 // Valor fuera del rango permitido
      };
      
      const result = await service.saveSemanticBlock(invalidBlock);
      
      expect(result).toBe(false);
      expect(SemanticMemoryService._getSemanticBlocksArray().length).toBe(0);
    });
  });

  describe('getSemanticBlocksByVisit', () => {
    it('debe recuperar los bloques asociados a una visita específica', async () => {
      // Guardar varios bloques
      await service.saveSemanticBlock(mockBlocks[0]); // visit-1
      await service.saveSemanticBlock(mockBlocks[1]); // visit-1
      await service.saveSemanticBlock(mockBlocks[2]); // visit-2
      await service.saveSemanticBlock(mockBlocks[3]); // visit-3
      
      // Recuperar bloques para visit-1
      const blocks = await service.getSemanticBlocksByVisit('visit-1');
      
      expect(blocks.length).toBe(2);
      expect(blocks.every(block => block.visit_id === 'visit-1')).toBe(true);
    });

    it('debe devolver un array vacío si la visita no tiene bloques', async () => {
      // Guardar bloques para otras visitas
      await service.saveSemanticBlock(mockBlocks[2]); // visit-2
      await service.saveSemanticBlock(mockBlocks[3]); // visit-3
      
      // Intentar recuperar bloques para visit-1 (que no tiene)
      const blocks = await service.getSemanticBlocksByVisit('visit-1');
      
      expect(blocks.length).toBe(0);
    });

    it('debe devolver un array vacío si el visitId es inválido', async () => {
      await service.saveSemanticBlock(mockBlocks[0]);
      
      // @ts-ignore - ignorar error de tipado para probar el caso
      const blocks = await service.getSemanticBlocksByVisit(null);
      
      expect(blocks.length).toBe(0);
    });
  });

  describe('getImportantSemanticBlocksByPatient', () => {
    it('debe recuperar bloques importantes según el puntaje mínimo', async () => {
      // Guardar todos los bloques
      for (const block of mockBlocks) {
        await service.saveSemanticBlock(block);
      }
      
      // Recuperar bloques importantes para patient-1 con minScore=0.5
      const importantBlocks = await service.getImportantSemanticBlocksByPatient('patient-1', 0.5);
      
      expect(importantBlocks.length).toBe(2);
      expect(importantBlocks[0].concept).toBe('Hipertensión'); // 0.9 score
      expect(importantBlocks[1].concept).toBe('Riesgo cardíaco'); // 0.6 score
      
      // Verificar que están ordenados por relevance_score (mayor a menor)
      expect(importantBlocks[0].relevance_score).toBeGreaterThan(importantBlocks[1].relevance_score);
    });

    it('debe devolver todos los bloques del paciente si minScore = 0', async () => {
      // Guardar bloques para patient-1
      await service.saveSemanticBlock(mockBlocks[0]); // score 0.9
      await service.saveSemanticBlock(mockBlocks[1]); // score 0.3
      await service.saveSemanticBlock(mockBlocks[2]); // score 0.6
      
      // Recuperar todos los bloques para patient-1
      const allBlocks = await service.getImportantSemanticBlocksByPatient('patient-1', 0);
      
      expect(allBlocks.length).toBe(3);
    });

    it('debe manejar correctamente valores de minScore fuera de rango', async () => {
      // Guardar todos los bloques
      for (const block of mockBlocks) {
        await service.saveSemanticBlock(block);
      }
      
      // Probar con minScore negativo (debería tratarse como 0)
      const blocksWithNegativeScore = await service.getImportantSemanticBlocksByPatient('patient-1', -0.5);
      expect(blocksWithNegativeScore.length).toBe(3); // Todos los bloques de patient-1
      
      // Probar con minScore mayor a 1 (debería tratarse como 1)
      const blocksWithHighScore = await service.getImportantSemanticBlocksByPatient('patient-1', 1.5);
      expect(blocksWithHighScore.length).toBe(0); // Ningún bloque tiene score = 1
    });
  });

  describe('deleteSemanticBlock', () => {
    it('debe eliminar un bloque semántico existente', async () => {
      // Guardar un bloque
      await service.saveSemanticBlock(mockBlocks[0]);
      
      // Verificar que existe
      expect(SemanticMemoryService._getSemanticBlocksArray().length).toBe(1);
      
      // Eliminar el bloque
      const result = await service.deleteSemanticBlock(mockBlocks[0].id);
      
      expect(result).toBe(true);
      expect(SemanticMemoryService._getSemanticBlocksArray().length).toBe(0);
    });

    it('debe devolver false si el bloque no existe', async () => {
      // Intentar eliminar un bloque que no existe
      const result = await service.deleteSemanticBlock('non-existent-id');
      
      expect(result).toBe(false);
    });

    it('debe mantener los demás bloques al eliminar uno específico', async () => {
      // Guardar varios bloques
      await service.saveSemanticBlock(mockBlocks[0]);
      await service.saveSemanticBlock(mockBlocks[1]);
      await service.saveSemanticBlock(mockBlocks[2]);
      
      // Eliminar el bloque del medio
      const result = await service.deleteSemanticBlock(mockBlocks[1].id);
      
      expect(result).toBe(true);
      
      // Verificar que quedan los otros dos bloques
      const remainingBlocks = SemanticMemoryService._getSemanticBlocksArray();
      expect(remainingBlocks.length).toBe(2);
      expect(remainingBlocks.some(b => b.id === mockBlocks[0].id)).toBe(true);
      expect(remainingBlocks.some(b => b.id === mockBlocks[2].id)).toBe(true);
      expect(remainingBlocks.some(b => b.id === mockBlocks[1].id)).toBe(false);
    });
  });
}); 