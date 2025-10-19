import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

export interface AddCustomItemButtonProps {
  onAdd: (text: string) => void;

  // UI (i18n-ready: puedes mapear estas props a claves si usas un hook i18n externo)
  placeholder?: string;            // default: "Add a custom item…"
  labelAddButton?: string;         // default: "Add"
  labelOpenComposer?: string;      // default: "Add custom item"

  // Config
  maxLength?: number;              // default: 256
  analyticsCategory?: string;      // default: "CustomItem"
}

/** Sanitiza entrada según contrato SoT: trim → strip tags → normalize spaces → truncate */
export const sanitizeText = (raw: string, maxLength = 256): string => {
  return raw
    .trim()
    .replace(/<[^>]*>/g, '')     // strip HTML tags (XSS prevention)
    .replace(/\s+/g, ' ')        // normalize whitespace
    .slice(0, maxLength);
};

const fireAnalytics = (evt: string, payload: Record<string, unknown>) => {
  // Mínimo acoplamiento: CustomEvent. Tu capa de analytics puede escuchar 'aidux:analytics'
  try {
    window.dispatchEvent(new CustomEvent('aidux:analytics', { detail: { evt, ...payload } }));
  } catch {
    // no-op en SSR/tests
  }
};

export const AddCustomItemButton: React.FC<AddCustomItemButtonProps> = ({
  onAdd,
  placeholder = 'Add a custom item…',
  labelAddButton = 'Add',
  labelOpenComposer = 'Add custom item',
  maxLength = 256,
  analyticsCategory = 'CustomItem',
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');

  const open = () => {
    setIsAdding(true);
    fireAnalytics(`${analyticsCategory}:open`, { context: 'ui', ts: Date.now() });
  };

  const handleAdd = () => {
    const cleaned = sanitizeText(newText, maxLength);
    if (cleaned.length === 0) return;
    onAdd(cleaned);
    fireAnalytics(`${analyticsCategory}:add`, {
      length: cleaned.length,
      trimmed: cleaned.length !== newText.length,
      maxLength,
      ts: Date.now(),
    });
    setNewText('');
    setIsAdding(false);
  };

  const handleCancel = () => {
    const hadText = newText.trim().length > 0;
    setNewText('');
    setIsAdding(false);
    fireAnalytics(`${analyticsCategory}:cancel`, { hadText, ts: Date.now() });
  };

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={open}
        className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={labelOpenComposer}
      >
        <Plus className="h-3 w-3" aria-hidden="true" />
        {labelOpenComposer}
      </button>
    );
  }

  const cleanedPreview = sanitizeText(newText, maxLength);
  const canAdd = cleanedPreview.length > 0;

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
        aria-label="Custom item text"
        className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
        maxLength={Math.max(maxLength * 2, maxLength)} // permite teclear, igual truncamos al guardar
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={!canAdd}
        className={`px-2 py-1 text-sm rounded text-white ${
          canAdd ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'
        }`}
        aria-disabled={!canAdd}
        aria-label={labelAddButton}
      >
        {labelAddButton}
      </button>
      <button
        type="button"
        onClick={handleCancel}
        className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        aria-label="Cancel"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export default AddCustomItemButton;
