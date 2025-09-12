// En handleAnalyzeNormal y handleAnalyzePro
const handleAnalyzeNormal = async () => {
  if (!consumeCredits(1)) {
    alert(t.analysis.insufficientCredits);
    return;
  }
  
  console.log('🔍 Análisis Normal (-1 crédito)');
  const result = await analyzeWithControlledReasoning(transcript);
  
  if (result && result.analysis) {
    // CRÍTICO: Asegurar que se pasen los datos completos
    setAnalysisResults({
      redFlags: result.analysis.redFlags || [],
      entities: result.analysis.entities || [],
      yellowFlags: result.analysis.yellowFlags || [],
      physicalTests: result.analysis.physicalTests || []
    });
    
    // Log para verificar
    console.log('Resultados establecidos:', {
      redFlags: result.analysis.redFlags?.length || 0,
      entities: result.analysis.entities?.length || 0
    });
  }
};
