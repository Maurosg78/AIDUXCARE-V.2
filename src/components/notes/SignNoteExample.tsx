/**
 * Example integration of Sign Note components
 * This shows how to use all components together
 */

import { useState } from 'react';
import { SignNoteButton } from './SignNoteButton';
import { SignNoteModal } from './SignNoteModal';
import { NoteStatusBadge } from './NoteStatusBadge';
import { useSignNote } from '@/hooks/useSignNote';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  status: 'draft' | 'submitted' | 'signed';
  patientName: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  createdAt: Date;
  signedAt?: Date;
}

export const SignNoteExample: React.FC<{ note: Note }> = ({ note: initialNote }) => {
  const [note, setNote] = useState(initialNote);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { signNote, isLoading } = useSignNote();
  const { toast } = useToast();

  const handleSignClick = () => {
    setIsModalOpen(true);
  };

  const handleSignConfirm = async () => {
    try {
      await signNote(note.id);
      
      // Update local state
      setNote(prev => ({
        ...prev,
        status: 'signed',
        signedAt: new Date()
      }));

      // Show success toast
      toast({
        title: 'Note signed successfully',
        description: 'The clinical note has been signed and is now read-only.',
        variant: 'default'
      });

      setIsModalOpen(false);
    } catch (error) {
      // Show error toast
      toast({
        title: 'Failed to sign note',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    }
  };

  const isReadOnly = note.status === 'signed';

  return (
    <div className="space-y-4">
      {/* Header with status and sign button */}
      <div className="flex items-center justify-between">
        <NoteStatusBadge 
          status={note.status} 
          signedAt={note.signedAt}
        />
        
        <SignNoteButton
          noteId={note.id}
          status={note.status}
          onClick={handleSignClick}
          disabled={isLoading}
        />
      </div>

      {/* Note content (example) */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div>
          <label className="text-sm font-medium text-gray-700">Patient</label>
          <p className="text-base text-gray-900">{note.patientName}</p>
        </div>

        {isReadOnly && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              ℹ️ This note is signed and cannot be edited
            </p>
          </div>
        )}

        {/* SOAP fields would go here */}
      </div>

      {/* Sign confirmation modal */}
      <SignNoteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSignConfirm}
        note={note}
        isLoading={isLoading}
      />
    </div>
  );
};
