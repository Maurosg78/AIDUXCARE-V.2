import { useState } from 'react';
import { Card, Button } from '../shared/ui';
import { Copy, Download, Check, Settings } from 'lucide-react';

interface SOAPDisplayProps {
  soapNote: any;
  patientData: any;
  onDownloadPDF: () => void;
}

export const SOAPDisplay: React.FC<SOAPDisplayProps> = ({ 
  soapNote, 
  patientData,
  onDownloadPDF 
}) => {
  const [copied, setCopied] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(false);

  const generatePlainText = () => {
    // Por defecto, SOLO el SOAP limpio
    let text = `SUBJETIVO:
${soapNote.subjective}

OBJETIVO:
${soapNote.objective}

EVALUACIÓN:
${soapNote.assessment}

PLAN DE TRATAMIENTO:
${soapNote.plan}`;

    // Solo si el usuario específicamente lo pide
    if (includeMetadata) {
      const header = `PACIENTE: ${patientData.nombre} ${patientData.apellidos}
FECHA: ${new Date().toLocaleDateString('es-ES')}
HORA: ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}

`;
      text = header + text;
    }

    return text;
  };

  const copyToClipboard = async () => {
    try {
      const plainText = generatePlainText();
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      if ((window as any).Analytics) {
        (window as any).Analytics.track('SOAP_COPIED', {
          withMetadata: includeMetadata,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = generatePlainText();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Informe SOAP Generado</h2>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 mr-2">
            <input 
              type="checkbox" 
              id="metadata"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="metadata" className="text-xs text-gray-600">
              Incluir fecha/hora
            </label>
          </div>
          <Button 
            onClick={copyToClipboard} 
            variant="outline"
            className={copied ? 'bg-green-50 border-green-500' : ''}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-600" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </>
            )}
          </Button>
          <Button onClick={onDownloadPDF} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>
      
      {/* Vista previa */}
      <div className="space-y-4 border-l-4 border-blue-500 pl-4">
        <div>
          <h3 className="font-semibold text-blue-600 uppercase text-sm">Subjetivo</h3>
          <p className="mt-1 text-gray-700">{soapNote.subjective}</p>
        </div>
        <div>
          <h3 className="font-semibold text-blue-600 uppercase text-sm">Objetivo</h3>
          <p className="mt-1 text-gray-700">{soapNote.objective}</p>
        </div>
        <div>
          <h3 className="font-semibold text-blue-600 uppercase text-sm">Evaluación</h3>
          <p className="mt-1 text-gray-700">{soapNote.assessment}</p>
        </div>
        <div>
          <h3 className="font-semibold text-blue-600 uppercase text-sm">Plan</h3>
          <p className="mt-1 text-gray-700">{soapNote.plan}</p>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-gray-600">
        <strong>Copia limpia:</strong> El texto copiado no incluye formato ni metadatos. 
        Ideal para pegar en Doctoralia, historias clínicas o cualquier EMR.
      </div>
    </Card>
  );
};
