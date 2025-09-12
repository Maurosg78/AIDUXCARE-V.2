import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface EditableCheckboxProps {
  id: string;
  text: any; // Acepta CUALQUIER tipo
  checked: boolean;
  onToggle: (id: string) => void;
  className?: string;
}

export const EditableCheckbox: React.FC<EditableCheckboxProps> = ({
  id,
  text,
  checked,
  onToggle,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  
  // Función transversal para convertir CUALQUIER dato a string
  const safeRenderText = (data: any): string => {
    // Si es string, retornarlo
    if (typeof data === 'string') return data;
    
    // Si es objeto con propiedades específicas, extraerlas
    if (typeof data === 'object' && data !== null) {
      // Caso 1: {phrase: "...", context: "..."}
      if (data.phrase) return data.phrase;
      
      // Caso 2: {flag: "...", details: "..."}
      if (data.flag && data.details) {
        return `${data.flag}: ${data.details}`;
      }
      if (data.flag) return data.flag;
      
      // Caso 3: {text: "..."}
      if (data.text) return data.text;
      
      // Caso 4: {name: "...", description: "..."}
      if (data.name) {
        return data.description ? `${data.name}: ${data.description}` : data.name;
      }
      
      // Caso genérico: convertir a JSON
      try {
        return JSON.stringify(data);
      } catch {
        return '[Complex Object]';
      }
    }
    
    // Caso null/undefined
    if (data === null || data === undefined) return '';
    
    // Cualquier otro caso
    return String(data);
  };
  
  const displayText = safeRenderText(text);
  
  const handleEdit = () => {
    setEditedText(displayText);
    setIsEditing(true);
  };

  const handleSave = () => {
    // Aquí guardarías el texto editado
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedText('');
  };

  return (
    <div className="flex items-center gap-2 py-1">
      <button
        onClick={() => onToggle(id)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
          checked 
            ? 'bg-blue-500 border-blue-500' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" />}
      </button>
      
      {isEditing ? (
        <div className="flex gap-2 flex-1">
          <input
            type="text"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="flex-1 px-2 py-1 border rounded text-sm"
            autoFocus
          />
          <button 
            onClick={handleSave}
            className="text-xs px-2 py-1 bg-green-500 text-white rounded"
          >
            Save
          </button>
          <button 
            onClick={handleCancel}
            className="text-xs px-2 py-1 bg-gray-300 rounded"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div 
          className={`flex-1 text-sm cursor-pointer hover:bg-gray-50 px-1 rounded ${className}`}
          onDoubleClick={handleEdit}
        >
          <span>{displayText}</span>
        </div>
      )}
    </div>
  );
};
