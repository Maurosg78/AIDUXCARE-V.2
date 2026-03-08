/**
 * WO-FU-PLAN-SPLIT-01: Home Exercise Program (HEP) block
 * Checkboxes + notes + editable (same UX as in-clinic) so physio can select what goes to Vertex follow-up.
 */

import React, { useState, useEffect } from 'react';
import { Edit2, X, ChevronDown, ChevronUp, CheckCircle, Plus } from 'lucide-react';
import type { TodayFocusItem } from '../../utils/parsePlanToFocus';

export interface HomeProgramBlockProps {
  items: TodayFocusItem[];
  onChange: (items: TodayFocusItem[]) => void;
  /** When true, show block even when empty and allow adding new exercises. */
  allowAdd?: boolean;
  /** WO-SELECT-ALL-001: when provided, show "All done" checkbox in header. */
  allDone?: boolean;
  onSelectAllClick?: () => void;
}

function newHepItemId(): string {
  return `hep-added-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const HomeProgramBlock: React.FC<HomeProgramBlockProps> = ({
  items: initialItems,
  onChange,
  allowAdd = false,
  allDone = false,
  onSelectAllClick,
}) => {
  const [items, setItems] = useState<TodayFocusItem[]>(initialItems.map(item => ({
    ...item,
    completed: item.completed ?? false,
  })));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string>('');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');

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
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedNotes(newExpanded);
  };

  const handleRemove = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    onChange(updated);
    if (editingId === id) {
      setEditingId(null);
      setEditingLabel('');
    }
  };

  const handleAddNew = () => {
    const label = newItemLabel.trim();
    if (!label) return;
    const newItem: TodayFocusItem = {
      id: newHepItemId(),
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

  if (items.length === 0 && !allowAdd) {
    return null;
  }

  return (
    <div className="mb-6 bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-start gap-2 mb-1">
        <span className="text-lg">🏠</span>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900 font-apple">
            Home Exercise Program (HEP)
          </h2>
          <p className="text-sm text-slate-600 font-apple font-light mt-1">
            Prescribed for home. Check to include in this follow-up. Edit as needed. Add notes (dictated or typed) per item if needed.
          </p>
        </div>
        {onSelectAllClick != null && (
          <button
            type="button"
            onClick={onSelectAllClick}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors flex-shrink-0"
            title={allDone ? 'Unmark all' : 'Mark all as done'}
          >
            <input
              type="checkbox"
              checked={allDone}
              readOnly
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span>All done</span>
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const isNotesExpanded = expandedNotes.has(item.id);
          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 py-2 px-3 rounded-lg border-b border-slate-100 last:border-b-0 transition-colors ${
                item.completed ? 'bg-green-50 border-green-200' : 'bg-white'
              }`}
            >
              {item.completed ? (
                <button
                  onClick={() => handleToggleCompleted(item.id)}
                  className="mt-1 flex-shrink-0"
                  title="Included in follow-up — click to uncheck"
                >
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </button>
              ) : (
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => handleToggleCompleted(item.id)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  title="Check to include in this follow-up"
                />
              )}

              <div className="flex-1 min-w-0">
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editingLabel}
                    onChange={(e) => setEditingLabel(e.target.value)}
                    onBlur={() => handleSaveLabel(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveLabel(item.id);
                      else if (e.key === 'Escape') handleCancelEdit();
                    }}
                    className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-apple"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-start gap-2">
                    <span
                      className={`flex-1 text-sm font-apple ${
                        item.completed ? 'text-green-800 font-medium' : 'text-slate-900'
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
                        title="Edit exercise"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {items.length > 1 && (
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove exercise"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {(item.notes || isNotesExpanded) && (
                  <div className="mt-2">
                    <button
                      onClick={() => handleToggleNotes(item.id)}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 font-apple font-light mb-1"
                    >
                      {isNotesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      <span>Notes (dictated or typed)</span>
                    </button>
                    {isNotesExpanded && (
                      <textarea
                        value={item.notes || ''}
                        onChange={(e) => handleUpdateNotes(item.id, e.target.value)}
                        placeholder="Add notes (dictated or typed)..."
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-apple resize-none"
                        rows={2}
                      />
                    )}
                  </div>
                )}
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
                  placeholder="New exercise (e.g. Lumbar mobility, Core activation)"
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
                Add exercise
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
