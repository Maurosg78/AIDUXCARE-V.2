/**
 * WO-FLOW-005: Session-first Follow-up Execution UI
 * 
 * Transforma el follow-up en pantalla de ejecución clínica.
 * El profesional ejecuta durante la sesión, no documenta.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, X, ChevronDown, ChevronUp, CheckCircle, Plus } from 'lucide-react';
import type { TodayFocusItem } from '../../utils/parsePlanToFocus';

export interface SuggestedFocusEditorProps {
  items: TodayFocusItem[];
  onChange: (items: TodayFocusItem[]) => void;
  onFinishSession?: () => void; // Callback para cambiar a tab SOAP
  hideHeader?: boolean; // WO-07: Para evitar header duplicado cuando se usa desde bloque externo
  /** When true, show block even when empty and allow adding new items. */
  allowAdd?: boolean;
}

function newFocusItemId(): string {
  return `added-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const SuggestedFocusEditor: React.FC<SuggestedFocusEditorProps> = ({
  items: initialItems,
  onChange,
  onFinishSession,
  hideHeader = false,
  allowAdd = false,
}) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<TodayFocusItem[]>(initialItems.map(item => ({
    ...item,
    completed: item.completed ?? false,
  })));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string>('');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');

  // Sincronizar cuando initialItems cambia (ej: nuevo plan parseado)
  useEffect(() => {
    setItems(initialItems.map(item => ({
      ...item,
      completed: item.completed ?? false,
    })));
  }, [initialItems]);

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

  const handleToggleCompleted = (id: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(updated);
    onChange(updated);
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, notes: notes.trim() || undefined } : item
    );
    setItems(updated);
    onChange(updated);
  };

  const handleToggleNotes = (id: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNotes(newExpanded);
  };

  const handleRemove = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    onChange(updated);
  };

  const handleAddNew = () => {
    const label = newItemLabel.trim();
    if (!label) return;
    const newItem: TodayFocusItem = {
      id: newFocusItemId(),
      label,
      completed: false,
      source: 'plan',
    };
    const updated = [...items, newItem];
    setItems(updated);
    onChange(updated);
    setNewItemLabel('');
    setIsAddingNew(false);
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewItemLabel('');
  };

  const handleFinishSession = () => {
    onFinishSession?.();
  };

  if (items.length === 0 && !allowAdd) {
    return null;
  }

  return (
    <div className={`${hideHeader ? '' : 'mb-6 bg-white border border-slate-200 rounded-lg p-6 shadow-sm'}`}>
      {/* WO-07: Header eliminado cuando hideHeader=true para evitar duplicación */}
      {!hideHeader && (
        <div className="flex items-start gap-2 mb-1">
          <span className="text-lg">🗓️</span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900 font-apple">
              In-clinic treatment (proposed for today)
            </h2>
            <p className="text-sm text-slate-600 font-apple font-light mt-1">
              Proposed for this session. Modify as needed. Check when performed in clinic today. Add notes (dictated or typed) per item if needed.
            </p>
          </div>
        </div>
      )}

      {/* Checklist */}
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const isNotesExpanded = expandedNotes.has(item.id);
          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 py-2 px-3 rounded-lg border-b border-slate-100 last:border-b-0 transition-colors ${
                item.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white'
              }`}
            >
              {/* Checkbox / Check verde */}
              {item.completed ? (
                <button
                  onClick={() => handleToggleCompleted(item.id)}
                  className="mt-1 flex-shrink-0"
                    title={t('workflow.treatment.performedInClinic')}
                >
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </button>
              ) : (
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => handleToggleCompleted(item.id)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  title="Check when performed in clinic today"
                />
              )}

              {/* Activity content */}
              <div className="flex-1 min-w-0">
                {editingId === item.id ? (
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
                    className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-apple"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-start gap-2">
                    <span
                      className={`flex-1 text-sm font-apple ${
                        item.completed
                          ? 'text-green-800 font-medium'
                          : 'text-slate-900'
                      }`}
                      onClick={() => handleEditLabel(item.id)}
                      style={{ cursor: 'text' }}
                    >
                      {item.completed && (
                        <span className="inline-flex items-center gap-1 mr-2">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        </span>
                      )}
                      {item.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditLabel(item.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors"
                        title={t('workflow.treatment.editItem')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {items.length > 1 && (
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title={t('workflow.treatment.removeItem')}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes (collapsible) */}
                {(item.notes || isNotesExpanded) && (
                  <div className="mt-2">
                    <button
                      onClick={() => handleToggleNotes(item.id)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-apple font-light mb-1"
                    >
                      {isNotesExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      <span>{t('workflow.treatment.notesLabel')}</span>
                    </button>
                    {isNotesExpanded && (
                      <textarea
                        value={item.notes || ''}
                        onChange={(e) => handleUpdateNotes(item.id, e.target.value)}
                        placeholder={t('workflow.treatment.notesPlaceholder')}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-apple resize-none"
                        rows={2}
                      />
                    )}
                  </div>
                )}

                {/* Expand notes button (if no notes yet) */}
                {!item.notes && !isNotesExpanded && (
                  <button
                    onClick={() => handleToggleNotes(item.id)}
                    className="mt-1 text-xs text-slate-400 hover:text-slate-600 font-apple font-light"
                  >
                    ▸ Notes (optional — dictated or typed)
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add item row (when allowAdd) */}
        {allowAdd && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            {isAddingNew ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNew();
                    if (e.key === 'Escape') handleCancelAdd();
                  }}
                  placeholder={t('workflow.treatment.newTreatmentPlaceholder')}
                  className="flex-1 px-2 py-1.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-apple"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddNew}
                  disabled={!newItemLabel.trim()}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={handleCancelAdd}
                  className="px-2 py-1.5 text-sm text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-apple"
              >
                <Plus className="w-4 h-4" />
                Add treatment item
              </button>
            )}
          </div>
        )}
      </div>

      {/* WO-06: Finish session button removed - now handled by main action button */}
    </div>
  );
};
