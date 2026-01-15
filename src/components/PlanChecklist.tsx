/**
 * PlanChecklist.tsx
 * 
 * Interactive checklist for SOAP Plan section.
 * Prevents hallucinations by only showing documented items.
 * 
 * @author AiduxCare Engineering
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface PlanItem {
  id: string;
  text: string;
  completed: boolean;
  category: 'intervention' | 'modality' | 'exercise' | 'followup' | 'education' | 'goal';
  addedBy: 'ai' | 'user'; // Track source
  timestamp: number;
}

interface PlanChecklistProps {
  initialItems?: PlanItem[];
  evaluationTests?: any[]; // Tests documentados en Phase 2
  onChange: (items: PlanItem[]) => void;
  onValidate?: (warnings: string[]) => void;
  readOnly?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PlanChecklist({
  initialItems = [],
  evaluationTests = [],
  onChange,
  onValidate,
  readOnly = false
}: PlanChecklistProps) {
  const [items, setItems] = useState<PlanItem[]>(initialItems);
  const [newItemText, setNewItemText] = useState('');
  const [activeCategory, setActiveCategory] = useState<PlanItem['category'] | null>(null);
  const [showAsText, setShowAsText] = useState(false);

  // Validate items against documented tests
  useEffect(() => {
    const warnings = validateAgainstDocumentation(items, evaluationTests);
    if (onValidate && warnings.length > 0) {
      onValidate(warnings);
    }
  }, [items, evaluationTests, onValidate]);

  // Sync with parent
  useEffect(() => {
    onChange(items);
  }, [items, onChange]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleToggle = (id: string) => {
    if (readOnly) return;
    
    const updated = items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setItems(updated);
  };

  const handleAdd = (category: PlanItem['category']) => {
    if (readOnly) return;
    if (!newItemText.trim()) return;

    const newItem: PlanItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      text: newItemText.trim(),
      completed: true, // Default to checked
      category,
      addedBy: 'user',
      timestamp: Date.now()
    };

    const updated = [...items, newItem];
    setItems(updated);
    setNewItemText('');
    setActiveCategory(null);
  };

  const handleDelete = (id: string) => {
    if (readOnly) return;
    
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
  };

  // ========================================================================
  // UTILITIES
  // ========================================================================

  const getItemsByCategory = (category: PlanItem['category']) =>
    items.filter(item => item.category === category);

  const exportAsText = (): string => {
    const sections: Record<PlanItem['category'], string[]> = {
      intervention: [],
      modality: [],
      exercise: [],
      followup: [],
      education: [],
      goal: []
    };

    items.forEach(item => {
      if (item.completed) {
        sections[item.category].push(item.text);
      }
    });

    let text = '';

    if (sections.intervention.length > 0) {
      text += 'Interventions:\n';
      sections.intervention.forEach(item => text += `- ${item}\n`);
      text += '\n';
    }

    if (sections.modality.length > 0) {
      text += 'Modalities:\n';
      sections.modality.forEach(item => text += `- ${item}\n`);
      text += '\n';
    }

    if (sections.exercise.length > 0) {
      text += 'Home Exercise Program:\n';
      sections.exercise.forEach(item => text += `- ${item}\n`);
      text += '\n';
    }

    if (sections.education.length > 0) {
      text += 'Patient Education:\n';
      sections.education.forEach(item => text += `- ${item}\n`);
      text += '\n';
    }

    if (sections.goal.length > 0) {
      text += 'Goals:\n';
      sections.goal.forEach(item => text += `- ${item}\n`);
      text += '\n';
    }

    if (sections.followup.length > 0) {
      text += 'Follow-up:\n';
      sections.followup.forEach(item => text += `- ${item}\n`);
    }

    return text.trim();
  };

  // ========================================================================
  // RENDER CATEGORY
  // ========================================================================

  const renderCategory = (
    category: PlanItem['category'],
    title: string,
    description: string,
    icon?: React.ReactNode
  ) => {
    const categoryItems = getItemsByCategory(category);
    const hasItems = categoryItems.length > 0;

    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-2">
          {icon && <div className="mt-1">{icon}</div>}
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
          <span className="text-xs text-gray-400">
            {categoryItems.filter(i => i.completed).length} selected
          </span>
        </div>

        {/* Items */}
        {hasItems && (
          <div className="space-y-2 pl-6">
            {categoryItems.map(item => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg group',
                  'hover:bg-gray-50 transition-colors',
                  item.addedBy === 'ai' && 'border-l-2 border-blue-200'
                )}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => handleToggle(item.id)}
                  disabled={readOnly}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span
                  className={cn(
                    'flex-1 text-sm',
                    item.completed ? 'text-gray-900' : 'line-through text-gray-400'
                  )}
                >
                  {item.text}
                </span>
                
                {/* Source badge */}
                {item.addedBy === 'ai' && (
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                    AI
                  </span>
                )}
                
                {/* Delete button */}
                {!readOnly && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new item */}
        {!readOnly && (
          <div className="pl-6">
            {activeCategory === category ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd(category);
                    if (e.key === 'Escape') {
                      setActiveCategory(null);
                      setNewItemText('');
                    }
                  }}
                  placeholder={`Add ${title.toLowerCase()}...`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <button
                  onClick={() => handleAdd(category)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setActiveCategory(null);
                    setNewItemText('');
                  }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveCategory(category)}
                className="w-full flex items-center justify-start px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add {title}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  if (showAsText) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Plan (Text Format)
          </span>
          <button
            onClick={() => setShowAsText(false)}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center"
          >
            <Eye className="w-4 h-4 mr-2" />
            Show as Checklist
          </button>
        </div>
        
        <textarea
          value={exportAsText()}
          readOnly
          className="w-full min-h-[300px] p-4 border rounded-lg bg-gray-50 text-sm font-mono"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Treatment Plan (Interactive)
        </span>
        <button
          onClick={() => setShowAsText(true)}
          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center"
        >
          <EyeOff className="w-4 h-4 mr-2" />
          Show as Text
        </button>
      </div>

      {/* Categories */}
      <div className="space-y-6 p-4 border rounded-lg bg-white">
        
        {renderCategory(
          'intervention',
          'Interventions',
          'Primary treatment techniques and manual therapy'
        )}
        
        <div className="border-t my-4" />
        
        {renderCategory(
          'modality',
          'Modalities',
          'Therapeutic equipment (only if documented in evaluation)'
        )}
        
        <div className="border-t my-4" />
        
        {renderCategory(
          'exercise',
          'Home Exercise Program',
          'Exercises prescribed for independent practice'
        )}
        
        <div className="border-t my-4" />
        
        {renderCategory(
          'education',
          'Patient Education',
          'Topics discussed with patient'
        )}
        
        <div className="border-t my-4" />
        
        {renderCategory(
          'goal',
          'Goals',
          'Short-term and long-term treatment goals'
        )}
        
        <div className="border-t my-4" />
        
        {renderCategory(
          'followup',
          'Follow-up Plan',
          'Next steps and reassessment schedule'
        )}
        
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
        <span className="text-sm text-blue-700">
          <strong>{items.filter(i => i.completed).length}</strong> items selected
        </span>
        <span className="text-xs text-blue-600">
          {items.filter(i => i.addedBy === 'ai').length} from AI, {items.filter(i => i.addedBy === 'user').length} added manually
        </span>
      </div>
      
    </div>
  );
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateAgainstDocumentation(
  items: PlanItem[],
  evaluationTests: any[]
): string[] {
  const warnings: string[] = [];

  // Get documented modalities from evaluation tests
  const documentedModalities = evaluationTests
    .filter(t => t.category === 'modality' || t.type === 'modality')
    .map(t => t.name.toLowerCase());

  // Check if AI added modalities that weren't documented
  const aiModalities = items
    .filter(i => i.category === 'modality' && i.addedBy === 'ai')
    .map(i => i.text.toLowerCase());

  aiModalities.forEach(modality => {
    const wasDocumented = documentedModalities.some(doc =>
      modality.includes(doc) || doc.includes(modality)
    );

    if (!wasDocumented) {
      warnings.push(
        `⚠️ Modality "${modality}" suggested by AI but not documented in evaluation`
      );
    }
  });

  return warnings;
}

// ============================================================================
// HELPERS FOR INTEGRATION
// ============================================================================

/**
 * Parse text plan to checklist items
 */
export function parsePlanToItems(planText: string): PlanItem[] {
  const items: PlanItem[] = [];
  const lines = planText.split('\n').filter(line => line.trim());

  let currentCategory: PlanItem['category'] = 'intervention';

  lines.forEach(line => {
    const lower = line.toLowerCase();

    // Detect category headers
    if (lower.includes('intervention')) {
      currentCategory = 'intervention';
      return;
    }
    if (lower.includes('modalit')) {
      currentCategory = 'modality';
      return;
    }
    if (lower.includes('exercise') || lower.includes('hep')) {
      currentCategory = 'exercise';
      return;
    }
    if (lower.includes('education')) {
      currentCategory = 'education';
      return;
    }
    if (lower.includes('goal')) {
      currentCategory = 'goal';
      return;
    }
    if (lower.includes('follow-up') || lower.includes('reassess')) {
      currentCategory = 'followup';
      return;
    }

    // Skip empty categories
    if (lower.includes('none') && lower.length < 20) {
      return;
    }

    // Extract item text
    const text = line.replace(/^[-•*]\s*/, '').trim();
    if (text && text.length > 3) {
      items.push({
        id: `item-${Date.now()}-${Math.random()}`,
        text,
        completed: true,
        category: currentCategory,
        addedBy: 'ai',
        timestamp: Date.now()
      });
    }
  });

  return items;
}

/**
 * Export checklist items to text format
 */
export function exportItemsToText(items: PlanItem[]): string {
  const sections: Record<PlanItem['category'], string[]> = {
    intervention: [],
    modality: [],
    exercise: [],
    followup: [],
    education: [],
    goal: []
  };

  items.forEach(item => {
    if (item.completed) {
      sections[item.category].push(item.text);
    }
  });

  let text = '';

  if (sections.intervention.length > 0) {
    text += 'Interventions:\n';
    sections.intervention.forEach(item => text += `- ${item}\n`);
    text += '\n';
  }

  if (sections.modality.length > 0) {
    text += 'Modalities:\n';
    sections.modality.forEach(item => text += `- ${item}\n`);
    text += '\n';
  }

  if (sections.exercise.length > 0) {
    text += 'Home Exercise Program:\n';
    sections.exercise.forEach(item => text += `- ${item}\n`);
    text += '\n';
  }

  if (sections.education.length > 0) {
    text += 'Patient Education:\n';
    sections.education.forEach(item => text += `- ${item}\n`);
    text += '\n';
  }

  if (sections.goal.length > 0) {
    text += 'Goals:\n';
    sections.goal.forEach(item => text += `- ${item}\n`);
    text += '\n';
  }

  if (sections.followup.length > 0) {
    text += 'Follow-up:\n';
    sections.followup.forEach(item => text += `- ${item}\n`);
  }

  return text.trim();
}

