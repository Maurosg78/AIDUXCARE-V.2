  const canAccessSOAP = () => {
    return analysisResults && // Debe haber análisis completado
           transcript && // Debe haber transcript
           transcript.length > 50; // Mínimo contenido
  };
