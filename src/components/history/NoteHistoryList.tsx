import React from 'react';
import { ClinicalNote } from '@/types/notes';
import { NoteHistoryCard } from './NoteHistoryCard';
import { FileText } from 'lucide-react';

interface Props {
  notes: ClinicalNote[];
  onSelectNote: (note: ClinicalNote) => void;
  selectedNoteId?: string;
  loading?: boolean;
}

const NoteHistoryListSkeleton: React.FC = () => (
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="p-4 border rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="space-y-1">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    ))}
  </div>
);

export const NoteHistoryList: React.FC<Props> = ({ 
  notes, 
  onSelectNote, 
  selectedNoteId, 
  loading 
}) => {
  if (loading) {
    return <NoteHistoryListSkeleton />;
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <FileText className="h-12 w-12 mb-4" />
        <p>No notes found for this patient</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {notes.map(note => (
        <NoteHistoryCard
          key={note.id}
          note={note}
          isSelected={selectedNoteId === note.id}
          onClick={() => onSelectNote(note)}
        />
      ))}
    </div>
  );
};
