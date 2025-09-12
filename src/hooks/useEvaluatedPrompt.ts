import { useState } from 'react';
import { ClinicalEvaluationMatrix } from '../core/prompts/EvaluationMatrix';
import { PromptLibrary } from '../core/prompts/PromptLibrary';
import { PromptVersions } from '../core/prompts/PromptVersions';
import { callVertexAI } from '../services/vertex-ai-service-firebase';

export const useEvaluatedPrompt = () => {
  const [score, setScore] = useState<number>(0);
  const [evaluation, setEvaluation] = useState<any>(null);
  
  const processWithEvaluation = async (transcript: string) => {
    const lang = transcript.includes('patient') ? 'en' : 'es';
    const version = PromptVersions.getCurrentVersion();
    
    // Obtener prompt de la versión actual
    const prompt = PromptVersions.getPrompt(version, transcript, lang);
    
    // Llamar a IA
    const response = await callVertexAI(prompt);
    const parsed = JSON.parse(response.text);
    
    // EVALUAR la respuesta
    const evalResult = ClinicalEvaluationMatrix.evaluate(parsed, transcript);
    
    // GUARDAR en biblioteca
    PromptLibrary.savePromptResult(
      version,
      prompt,
      transcript,
      parsed,
      evalResult
    );
    
    console.log(`[EVALUATION] Score: ${evalResult.score}/100`);
    console.log('[EVALUATION] Breakdown:', evalResult.details);
    
    setScore(evalResult.score);
    setEvaluation(evalResult);
    
    return { response: parsed, score: evalResult.score, evaluation: evalResult };
  };
  
  return {
    processWithEvaluation,
    score,
    evaluation
  };
};
