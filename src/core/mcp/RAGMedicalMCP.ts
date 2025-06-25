/**
 * 🧬 AiDuxCare - RAG Medical MCP
 * Model Context Protocol especializado en Retrieval Augmented Generation
 * para fuentes de conocimiento médico (PubMed, guidelines, evidence-based protocols)
 */

import { MCPMemoryBlock } from './schema';

// === INTERFACES RAG MÉDICO ===

export interface MedicalDocument {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  publication_date: string;
  doi?: string;
  pmid?: string; // PubMed ID
  keywords: string[];
  medical_specialty: MedicalSpecialty[];
  evidence_level: EvidenceLevel;
  content_type: 'research_paper' | 'clinical_guideline' | 'systematic_review' | 'meta_analysis' | 'case_study';
  source: 'pubmed' | 'cochrane' | 'uptodate' | 'nice_guidelines' | 'local_library';
}

export interface ChunkedDocument {
  chunk_id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  total_chunks: number;
  tokens: number;
  embedding?: number[]; // Vector embedding
  metadata: {
    section_type: 'abstract' | 'introduction' | 'methods' | 'results' | 'discussion' | 'conclusion';
    page?: number;
    confidence_score?: number;
  };
}

export interface RAGQueryResult {
  query: string;
  relevant_chunks: ChunkedDocument[];
  medical_context: string;
  confidence_score: number;
  citations: CitationReference[];
  processing_time_ms: number;
}

export interface CitationReference {
  document_id: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  doi?: string;
  pmid?: string;
  relevance_score: number;
}

export type MedicalSpecialty = 
  | 'fisioterapia' 
  | 'medicina_fisica' 
  | 'reumatologia' 
  | 'neurologia' 
  | 'ortopedia' 
  | 'medicina_deportiva'
  | 'medicina_interna'
  | 'general';

export type EvidenceLevel = 
  | 'level_1' // Systematic reviews, Meta-analyses
  | 'level_2' // Randomized controlled trials
  | 'level_3' // Cohort studies
  | 'level_4' // Case-control studies
  | 'level_5' // Case series, Expert opinion
  | 'guideline' // Clinical guidelines
  | 'consensus'; // Expert consensus

// === SERVICIOS DE BÚSQUEDA ===

/**
 * Servicio para búsqueda en PubMed via API gratuita
 */
export class PubMedSearchService {
  private static readonly BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  private static readonly EMAIL = 'aiduxcare@domain.com'; // Requerido por NCBI
  
  /**
   * Busca artículos relevantes en PubMed
   */
  static async searchArticles(query: string, specialty: MedicalSpecialty, maxResults: number = 10): Promise<MedicalDocument[]> {
    try {
      // Construir query especializada para fisioterapia
      const specializedQuery = this.buildSpecializedQuery(query, specialty);
      
      // Búsqueda en PubMed
      const searchUrl = `${this.BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(specializedQuery)}&retmax=${maxResults}&retmode=json&email=${this.EMAIL}`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (!searchData.esearchresult?.idlist?.length) {
        console.log('No se encontraron artículos para:', query);
        return [];
      }
      
      // Obtener detalles de los artículos
      const ids = searchData.esearchresult.idlist.join(',');
      const detailsUrl = `${this.BASE_URL}/esummary.fcgi?db=pubmed&id=${ids}&retmode=json&email=${this.EMAIL}`;
      
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();
      
      // Convertir a formato interno
      const documents: MedicalDocument[] = [];
      
      for (const uid of searchData.esearchresult.idlist) {
        const article = detailsData.result[uid];
        if (article) {
          try {
            documents.push({
              id: `pubmed_${uid}`,
              title: article.title || '',
              abstract: await this.getAbstract(uid), // Obtener abstract separadamente
              authors: article.authors?.map((a: { name: string }) => a.name) || [],
              journal: article.fulljournalname || article.source || '',
              publication_date: article.pubdate || '',
              doi: article.doi || undefined,
              pmid: uid,
              keywords: this.extractKeywords(article.title, specialty),
              medical_specialty: [specialty],
              evidence_level: this.determineEvidenceLevel(article.title, article.pubtype),
              content_type: this.determineContentType(article.pubtype),
              source: 'pubmed'
            });
          } catch (articleError) {
            console.warn(`WARNING: Error procesando artículo ${uid}:`, articleError);
            // Continuar con el siguiente artículo
          }
        }
      }
      
      console.log(`SUCCESS: Encontrados ${documents.length} artículos en PubMed para: ${query}`);
      return documents;
      
    } catch (error) {
      console.error('Error buscando en PubMed:', error);
      return [];
    }
  }
  
  /**
   * Obtiene el abstract completo de un artículo
   */
  private static async getAbstract(pmid: string): Promise<string> {
    try {
      const abstractUrl = `${this.BASE_URL}/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml&email=${this.EMAIL}`;
      const response = await fetch(abstractUrl);
      const xmlText = await response.text();
      
      // Extraer abstract del XML (simplificado)
      const abstractMatch = xmlText.match(/<AbstractText[^>]*>(.*?)<\/AbstractText>/s);
      return abstractMatch ? abstractMatch[1].replace(/<[^>]*>/g, '') : '';
      
    } catch (error) {
      console.error(`Error obteniendo abstract para PMID ${pmid}:`, error);
      return '';
    }
  }
  
  /**
   * Construye query especializada según la especialidad médica
   */
  private static buildSpecializedQuery(query: string, specialty: MedicalSpecialty): string {
    const specialtyTerms: Record<MedicalSpecialty, string[]> = {
      fisioterapia: ['physical therapy', 'physiotherapy', 'rehabilitation', 'manual therapy'],
      medicina_fisica: ['physical medicine', 'rehabilitation medicine', 'PM&R'],
      reumatologia: ['rheumatology', 'arthritis', 'autoimmune'],
      neurologia: ['neurology', 'neurological', 'brain', 'nervous system'],
      ortopedia: ['orthopedics', 'orthopedic', 'bone', 'joint'],
      medicina_deportiva: ['sports medicine', 'athletic', 'exercise'],
      medicina_interna: ['internal medicine', 'general medicine'],
      general: []
    };
    
    const terms = specialtyTerms[specialty] || [];
    const specialtyQuery = terms.length > 0 ? ` AND (${terms.map(t => `"${t}"`).join(' OR ')})` : '';
    
    return `${query}${specialtyQuery} AND (clinical trial OR systematic review OR meta-analysis OR randomized controlled trial)`;
  }
  
  /**
   * Extrae keywords relevantes del título
   */
  private static extractKeywords(title: string, specialty: MedicalSpecialty): string[] {
    const commonKeywords = [
      'pain', 'dolor', 'treatment', 'therapy', 'rehabilitation', 'exercise',
      'manual', 'therapeutic', 'clinical', 'evidence', 'effectiveness',
      'randomized', 'controlled', 'trial', 'systematic', 'review'
    ];
    
    return commonKeywords.filter(keyword => 
      title.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  /**
   * Determina el nivel de evidencia basado en el tipo de publicación
   */
  private static determineEvidenceLevel(title: string, pubTypes: string[] = []): EvidenceLevel {
    const titleLower = title.toLowerCase();
    const types = pubTypes.join(' ').toLowerCase();
    
    if (titleLower.includes('systematic review') || titleLower.includes('meta-analysis')) {
      return 'level_1';
    }
    if (titleLower.includes('randomized controlled trial') || titleLower.includes('rct')) {
      return 'level_2';
    }
    if (titleLower.includes('cohort')) {
      return 'level_3';
    }
    if (titleLower.includes('case-control')) {
      return 'level_4';
    }
    if (titleLower.includes('guideline')) {
      return 'guideline';
    }
    
    return 'level_5'; // Default para case series, expert opinion
  }
  
  /**
   * Determina el tipo de contenido
   */
  private static determineContentType(pubTypes: string[] = []): MedicalDocument['content_type'] {
    const types = pubTypes.join(' ').toLowerCase();
    
    if (types.includes('systematic review')) return 'systematic_review';
    if (types.includes('meta-analysis')) return 'meta_analysis';
    if (types.includes('guideline')) return 'clinical_guideline';
    if (types.includes('case report')) return 'case_study';
    
    return 'research_paper'; // Default
  }
}

/**
 * Servicio de chunking inteligente para documentos médicos
 */
export class MedicalDocumentChunker {
  
  /**
   * Divide un documento médico en chunks semánticamente coherentes
   */
  static chunkDocument(document: MedicalDocument, maxTokensPerChunk: number = 512): ChunkedDocument[] {
    const chunks: ChunkedDocument[] = [];
    
    // Chunk 1: Abstract (siempre separado)
    if (document.abstract) {
      chunks.push({
        chunk_id: `${document.id}_abstract`,
        document_id: document.id,
        content: document.abstract,
        chunk_index: 0,
        total_chunks: 0, // Se actualizará al final
        tokens: this.estimateTokens(document.abstract),
        metadata: {
          section_type: 'abstract',
          confidence_score: 1.0 // Abstract siempre tiene alta confianza
        }
      });
    }
    
    // Chunk 2: Título + metadata como contexto
    const metadataContent = `
Title: ${document.title}
Authors: ${document.authors.join(', ')}
Journal: ${document.journal}
Year: ${document.publication_date}
Evidence Level: ${document.evidence_level}
Keywords: ${document.keywords.join(', ')}
    `.trim();
    
    chunks.push({
      chunk_id: `${document.id}_metadata`,
      document_id: document.id,
      content: metadataContent,
      chunk_index: 1,
      total_chunks: 0,
      tokens: this.estimateTokens(metadataContent),
      metadata: {
        section_type: 'introduction',
        confidence_score: 0.8
      }
    });
    
    // Actualizar total_chunks
    chunks.forEach(chunk => {
      chunk.total_chunks = chunks.length;
    });
    
    return chunks;
  }
  
  /**
   * Estimación simple de tokens (1 token ≈ 4 caracteres en inglés)
   */
  private static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

/**
 * MCP RAG Medical Knowledge Service
 */
export class RAGMedicalMCP {
  private static documentsCache: Map<string, MedicalDocument> = new Map();
  private static chunksCache: Map<string, ChunkedDocument[]> = new Map();
  
  /**
   * Busca y procesa conocimiento médico relevante para una consulta clínica
   */
  static async retrieveRelevantKnowledge(
    clinicalQuery: string, 
    specialty: MedicalSpecialty = 'fisioterapia',
    maxResults: number = 5
  ): Promise<RAGQueryResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Buscando conocimiento médico para: "${clinicalQuery}"`);
      
      // 1. Buscar en PubMed
      const documents = await PubMedSearchService.searchArticles(clinicalQuery, specialty, maxResults);
      
      if (documents.length === 0) {
        return {
          query: clinicalQuery,
          relevant_chunks: [],
          medical_context: 'No se encontró evidencia científica específica para esta consulta.',
          confidence_score: 0.0,
          citations: [],
          processing_time_ms: Date.now() - startTime
        };
      }
      
      // 2. Procesar documentos en chunks
      const allChunks: ChunkedDocument[] = [];
      const citations: CitationReference[] = [];
      
      for (const doc of documents) {
        // Cache del documento
        this.documentsCache.set(doc.id, doc);
        
        // Generar chunks
        const chunks = MedicalDocumentChunker.chunkDocument(doc);
        this.chunksCache.set(doc.id, chunks);
        
        allChunks.push(...chunks);
        
        // Crear cita
        citations.push({
          document_id: doc.id,
          title: doc.title,
          authors: doc.authors.slice(0, 3).join(', ') + (doc.authors.length > 3 ? ' et al.' : ''),
          journal: doc.journal,
          year: doc.publication_date.split('-')[0] || '',
          doi: doc.doi,
          pmid: doc.pmid,
          relevance_score: this.calculateRelevanceScore(doc, clinicalQuery)
        });
      }
      
      // 3. Construir contexto médico agregado
      const medicalContext = this.buildMedicalContext(allChunks, clinicalQuery);
      
      // 4. Calcular confianza general
      const confidenceScore = this.calculateOverallConfidence(documents, clinicalQuery);
      
      console.log(`SUCCESS: RAG completado: ${documents.length} documentos, ${allChunks.length} chunks`);
      
      return {
        query: clinicalQuery,
        relevant_chunks: allChunks.slice(0, 10), // Limitar top 10 chunks
        medical_context: medicalContext,
        confidence_score: confidenceScore,
        citations: citations.sort((a, b) => b.relevance_score - a.relevance_score),
        processing_time_ms: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Error en RAG Medical MCP:', error);
      return {
        query: clinicalQuery,
        relevant_chunks: [],
        medical_context: 'Error al acceder a las fuentes de conocimiento médico.',
        confidence_score: 0.0,
        citations: [],
        processing_time_ms: Date.now() - startTime
      };
    }
  }
  
  /**
   * Genera bloques MCP a partir de resultados RAG
   */
  static convertToMCPBlocks(ragResult: RAGQueryResult): MCPMemoryBlock[] {
    const blocks: MCPMemoryBlock[] = [];
    
    // Bloque principal con el contexto médico
    blocks.push({
      id: `rag_context_${Date.now()}`,
      type: 'semantic',
      content: `EVIDENCIA CIENTÍFICA PARA: "${ragResult.query}"

${ragResult.medical_context}

NIVEL DE CONFIANZA: ${Math.round(ragResult.confidence_score * 100)}%
FUENTES CONSULTADAS: ${ragResult.citations.length} publicaciones científicas
TIEMPO DE PROCESAMIENTO: ${ragResult.processing_time_ms}ms`,
      created_at: new Date().toISOString()
    });
    
    // Bloques individuales para los chunks más relevantes (top 3)
    ragResult.relevant_chunks.slice(0, 3).forEach((chunk, index) => {
      const citation = ragResult.citations.find(c => c.document_id === chunk.document_id);
      
      blocks.push({
        id: `rag_chunk_${chunk.chunk_id}`,
        type: 'semantic',
        content: `FUENTE ${index + 1}: ${citation?.title || 'Documento médico'}

AUTORES: ${citation?.authors || 'No especificado'}
REVISTA: ${citation?.journal || 'No especificado'} (${citation?.year || ''})
${citation?.pmid ? `PMID: ${citation.pmid}` : ''}

CONTENIDO:
${chunk.content}

RELEVANCIA: ${Math.round((citation?.relevance_score || 0) * 100)}%`,
        created_at: new Date().toISOString()
      });
    });
    
    return blocks;
  }
  
  /**
   * Construye contexto médico agregado
   */
  private static buildMedicalContext(chunks: ChunkedDocument[], query: string): string {
    if (chunks.length === 0) {
      return 'No se encontró evidencia científica específica.';
    }
    
    const abstractChunks = chunks.filter(c => c.metadata.section_type === 'abstract');
    
    if (abstractChunks.length === 0) {
      return 'Evidencia científica disponible pero sin abstracts accesibles.';
    }
    
    const summaries = abstractChunks.slice(0, 3).map((chunk, index) => {
      const doc = this.documentsCache.get(chunk.document_id);
      return `${index + 1}. ${doc?.title || 'Estudio'}: ${chunk.content.substring(0, 200)}...`;
    });
    
    return `EVIDENCIA CIENTÍFICA RELACIONADA:

${summaries.join('\n\n')}

RECOMENDACIÓN: Considerar esta evidencia en el contexto clínico específico del paciente.`;
  }
  
  /**
   * Calcula score de relevancia
   */
  private static calculateRelevanceScore(doc: MedicalDocument, query: string): number {
    let score = 0.5; // Base score
    
    const queryLower = query.toLowerCase();
    const titleLower = doc.title.toLowerCase();
    const abstractLower = doc.abstract.toLowerCase();
    
    // Bonus por coincidencias en título
    if (titleLower.includes(queryLower)) score += 0.3;
    
    // Bonus por coincidencias en abstract
    if (abstractLower.includes(queryLower)) score += 0.2;
    
    // Bonus por nivel de evidencia
    switch (doc.evidence_level) {
      case 'level_1': score += 0.2; break;
      case 'level_2': score += 0.15; break;
      case 'guideline': score += 0.1; break;
      default: break;
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Calcula confianza general
   */
  private static calculateOverallConfidence(docs: MedicalDocument[], query: string): number {
    if (docs.length === 0) return 0.0;
    
    const avgRelevance = docs.reduce((sum, doc) => 
      sum + this.calculateRelevanceScore(doc, query), 0) / docs.length;
    
    const evidenceBonus = docs.some(d => d.evidence_level === 'level_1' || d.evidence_level === 'level_2') ? 0.1 : 0;
    
    return Math.min(avgRelevance + evidenceBonus, 1.0);
  }
}

/**
 * Helper para testing y desarrollo
 */
export class RAGTestingHelper {
  
  /**
   * Test completo del pipeline RAG
   */
  static async testRAGPipeline(): Promise<void> {
    console.log('🧪 Testing RAG Medical MCP Pipeline...');
    
    const testQueries = [
      'lumbar spine physical therapy exercises',
      'manual therapy cervical pain effectiveness',
      'knee rehabilitation post surgery protocol',
      'chronic pain management physiotherapy'
    ];
    
    for (const query of testQueries) {
      console.log(`\n📝 Testing query: "${query}"`);
      
      const result = await RAGMedicalMCP.retrieveRelevantKnowledge(query, 'fisioterapia', 3);
      
      console.log(`SUCCESS: Found ${result.citations.length} citations`);
      console.log(`SUCCESS: Generated ${result.relevant_chunks.length} chunks`);
      console.log(`SUCCESS: Confidence: ${Math.round(result.confidence_score * 100)}%`);
      console.log(`SUCCESS: Processing time: ${result.processing_time_ms}ms`);
      
      // Generar bloques MCP
      const mcpBlocks = RAGMedicalMCP.convertToMCPBlocks(result);
      console.log(`SUCCESS: Generated ${mcpBlocks.length} MCP blocks`);
    }
    
    console.log('\n🎉 RAG Pipeline testing completed!');
  }
} 