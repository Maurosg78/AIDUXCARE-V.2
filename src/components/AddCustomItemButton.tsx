import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AddCustomItemButtonProps {
  onAdd: (text: string) => void;
  placeholder?: string;
}

export const AddCustomItemButton: React.FC<AddCustomItemButtonProps> = ({
  onAdd,
  placeholder
}) => {
  const { t } = useLanguage();
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
        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
      >
        <Plus className="w-4 h-4" />
        {t.addItem}
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={newText}
        onChange={(e) => setNewText(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        placeholder={placeholder || t.addItem}
        className="flex-1 px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      <button
        onClick={handleAdd}
        className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        onClick={handleCancel}
        className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
