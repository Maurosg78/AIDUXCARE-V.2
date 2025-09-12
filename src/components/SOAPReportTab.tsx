import React from 'react';
import { FileText, Copy, Download } from 'lucide-react';

interface SOAPReportTabProps {
  onGenerateSOAP: () => Promise<void>;
  soapNote: string | null;
  isGenerating: boolean;
}

export const SOAPReportTab: React.FC<SOAPReportTabProps> = ({
  onGenerateSOAP,
  soapNote,
  isGenerating
}) => {
  const handleCopy = () => {
    if (soapNote) {
      navigator.clipboard.writeText(soapNote);
      console.log('SOAP copiado');
    }
  };

  const handleDownload = () => {
    if (soapNote) {
      const blob = new Blob([soapNote], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SOAP_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Generar Nota SOAP</h2>
        <p className="text-gray-600 mb-6">
          Genera una nota SOAP basada en el análisis y evaluación realizados
        </p>
        
        <button
          onClick={onGenerateSOAP}
          disabled={isGenerating}
          className="inline-flex items-center justify-center rounded-md bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <FileText className="mr-2 h-6 w-6 animate-pulse" />
              Generando SOAP...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-6 w-6" />
              Generar Nota SOAP
            </>
          )}
        </button>
      </div>

      {soapNote && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Nota SOAP Generada</h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copiar
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-1 rounded bg-gray-600 hover:bg-gray-700 text-white text-sm"
              >
                <Download className="w-4 h-4 mr-1" />
                Descargar
              </button>
            </div>
          </div>
          
          <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded overflow-x-auto">
            {soapNote}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SOAPReportTab;
