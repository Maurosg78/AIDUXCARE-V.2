import React from 'react';
import { ClinicalNote } from '@/types/notes';
import { NoteStatusBadge } from '@/components/notes/NoteStatusBadge';
import { ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  note: ClinicalNote;
  isSelected: boolean;
  onClick: () => void;
}

export const NoteHistoryCard: React.FC<Props> = ({ note, isSelected, onClick }) => {
  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div 
      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm">
            {format(note.createdAt.toDate(), 'MMM dd, yyyy')}
          </span>
          <NoteStatusBadge status={note.status} />
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </div>
      
      <div className="text-sm text-gray-600 space-y-1">
        <div><strong>S:</strong> {truncateText(note.subjective)}</div>
        <div><strong>O:</strong> {truncateText(note.objective)}</div>
        <div><strong>A:</strong> {truncateText(note.assessment)}</div>
        <div><strong>P:</strong> {truncateText(note.plan)}</div>
      </div>
    </div>
  );
};
