// Reemplazar en handleAnalyzeNormal y handleAnalyzePro
import { useChunkedAnalysis } from '../hooks/useChunkedAnalysis';

const { analyzeWithChunking, isProcessing, progress, currentMessage } = useChunkedAnalysis();

const handleAnalyzeNormal = async () => {
  if (!consumeCredits(1)) {
    alert(t.analysis.insufficientCredits);
    return;
  }
  
  const result = await analyzeWithChunking(transcript, false);
  if (result) {
    setAnalysisResults(result.analysis);
    console.log(`✅ Análisis completado ${result.wasChunked ? `en ${result.chunksProcessed} secciones` : 'directamente'}`);
  }
};
