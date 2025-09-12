import { useState, useCallback } from 'react';
import { MedicalChunkingSystem, ChunkResult } from '../core/chunking/MedicalChunkingSystem';
import { callVertexAI } from '../services/vertex-ai-service-firebase';
import { normalizeVertexResponse } from '../utils/cleanVertexResponse';

interface ChunkedAnalysisResult {
  analysis: any;
  wasChunked: boolean;
  chunksProcessed: number;
}

export const useChunkedAnalysis = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  
  const chunker = new MedicalChunkingSystem();
  
  const analyzeWithChunking = useCallback(async (
    transcript: string,
    isPro: boolean = false
  ): Promise<ChunkedAnalysisResult | null> => {
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Procesar transcript con chunking si es necesario
      const chunkResult = chunker.processTranscript(transcript);
      
      if (!chunkResult.requiresChunking) {
        // Análisis estándar
        setCurrentMessage('Analizando encuentro clínico...');
        const response = await callVertexAI(createPrompt(transcript, isPro));
        const normalized = normalizeVertexResponse(response);
        
        return {
          analysis: normalized,
          wasChunked: false,
          chunksProcessed: 1
        };
      }
      
      // Análisis con chunking
      console.log(`📊 Procesando ${chunkResult.chunks.length} secciones`);
      setCurrentMessage('Detectando secciones clínicas...');
      
      const chunkResults = [];
      
      for (let i = 0; i < chunkResult.chunks.length; i++) {
        const chunk = chunkResult.chunks[i];
        const progress = ((i + 1) / chunkResult.chunks.length) * 100;
        
        setProgress(progress);
        setCurrentMessage(getProgressMessage(i, chunkResult.chunks.length));
        
        // Crear prompt contextual para el chunk
        const chunkPrompt = createChunkPrompt(chunk, {
          isFirst: i === 0,
          isLast: i === chunkResult.chunks.length - 1,
          chunkNumber: i + 1,
          totalChunks: chunkResult.chunks.length,
          previousSummary: i > 0 ? chunkResults[i - 1].summary : null,
          isPro
        });
        
        const response = await callVertexAI(chunkPrompt);
        const normalized = normalizeVertexResponse(response);
        chunkResults.push(normalized);
        
        // Pequeña pausa para no saturar
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Merge inteligente de resultados
      setCurrentMessage('Consolidando análisis integral...');
      const mergedAnalysis = mergeChunkAnalyses(chunkResults);
      
      return {
        analysis: mergedAnalysis,
        wasChunked: true,
        chunksProcessed: chunkResult.chunks.length
      };
      
    } catch (error) {
      console.error('Error en análisis con chunking:', error);
      return null;
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setCurrentMessage('');
    }
  }, []);
  
  return {
    analyzeWithChunking,
    isProcessing,
    progress,
    currentMessage
  };
};

// Funciones auxiliares
function createPrompt(transcript: string, isPro: boolean): string {
  const basePrompt = `You are a physiotherapist analyzing a patient encounter.
${isPro ? 'Provide DEEP ANALYSIS with differential diagnosis and referral recommendations.' : ''}

PATIENT ENCOUNTER:
${transcript}

Analyze and provide:
1. Red flags (urgent medical concerns)
2. Clinical entities (symptoms, medications, conditions)
3. Yellow flags (psychosocial factors)
4. Recommended physical tests
5. Clinical reasoning

Format as JSON.`;
  
  return basePrompt;
}

function createChunkPrompt(chunk: any, context: any): string {
  let prompt = `You are analyzing part ${context.chunkNumber} of ${context.totalChunks} of a patient encounter.

${chunk.context ? `CONTEXT FROM PREVIOUS SECTION:\n${chunk.context}\n` : ''}

${context.previousSummary ? `PREVIOUS FINDINGS SUMMARY:\n${context.previousSummary}\n` : ''}

CURRENT SECTION:
${chunk.text}

${context.isFirst ? 'Focus on chief complaint and initial assessment.' : ''}
${context.isLast ? 'Provide final recommendations and summary.' : ''}

Analyze for red flags, entities, and clinical relevance.
Format as JSON.`;
  
  return prompt;
}

function mergeChunkAnalyses(results: any[]): any {
  const merged = {
    redFlags: [],
    entities: [],
    yellowFlags: [],
    physicalTests: [],
    reasoning: '',
    summary: ''
  };
  
  // Consolidar red flags (nunca perder ninguno)
  const allRedFlags = results.flatMap(r => r.redFlags || []);
  merged.redFlags = deduplicateByPriority(allRedFlags);
  
  // Consolidar entidades (deduplicar por nombre+tipo)
  const allEntities = results.flatMap(r => r.entities || []);
  merged.entities = deduplicateEntities(allEntities);
  
  // Yellow flags únicos
  const allYellowFlags = results.flatMap(r => r.yellowFlags || []);
  merged.yellowFlags = [...new Set(allYellowFlags)];
  
  // Tests físicos únicos
  const allTests = results.flatMap(r => r.physicalTests || []);
  merged.physicalTests = [...new Set(allTests)];
  
  // Combinar razonamiento
  const reasonings = results.map(r => r.reasoning).filter(Boolean);
  merged.reasoning = reasonings.join('\n\n');
  
  return merged;
}

function deduplicateByPriority(items: any[]): any[] {
  const map = new Map();
  items.forEach(item => {
    const key = typeof item === 'string' ? item : item.name || item.id;
    if (!map.has(key) || (item.priority && item.priority > map.get(key).priority)) {
      map.set(key, item);
    }
  });
  return Array.from(map.values());
}

function deduplicateEntities(entities: any[]): any[] {
  const map = new Map();
  entities.forEach(entity => {
    const key = `${entity.name}-${entity.type}`;
    if (!map.has(key)) {
      map.set(key, entity);
    }
  });
  return Array.from(map.values());
}

function getProgressMessage(current: number, total: number): string {
  const percentage = ((current + 1) / total) * 100;
  
  if (percentage <= 25) return 'Analizando motivo de consulta...';
  if (percentage <= 50) return 'Procesando antecedentes clínicos...';
  if (percentage <= 75) return 'Evaluando medicación y señales de alerta...';
  if (percentage <= 90) return 'Detectando patrones clínicos...';
  return 'Finalizando análisis integral...';
}
