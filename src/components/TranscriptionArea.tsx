// @ts-nocheck
import React, { useState, useRef } from 'react';
import { Mic, MicOff, Brain, Camera, Upload, FileText, X } from 'lucide-react';

import { Card } from '../shared/ui';

interface TranscriptionAreaProps {
  transcript: string;
  setTranscript: (text: string) => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  recordingTime: string;
  isAnalyzing: boolean;
  isTranscribing: boolean;
  onAnalyze: () => void;
}

export const TranscriptionArea: React.FC<TranscriptionAreaProps> = ({
  transcript,
  setTranscript,
  isRecording,
  startRecording,
  stopRecording,
  recordingTime,
  isAnalyzing,
  isTranscribing,
  onAnalyze
}) => {
  const [attachments, setAttachments] = useState<Array<{name: string, type: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments = Array.from(files).map(file => ({
        name: file.name,
        type: file.type.includes('image') ? 'image' : 'document'
      }));
      setAttachments([...attachments, ...newAttachments]);
    }
  };

  const handleCamera = () => {
    // Lógica para captura de cámara
    console.log('Abrir cámara para escanear documento');
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Contenido de la Consulta</h3>
        <div className="flex items-center gap-3">
          {transcript.length > 0 && (
            <span className="text-xs text-gray-500">{transcript.split(' ').length} palabras</span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            {isExpanded ? 'Minimizar' : 'Expandir'}
          </button>
        </div>
      </div>

      <div className={`transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-48'} overflow-y-auto`}>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Escribe, dicta o pega el contenido de la consulta..."
          className="w-full h-full min-h-[150px] p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Archivos adjuntos */}
      {attachments.length > 0 && (
        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-1 px-2 py-1 bg-white border rounded-md text-xs">
                <FileText className="w-3 h-3 text-gray-500" />
                <span className="text-gray-700">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="ml-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barra de herramientas */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t">
        <div className="flex items-center gap-2">
          {/* Botón Grabar */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {isRecording ? recordingTime : 'Grabar'}
          </button>

          {/* Botón Cámara */}
          <button
            onClick={handleCamera}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Escanear documento"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Botón Adjuntar */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Adjuntar archivo"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />

          {isTranscribing && (
            <span className="text-xs text-gray-500 ml-2">Transcribiendo...</span>
          )}
        </div>

        {/* Botón Analizar */}
        <button
          onClick={onAnalyze}
          disabled={!transcript || isAnalyzing}
          className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Brain className="w-4 h-4" />
          {isAnalyzing ? 'Analizando...' : 'Analizar con IA'}
        </button>
      </div>
    </Card>
  );
};