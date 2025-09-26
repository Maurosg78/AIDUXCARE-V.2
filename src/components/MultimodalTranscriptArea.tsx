import { useState, useRef } from 'react';
import { Upload, Mic, MicOff, FileText } from 'lucide-react';

import { FileProcessorService } from '../services/FileProcessorService';
import { Button } from '../shared/ui';

interface MultimodalTranscriptAreaProps {
  transcript: string;
  setTranscript: (text: string) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  recordingTime: string;
}

export const MultimodalTranscriptArea: React.FC<MultimodalTranscriptAreaProps> = ({
  transcript,
  setTranscript,
  isRecording,
  onStartRecording,
  onStopRecording,
  recordingTime
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  };
  
  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    for (const file of files) {
      try {
        const processedText = await FileProcessorService.processFile(file);
        setTranscript(transcript + '\n\n' + processedText);
      } catch (error) {
        console.error('Error procesando archivo:', error);
      }
    }
    setIsProcessing(false);
  };
  
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));
    
    if (imageItems.length > 0) {
      e.preventDefault();
      const files = imageItems.map(item => item.getAsFile()).filter(Boolean) as File[];
      await processFiles(files);
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <h2 className="font-semibold mb-3">Entrada de Consulta</h2>
      
      {/* Timer */}
      <div className="text-4xl font-mono text-center py-2">
        {recordingTime}
      </div>
      
      {/* Botones */}
      <div className="flex gap-2 mb-3">
        <Button
          onClick={isRecording ? onStopRecording : onStartRecording}
          variant={isRecording ? 'destructive' : 'default'}
          className="flex-1"
        >
          {isRecording ? (
            <>
              <MicOff className="w-4 h-4 mr-1" />
              Detener
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-1" />
              Grabar
            </>
          )}
        </Button>
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          disabled={isProcessing}
          title="Subir archivo"
        >
          <Upload className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Área de texto */}
      <div
        className={`flex-1 relative border rounded-lg transition-all ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
      >
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          onPaste={handlePaste}
          placeholder="Opciones:
- Escribir directamente aquí
- Grabar audio con el botón 'Grabar'
- Arrastrar archivos aquí
- Pegar imágenes con Ctrl+V

Después presione 'Analizar con IA' →"
          className="w-full h-full p-2 text-sm bg-transparent resize-none focus:outline-none"
          disabled={isRecording}
        />
        
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-100 bg-opacity-90 rounded-lg">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
        )}
        
        {isProcessing && (
          <div className="absolute top-1 right-1 text-xs bg-yellow-100 px-2 py-1 rounded">
            Procesando...
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,audio/*,.pdf,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        <FileText className="w-3 h-3 inline mr-1" />
        Soporta: Imágenes, Audio, PDF, Texto
      </div>
    </div>
  );
};
