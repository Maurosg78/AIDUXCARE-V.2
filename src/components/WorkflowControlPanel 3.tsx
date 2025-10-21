import { Card, Button } from '../shared/ui';
import { Mic, MicOff, Upload, FileText, Brain } from 'lucide-react';

interface ControlPanelProps {
  recordingTime: string;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onAnalyze: () => void;
  onGenerateSOAP: () => void;
  transcript: string;
  isAnalyzing: boolean;
  selectedCount: number;
}

export const WorkflowControlPanel: React.FC<ControlPanelProps> = ({
  recordingTime,
  isRecording,
  onStartRecording,
  onStopRecording,
  onAnalyze,
  onGenerateSOAP,
  transcript,
  isAnalyzing,
  selectedCount
}) => {
  return (
    <div className="space-y-3">
      {/* Grabación */}
      <Card className="p-3">
        <div className="text-center">
          <div className="text-3xl font-mono mb-2">{recordingTime}</div>
          <div className="flex gap-2">
            <Button
              onClick={isRecording ? onStopRecording : onStartRecording}
              variant={isRecording ? 'destructive' : 'default'}
              size="sm"
              className="flex-1"
            >
              {isRecording ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              {isRecording ? 'Parar' : 'Record'}
            </Button>
            <Button variant="outline" size="sm" title="Subir archivo">
              <Upload className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Acciones principales */}
      <div className="space-y-2">
        <Button 
          onClick={onAnalyze}
          disabled={!transcript || isAnalyzing}
          className="w-full"
          size="sm"
        >
          <Brain className="w-3 h-3 mr-1" />
          {isAnalyzing ? 'Analyzing...' : 'Analizar'}
        </Button>
        
        <Button 
          onClick={onGenerateSOAP} 
          className="w-full" 
          size="sm" 
          disabled={selectedCount === 0}
          variant="outline"
        >
          <FileText className="w-3 h-3 mr-1" />
          Generar SOAP
          {selectedCount > 0 && ` (${selectedCount})`}
        </Button>
      </div>
    </div>
  );
};
