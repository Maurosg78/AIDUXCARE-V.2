// @ts-nocheck
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface AddCustomItemButtonProps {
  onAdd: (text: string) => void;
  placeholder?: string;
}

export const AddCustomItemButton: React.FC<AddCustomItemButtonProps> = ({
  onAdd,
  placeholder = "Agregar item personalizado..."
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');

  const handleAdd = () => {
    if (newText.trim()) {
      onAdd(newText.trim());
      setNewText('');
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setNewText('');
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
      >
        <Plus className="h-3 w-3" />
        Agregar item
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
      <input
        type="text"
        value={newText}
        onChange={(e) => setNewText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAdd();
          if (e.key === 'Escape') handleCancel();
        }}
        placeholder={placeholder}
        className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      <button
        onClick={handleAdd}
        className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Agregar
      </button>
      <button
        onClick={handleCancel}
        className="p-1 text-gray-500 hover:text-gray-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default AddCustomItemButton;