import React from 'react';
import { Brain, Sparkles } from 'lucide-react';

interface ChunkingProgressProps {
  progress: number;
  message: string;
  isVisible: boolean;
}

export const ChunkingProgress: React.FC<ChunkingProgressProps> = ({ 
  progress, 
  message, 
  isVisible 
}) => {
  if (!isVisible) return null;
  
  return (
    <div className="w-full p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <Brain className="w-6 h-6 text-blue-600" />
          {progress > 50 && (
            <Sparkles className="w-3 h-3 text-purple-500 absolute -top-1 -right-1 animate-pulse" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 font-medium">{message}</span>
            <span className="text-blue-600 font-bold">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <p className="text-xs text-gray-600 mt-2">
        Procesando anamnesis extensa en secciones para máxima precisión clínica
      </p>
    </div>
  );
};
