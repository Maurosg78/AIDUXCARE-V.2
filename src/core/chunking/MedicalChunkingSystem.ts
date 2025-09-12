export interface ChunkConfig {
  maxTokens: number;
  overlapTokens: number;
  priorityMarkers: string[];
}

export interface Chunk {
  text: string;
  tokens: number;
  startIndex: number;
  endIndex: number;
  hasOverlap: boolean;
  context?: string;
}

export interface ChunkResult {
  chunks: Chunk[];
  totalTokens: number;
  requiresChunking: boolean;
}

export class MedicalChunkingSystem {
  private readonly config: ChunkConfig = {
    maxTokens: 2500,
    overlapTokens: 300,
    priorityMarkers: []
  };

  // Contexto crítico que nunca debe dividirse
  private readonly CRITICAL_CONTEXT = [
    'no tiene', 'no presenta', 'sin dolor', 'niega', 'descarta',
    'alergia a', 'alérgico a', 'ideación', 'suicida', 'suicidio',
    'red flag', 'bandera roja', 'urgente', 'emergencia',
    'no tolera', 'contraindicado', 'embarazo', 'pregnant'
  ];

  // Marcadores de secciones clínicas
  private readonly SECTION_MARKERS = [
    'motivo de consulta', 'chief complaint',
    'antecedentes', 'history',
    'medicación', 'medication',
    'alergias', 'allergies',
    'examen físico', 'physical examination',
    'evaluación', 'assessment',
    'plan', 'treatment'
  ];

  /**
   * Procesa texto largo dividiéndolo inteligentemente
   */
  public processTranscript(text: string): ChunkResult {
    const estimatedTokens = this.estimateTokens(text);
    
    if (estimatedTokens <= this.config.maxTokens) {
      return {
        chunks: [{
          text,
          tokens: estimatedTokens,
          startIndex: 0,
          endIndex: text.length,
          hasOverlap: false
        }],
        totalTokens: estimatedTokens,
        requiresChunking: false
      };
    }

    console.log(`🔄 Activando chunking médico inteligente (${estimatedTokens} tokens)`);
    
    // Detectar secciones clínicas naturales
    const sections = this.detectClinicalSections(text);
    
    // Aplicar chunking con buffer
    const chunks = this.applySmartChunking(sections);
    
    // Añadir contexto de overlap
    const chunksWithContext = this.addContextBuffers(chunks);
    
    return {
      chunks: chunksWithContext,
      totalTokens: estimatedTokens,
      requiresChunking: true
    };
  }

  /**
   * Detecta secciones clínicas naturales en el texto
   */
  private detectClinicalSections(text: string): string[] {
    const sections: string[] = [];
    let currentSection = '';
    const lines = text.split('\n');
    
    for (const line of lines) {
      const isNewSection = this.SECTION_MARKERS.some(marker => 
        line.toLowerCase().includes(marker)
      );
      
      if (isNewSection && currentSection) {
        sections.push(currentSection);
        currentSection = line;
      } else {
        currentSection += '\n' + line;
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections.length > 0 ? sections : [text];
  }

  /**
   * Aplica chunking inteligente preservando contexto médico
   */
  private applySmartChunking(sections: string[]): Chunk[] {
    const chunks: Chunk[] = [];
    let currentChunk = '';
    let currentTokens = 0;
    let startIndex = 0;
    
    for (const section of sections) {
      const sectionTokens = this.estimateTokens(section);
      
      // Si la sección sola excede el máximo, dividirla
      if (sectionTokens > this.config.maxTokens) {
        if (currentChunk) {
          chunks.push(this.createChunk(currentChunk, startIndex));
          currentChunk = '';
          currentTokens = 0;
          startIndex += currentChunk.length;
        }
        
        // Dividir sección grande preservando oraciones críticas
        const subChunks = this.splitLargeSection(section, startIndex);
        chunks.push(...subChunks);
        startIndex += section.length;
        
      } else if (currentTokens + sectionTokens > this.config.maxTokens) {
        // Crear nuevo chunk
        chunks.push(this.createChunk(currentChunk, startIndex));
        startIndex += currentChunk.length;
        currentChunk = section;
        currentTokens = sectionTokens;
        
      } else {
        // Añadir al chunk actual
        currentChunk += '\n' + section;
        currentTokens += sectionTokens;
      }
    }
    
    // Añadir último chunk si existe
    if (currentChunk) {
      chunks.push(this.createChunk(currentChunk, startIndex));
    }
    
    return chunks;
  }

  /**
   * Divide una sección grande preservando contexto crítico
   */
  private splitLargeSection(section: string, startIndex: number): Chunk[] {
    const chunks: Chunk[] = [];
    const sentences = this.splitIntoSentences(section);
    let currentChunk = '';
    let currentTokens = 0;
    let chunkStart = startIndex;
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceTokens = this.estimateTokens(sentence);
      
      // Verificar si contiene contexto crítico
      const hasCritical = this.containsCriticalContext(sentence);
      
      if (hasCritical && i > 0 && currentChunk) {
        // Incluir oración anterior para contexto
        const prevSentence = sentences[i - 1];
        if (!currentChunk.includes(prevSentence)) {
          currentChunk = prevSentence + ' ' + currentChunk;
          currentTokens += this.estimateTokens(prevSentence);
        }
      }
      
      if (currentTokens + sentenceTokens > this.config.maxTokens - this.config.overlapTokens) {
        chunks.push(this.createChunk(currentChunk, chunkStart));
        chunkStart += currentChunk.length;
        
        // Iniciar nuevo chunk con overlap
        currentChunk = hasCritical && i > 0 ? sentences[i - 1] + ' ' + sentence : sentence;
        currentTokens = this.estimateTokens(currentChunk);
      } else {
        currentChunk += ' ' + sentence;
        currentTokens += sentenceTokens;
      }
    }
    
    if (currentChunk) {
      chunks.push(this.createChunk(currentChunk, chunkStart));
    }
    
    return chunks;
  }

  /**
   * Añade buffers de contexto entre chunks
   */
  private addContextBuffers(chunks: Chunk[]): Chunk[] {
    return chunks.map((chunk, index) => {
      let contextualChunk = { ...chunk };
      
      // Añadir contexto del chunk anterior
      if (index > 0) {
        const prevChunk = chunks[index - 1];
        const prevContext = this.extractLastNTokens(prevChunk.text, this.config.overlapTokens);
        contextualChunk.context = `[Contexto anterior: ${prevContext}]\n`;
        contextualChunk.hasOverlap = true;
      }
      
      // Añadir preview del siguiente chunk si contiene info crítica
      if (index < chunks.length - 1) {
        const nextChunk = chunks[index + 1];
        const nextPreview = this.extractFirstNTokens(nextChunk.text, 150);
        if (this.containsCriticalContext(nextPreview)) {
          contextualChunk.context = (contextualChunk.context || '') + 
            `\n[Contexto siguiente: ${nextPreview}]`;
        }
      }
      
      return contextualChunk;
    });
  }

  /**
   * Utilidades auxiliares
   */
  private estimateTokens(text: string): number {
    // Estimación: ~1.3 tokens por palabra en español/inglés médico
    return Math.ceil(text.split(/\s+/).length * 1.3);
  }

  private splitIntoSentences(text: string): string[] {
    // División inteligente por oraciones, preservando abreviaciones médicas
    const medicalAbbr = ['Dr.', 'Dra.', 'mg.', 'ml.', 'cc.', 'vs.', 'p.o.', 'i.v.'];
    let processedText = text;
    
    // Proteger abreviaciones médicas
    medicalAbbr.forEach(abbr => {
      processedText = processedText.replace(new RegExp(abbr, 'g'), abbr.replace('.', '|DOT|'));
    });
    
    // Dividir por puntos
    const sentences = processedText.split(/(?<=[.!?])\s+/);
    
    // Restaurar puntos
    return sentences.map(s => s.replace(/\|DOT\|/g, '.'));
  }

  private containsCriticalContext(text: string): boolean {
    const lowerText = text.toLowerCase();
    return this.CRITICAL_CONTEXT.some(term => lowerText.includes(term));
  }

  private createChunk(text: string, startIndex: number): Chunk {
    return {
      text: text.trim(),
      tokens: this.estimateTokens(text),
      startIndex,
      endIndex: startIndex + text.length,
      hasOverlap: false
    };
  }

  private extractLastNTokens(text: string, n: number): string {
    const words = text.split(/\s+/);
    const targetWords = Math.floor(n / 1.3);
    return words.slice(-targetWords).join(' ');
  }

  private extractFirstNTokens(text: string, n: number): string {
    const words = text.split(/\s+/);
    const targetWords = Math.floor(n / 1.3);
    return words.slice(0, targetWords).join(' ');
  }
}
