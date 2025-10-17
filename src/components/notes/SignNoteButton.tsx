/**
 * Button component for signing clinical notes
 * Only visible when note status is 'submitted'
 */

import { Button } from '@/components/ui/button';
import { PenLine } from 'lucide-react';

export interface SignNoteButtonProps {
  noteId: string;
  status: 'draft' | 'submitted' | 'signed';
  onClick: () => void;
  disabled?: boolean;
}

export const SignNoteButton: React.FC<SignNoteButtonProps> = ({
  status,
  onClick,
  disabled = false
}) => {
  // Only show button for submitted notes
  if (status !== 'submitted') {
    return null;
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="default"
      className="bg-green-600 hover:bg-green-700"
      aria-label="Sign clinical note"
    >
      <PenLine className="mr-2 h-4 w-4" />
      Sign Note
    </Button>
  );
};
