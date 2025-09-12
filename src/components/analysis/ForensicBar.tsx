import React from 'react';
import { Shield, Download, Copy, Database, CheckCircle, XCircle } from 'lucide-react';

interface ForensicBarProps {
  traceId: string;
  modelUsed?: string;
  timestamp?: string;
  promptHash?: string;
  responseHash?: string;
  dataResidency?: string;
  executor?: {
    id: string;
    name: string;
    license?: string;
  };
  consentCaptured: boolean;
  onSaveEvidence?: () => void;
  onCopyHash?: () => void;
  onExportEHR?: () => void;
}

export const ForensicBar: React.FC<ForensicBarProps> = ({
  traceId,
  modelUsed = 'gemini-1.5-flash',
  timestamp = new Date().toLocaleString('es-CA'),
  promptHash = '',
  responseHash = '',
  dataResidency = 'CA',
  executor,
  consentCaptured,
  onSaveEvidence,
  onCopyHash,
  onExportEHR
}) => {
  // Generar hashes básicos si no vienen
  const finalPromptHash = promptHash || `prompt-${traceId?.substring(0, 8)}`;
  const finalResponseHash = responseHash || `response-${traceId?.substring(0, 8)}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white border-t-2 border-blue-500 z-50">
      <div className="container mx-auto px-4 py-2">
        {/* Línea 1: Información forense */}
        <div className="flex flex-wrap items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-4">
            <Shield className="w-4 h-4 text-blue-400" />
            
            <span className="font-mono">
              TraceID: <span className="text-yellow-400">{traceId || 'N/A'}</span>
            </span>
            
            <span>
              Modelo: <span className="text-green-400">{modelUsed}</span>
            </span>
            
            <span>
              Hora: <span className="text-gray-400">{timestamp}</span>
            </span>
            
            <span className="font-mono text-gray-500">
              P:{finalPromptHash} | R:{finalResponseHash}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              Residencia: <span className="font-bold text-green-400">{dataResidency}</span>
            </span>
            
            {executor && (
              <span>
                Ejecutor: {executor.name} 
                {executor.license && ` (Lic: ${executor.license})`}
              </span>
            )}
            
            <span className="flex items-center gap-1">
              Consentimiento:
              {consentCaptured ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </span>
          </div>
        </div>
        
        {/* Línea 2: Acciones */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onSaveEvidence}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
          >
            <Download className="w-3 h-3" />
            Guardar evidencia (PDF+JSON)
          </button>
          
          <button
            onClick={onCopyHash}
            className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
          >
            <Copy className="w-3 h-3" />
            Copiar hash
          </button>
          
          <button
            onClick={onExportEHR}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition-colors"
          >
            <Database className="w-3 h-3" />
            Exportar a EHR
          </button>
        </div>
      </div>
    </div>
  );
};
