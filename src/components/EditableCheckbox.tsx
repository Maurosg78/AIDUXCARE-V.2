// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { Check, Edit2, X, Save } from 'lucide-react';

interface EditableCheckboxProps {
  id: string;
  text: string;
  checked: boolean;
  onToggle: (id: string) => void;
  onTextChange: (id: string, newText: string) => void;
  className?: string;
}

export const EditableCheckbox: React.FC<EditableCheckboxProps> = ({
  id,
  text,
  checked,
  onToggle,
  onTextChange,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editText.trim() && editText !== text) {
      onTextChange(id, editText.trim());
    } else {
      setEditText(text); // Revertir si está vacío
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(id)}
        className="h-4 w-4"
        disabled={isEditing}
      />
      
      {isEditing ? (
        <div className="flex items-center gap-1 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSave}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="Guardar"
          >
            <Save className="h-3 w-3" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Cancelar"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 flex-1">
          <span 
            className="text-sm flex-1 cursor-pointer"
            onClick={() => onToggle(id)}
          >
            {text}
          </span>
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Editar"
          >
            <Edit2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default EditableCheckbox;