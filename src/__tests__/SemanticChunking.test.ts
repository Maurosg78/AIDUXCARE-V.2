import { SemanticChunkingService } from '../services/SemanticChunkingService';

describe('SemanticChunkingService', () => {
  let service: SemanticChunkingService;

  beforeEach(() => {
    service = new SemanticChunkingService();
  });

  afterEach(() => {
    service.destroy();
  });

  test('should be created successfully', () => {
    expect(service).toBeDefined();
  });

  test('should detect anamnesis phase', () => {
    const audioBlob = new Blob(['test'], { type: 'audio/webm' });
    const chunk = service.processTranscriptionSegment(
      "El paciente presenta dolor lumbar",
      audioBlob,
      1000
    );
    
    const finalChunk = service.processTranscriptionSegment(
      "de inicio gradual",
      audioBlob,
      5000
    );
    
    expect(finalChunk).toBeDefined();
    expect(finalChunk?.medicalPhase).toBe('anamnesis');
    expect(finalChunk?.soapCategory).toBe('S');
  });
}); 