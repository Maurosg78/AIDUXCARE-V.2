/**
 * WO-FLOW-005: Componente de focos clínicos sugeridos editables
 * 
 * Muestra focos clínicos derivados del plan previo, permitiendo edición
 * para que el profesional ajuste según su juicio clínico.
 */

import React, { useState } from 'react';
import { Edit2, X } from 'lucide-react';
import type { TodayFocusItem } from '../../utils/parsePlanToFocus';

export interface SuggestedFocusEditorProps {
  items: TodayFocusItem[];
  onChange: (items: TodayFocusItem[]) => void;
}

export const SuggestedFocusEditor: React.FC<SuggestedFocusEditorProps> = ({
  items: initialItems,
  onChange,
}) => {
  const [items, setItems] = useState<TodayFocusItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string>('');

  const handleEditLabel = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setEditingId(id);
      setEditingLabel(item.label);
    }
  };

  const handleSaveLabel = (id: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, label: editingLabel.trim() || item.label } : item
    );
    setItems(updated);
    onChange(updated);
    setEditingId(null);
    setEditingLabel('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingLabel('');
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, notes: notes.trim() || undefined } : item
    );
    setItems(updated);
    onChange(updated);
  };

  const handleRemove = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    onChange(updated);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-2 mb-2">
        <span className="text-lg">🧭</span>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-blue-900 mb-1">
            Suggested focus for today
          </h2>
          <p className="text-xs text-blue-700 font-apple font-light">
            Based on previous session plan — adjust as needed
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg border border-blue-100 p-3"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1">
                {editingId === item.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      onBlur={() => handleSaveLabel(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveLabel(item.id);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <span className="flex-1 text-sm text-slate-900 font-apple">
                      {item.label}
                    </span>
                    <button
                      onClick={() => handleEditLabel(item.id)}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      title="Edit focus"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {items.length > 1 && (
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        title="Remove focus"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Notes field */}
            <div className="mt-2 pt-2 border-t border-blue-50">
              <label className="text-xs text-slate-600 font-apple font-light mb-1 block">
                Notes for today:
              </label>
              <textarea
                value={item.notes || ''}
                onChange={(e) => handleUpdateNotes(item.id, e.target.value)}
                placeholder="Add clinical notes or adjustments..."
                className="w-full px-2 py-1.5 text-xs border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-apple resize-none"
                rows={2}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
