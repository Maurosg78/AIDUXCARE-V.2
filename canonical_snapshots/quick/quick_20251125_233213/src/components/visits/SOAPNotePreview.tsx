import * as React from "react";

export const SOAPNotePreview = ({ analysisResults }: { analysisResults?: any }) => {
  if (!analysisResults) return <div>Analizando...</div>;
  if (Array.isArray(analysisResults.entities) && analysisResults.entities.length === 0)
    return <div>No hay información clínica estructurable</div>;
  return <div>SOAP ready</div>;
};

// ✅ doble exportación por compatibilidad
export default SOAPNotePreview;
