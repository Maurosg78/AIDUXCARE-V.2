// Actualizar los imports
import { useChunkedAnalysis } from '../hooks/useChunkedAnalysis';
import { ChunkingProgress } from '../components/analysis/ChunkingProgress';

// En el componente, reemplazar useControlledReasoning por useChunkedAnalysis
const { analyzeWithChunking, isProcessing, progress, currentMessage } = useChunkedAnalysis();

// En handleAnalyzeNormal
const handleAnalyzeNormal = async () => {
  if (!consumeCredits(1)) {
    alert(t.analysis.insufficientCredits);
    return;
  }
  
  console.log('🔍 Análisis Normal con chunking inteligente');
  const result = await analyzeWithChunking(transcript, false);
  
  if (result) {
    setAnalysisResults(result.analysis);
    if (result.wasChunked) {
      console.log(`✅ Análisis completado en ${result.chunksProcessed} secciones`);
    }
  }
};

// En el render, añadir el componente de progreso
{isProcessing && (
  <ChunkingProgress 
    progress={progress}
    message={currentMessage}
    isVisible={true}
  />
)}
