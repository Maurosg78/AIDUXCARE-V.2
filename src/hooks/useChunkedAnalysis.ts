import { useState } from 'react';
import { useNiagaraProcessor } from './useNiagaraProcessor';

export const useChunkedAnalysis = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const { processText } = useNiagaraProcessor();

  const analyzeWithChunking = async (transcript: string, withChunking: boolean = false) => {
    setIsProcessing(true);
    setProgress(0);
    setCurrentMessage('Processing transcript...');
    
    try {
      setProgress(50);
      setCurrentMessage('Analyzing with AI...');
      
      // REAL ANALYSIS - NO PLACEHOLDERS
      const analysis = await processText(transcript);
      
      setProgress(100);
      setCurrentMessage('Analysis complete');
      
      return { analysis };
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    analyzeWithChunking,
    isProcessing,
    progress,
    currentMessage
  };
};
