/**
 * 📁 Professional Audio File Upload - Carga de Archivos de Audio
 * Componente para subir archivos de audio pregrabados para el workflow clínico
 * Tarea 1.1.1 del Roadmap MVP "Escucha Activa Clínica"
 */

import React, { useState, useCallback, useRef } from 'react';

import Button from '../ui/button';

interface AudioFileUploadProps {
  onFileSelect: (file: File) => void;
  onUploadComplete?: (audioBlob: Blob, fileName: string) => void;
  isProcessing?: boolean;
  className?: string;
  maxFileSizeMB?: number;
  acceptedFormats?: string[];
}

interface FileInfo {
  file: File;
  duration?: number;
  size: string;
  type: string;
  validationStatus: 'valid' | 'invalid' | 'validating';
  errorMessage?: string;
}

export const AudioFileUpload: React.FC<AudioFileUploadProps> = ({
  onFileSelect,
  onUploadComplete,
  isProcessing = false,
  className = '',
  maxFileSizeMB = 50, // 50MB máximo por defecto
  acceptedFormats = ['.mp3', '.wav', '.m4a', '.ogg', '.webm']
}) => {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  /**
   * Valida el archivo de audio seleccionado
   */
  const validateAudioFile = useCallback(async (file: File): Promise<FileInfo> => {
    const fileInfo: FileInfo = {
      file,
      size: formatFileSize(file.size),
      type: file.type || 'Desconocido',
      validationStatus: 'validating'
    };

    // Validar tamaño
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      return {
        ...fileInfo,
        validationStatus: 'invalid',
        errorMessage: `El archivo excede el tamaño máximo de ${maxFileSizeMB}MB`
      };
    }

    // Validar formato
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      return {
        ...fileInfo,
        validationStatus: 'invalid',
        errorMessage: `Formato no soportado. Use: ${acceptedFormats.join(', ')}`
      };
    }

    // Validar que es un archivo de audio válido
    try {
      const duration = await getAudioDuration(file);
      return {
        ...fileInfo,
        duration,
        validationStatus: 'valid'
      };
    } catch (_error) {
      return {
        ...fileInfo,
        validationStatus: 'invalid',
        errorMessage: 'No se pudo procesar el archivo de audio'
      };
    }
  }, [maxFileSizeMB, acceptedFormats]);

  /**
   * Obtiene la duración del archivo de audio
   */
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration);
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        reject(new Error('Error al cargar el archivo de audio'));
      });
      
      audio.src = url;
    });
  };

  /**
   * Formatea el tamaño del archivo
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Formatea la duración en formato mm:ss
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Maneja la selección de archivo
   */
  const handleFileSelect = useCallback(async (file: File) => {
    const validatedFile = await validateAudioFile(file);
    setSelectedFile(validatedFile);

    if (validatedFile.validationStatus === 'valid') {
      // Crear URL para preview
      const previewUrl = URL.createObjectURL(file);
      setAudioPreviewUrl(previewUrl);
      
      // Notificar al padre
      onFileSelect(file);
    } else {
      setAudioPreviewUrl(null);
    }
  }, [validateAudioFile, onFileSelect]);

  /**
   * Maneja el cambio en el input de archivo
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  /**
   * Maneja el drag & drop
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(file => 
      file.type.startsWith('audio/') || 
      acceptedFormats.some(format => file.name.toLowerCase().endsWith(format))
    );

    if (audioFile) {
      handleFileSelect(audioFile);
    }
  }, [acceptedFormats, handleFileSelect]);

  /**
   * Abre el selector de archivos
   */
  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Procesa el archivo seleccionado
   */
  const processSelectedFile = useCallback(() => {
    if (selectedFile?.validationStatus === 'valid') {
      const blob = new Blob([selectedFile.file], { type: selectedFile.file.type });
      onUploadComplete?.(blob, selectedFile.file.name);
    }
  }, [selectedFile, onUploadComplete]);

  /**
   * Limpia la selección actual
   */
  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [audioPreviewUrl]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-aidux-blue-slate mb-2">
          📁 Carga de Archivo de Audio
        </h3>
        <p className="text-sm text-gray-600">
          Sube un archivo de audio pregrabado para procesamiento con IA
        </p>
      </div>

      {/* Área de carga */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragOver 
            ? 'border-aidux-coral bg-coral-50' 
            : selectedFile?.validationStatus === 'valid'
            ? 'border-aidux-mint-green bg-mint-50'
            : selectedFile?.validationStatus === 'invalid'
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-aidux-coral hover:bg-gray-50'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={isProcessing}
          aria-label="Seleccionar archivo de audio"
          title="Seleccionar archivo de audio para procesar"
        />

        {!selectedFile ? (
          <>
            <div className="text-4xl mb-4">🎵</div>
            <div className="mb-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Arrastra tu archivo de audio aquí
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                o haz clic para seleccionar un archivo
              </p>
            </div>
            
            <Button
              onClick={openFileSelector}
              disabled={isProcessing}
              className="mb-4"
              variant="outline"
            >
              📂 Seleccionar Archivo
            </Button>
            
            <div className="text-xs text-gray-500 space-y-1">
              <div>Formatos soportados: {acceptedFormats.join(', ')}</div>
              <div>Tamaño máximo: {maxFileSizeMB}MB</div>
            </div>
          </>
        ) : (
          <div className="text-left">
            {/* Información del archivo */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {selectedFile.validationStatus === 'valid' ? '✅' : 
                   selectedFile.validationStatus === 'invalid' ? '❌' : '⏳'}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 truncate max-w-xs">
                    {selectedFile.file.name}
                  </h4>
                  <div className="text-sm text-gray-600 space-x-4">
                    <span>{selectedFile.size}</span>
                    <span>{selectedFile.type}</span>
                    {selectedFile.duration && (
                      <span>{formatDuration(selectedFile.duration)}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <Button
                onClick={clearSelection}
                variant="outline"
                className="text-xs"
                disabled={isProcessing}
              >
                ✕
              </Button>
            </div>

            {/* Estado de validación */}
            {selectedFile.validationStatus === 'invalid' && selectedFile.errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-red-500">❌</span>
                  <span className="text-sm text-red-700">{selectedFile.errorMessage}</span>
                </div>
              </div>
            )}

            {selectedFile.validationStatus === 'valid' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span className="text-sm text-green-700">Archivo válido - Listo para procesar</span>
                </div>
              </div>
            )}

                         {/* Preview del audio */}
             {audioPreviewUrl && selectedFile.validationStatus === 'valid' && (
               <div className="bg-gray-50 rounded-lg p-3 mb-4">
                 <div className="block text-xs font-medium text-gray-700 mb-2">
                   Vista previa:
                 </div>
                 <audio
                   ref={audioRef}
                   controls
                   src={audioPreviewUrl}
                   className="w-full"
                   preload="metadata"
                   aria-label={`Vista previa del archivo de audio: ${selectedFile.file.name}`}
                 >
                   <track kind="captions" srcLang="es" label="Sin subtítulos disponibles" />
                   Tu navegador no soporta el elemento de audio.
                 </audio>
               </div>
             )}

            {/* Botón de procesamiento */}
            {selectedFile.validationStatus === 'valid' && onUploadComplete && (
              <div className="flex justify-center">
                <Button
                  onClick={processSelectedFile}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      🚀 Procesar Audio
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Información técnica */}
      <div className="mt-4 flex justify-center text-xs text-gray-500">
        <span>🔒 Los archivos se procesan localmente con total privacidad</span>
      </div>
    </div>
  );
};

export default AudioFileUpload; 