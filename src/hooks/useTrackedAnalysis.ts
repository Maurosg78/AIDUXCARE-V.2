import { useState } from 'react';
import { PromptTracker } from '../core/prompts/PromptTracker';
import { ClinicalEvaluationMatrix } from '../core/prompts/EvaluationMatrix';
import { PromptVersions } from '../core/prompts/PromptVersions';
import { callVertexAI } from '../services/vertex-ai-service-firebase';

export const useTrackedAnalysis = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScore, setLastScore] = useState<number>(0);
  const [analysisId, setAnalysisId] = useState<string>('');
  
  const analyzeWithTracking = async (transcript: string) => {
    setIsProcessing(true);
    const startTime = Date.now();
    
    try {
      // Detectar idioma y obtener prompt
      const lang = transcript.toLowerCase().includes('patient') ? 'en' : 'es';
      const version = PromptVersions.getCurrentVersion();
      const prompt = PromptVersions.getPrompt(version, transcript, lang);
      
      // Llamar a IA
      const response = await callVertexAI(prompt);
      const parsed = JSON.parse(response.text);
      
      // Evaluar respuesta
      const evaluation = ClinicalEvaluationMatrix.evaluate(parsed, transcript);
      
      // TRACKING COMPLETO
      const processingTime = Date.now() - startTime;
      const id = await PromptTracker.trackAnalysis(
        transcript,
        prompt,
        parsed,
        evaluation,
        processingTime
      );
      
      setLastScore(evaluation.score);
      setAnalysisId(id);
      
      // Generar reporte si hay suficientes datos
      const analyses = PromptTracker.getAllAnalyses();
      if (analyses.length % 10 === 0) { // Cada 10 análisis
        console.log(PromptTracker.generateReport());
      }
      
      return {
        response: parsed,
        score: evaluation.score,
        analysisId: id,
        evaluation
      };
      
    } catch (error) {
      console.error('[TrackedAnalysis] Error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };
  
  const getPerformanceStats = () => {
    return PromptTracker.getStatsByType();
  };
  
  return {
    analyzeWithTracking,
    isProcessing,
    lastScore,
    analysisId,
    getPerformanceStats
  };
};
