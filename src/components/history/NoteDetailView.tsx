import React from 'react';
import { ClinicalNote } from '@/types/notes';
import { NoteStatusBadge } from '@/components/notes/NoteStatusBadge';
import { SignNoteButton } from '@/components/notes/SignNoteButton';
import Button from '@/components/ui/button';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  note: ClinicalNote;
  onClose: () => void;
}

const SOAPSection: React.FC<{ title: string; content: string }> = ({ title, content }) => (
  <div>
    <h4 className="font-semibold text-sm mb-2 text-gray-700">{title}</h4>
    <div className="text-sm text-gray-600 whitespace-pre-wrap">
      {content || <em className="text-gray-400">(Not provided)</em>}
    </div>
  </div>
);

export const NoteDetailView: React.FC<Props> = ({ note, onClose }) => {
  return (
    <div className="bg-white border-l border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Patient Note</h3>
          <p className="text-sm text-gray-500">
            {format(note.createdAt.toDate(), 'MMMM dd, yyyy - HH:mm')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <NoteStatusBadge status={note.status} />
          {note.status === 'submitted' && <SignNoteButton noteId={note.id} />}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* SOAP Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <SOAPSection title="Subjective" content={note.subjective} />
        <SOAPSection title="Objective" content={note.objective} />
        <SOAPSection title="Assessment" content={note.assessment} />
        <SOAPSection title="Plan" content={note.plan} />
      </div>

      {/* Footer info */}
      {note.signedHash && (
        <div className="p-4 border-t border-gray-200 text-sm text-gray-500">
          Note signed and secured with hash: {note.signedHash}
        </div>
      )}
    </div>
  );
};
