/**
 * Modal for confirming note signature
 * Shows SOAP preview and warning about irreversible action
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export interface SignNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  note: {
    id: string;
    patientName: string;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    createdAt: Date | string;
  };
  isLoading?: boolean;
}

export const SignNoteModal: React.FC<SignNoteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  note,
  isLoading = false
}) => {
  // Validate SOAP fields
  const isComplete = Boolean(
    note.subjective?.trim() &&
    note.objective?.trim() &&
    note.assessment?.trim() &&
    note.plan?.trim()
  );

  const handleConfirm = async () => {
    if (!isComplete || isLoading) return;
    
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handled by parent component
      console.error('Sign confirmation failed:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sign Clinical Note</DialogTitle>
          <DialogDescription>
            Review the note before signing. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">
              Warning: Irreversible Action
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Once signed, this note cannot be edited or modified. Ensure all information is accurate.
            </p>
          </div>
        </div>

        {/* Validation Error */}
        {!isComplete && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-900">
              Incomplete SOAP Note
            </p>
            <p className="text-sm text-red-700 mt-1">
              All SOAP fields (Subjective, Objective, Assessment, Plan) must be completed before signing.
            </p>
          </div>
        )}

        {/* Note Preview */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Patient</p>
            <p className="text-base text-gray-900">{note.patientName}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">Date</p>
            <p className="text-base text-gray-900">
              {new Date(note.createdAt).toLocaleDateString('en-CA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* SOAP Preview */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-gray-700">Subjective</p>
              <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                {note.subjective || <em className="text-gray-500">Not provided</em>}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700">Objective</p>
              <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                {note.objective || <em className="text-gray-500">Not provided</em>}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700">Assessment</p>
              <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                {note.assessment || <em className="text-gray-500">Not provided</em>}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700">Plan</p>
              <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                {note.plan || <em className="text-gray-500">Not provided</em>}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isComplete || isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Signing...' : 'Sign Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
