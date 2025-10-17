/**
 * Badge component for displaying note status
 * Shows: Draft, Ready to Sign, or Signed
 */

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Edit3 } from 'lucide-react';

export interface NoteStatusBadgeProps {
  status: 'draft' | 'submitted' | 'signed';
  signedAt?: Date | string;
  className?: string;
}

export const NoteStatusBadge: React.FC<NoteStatusBadgeProps> = ({
  status,
  signedAt,
  className = ''
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'draft':
        return {
          variant: 'secondary' as const,
          icon: Edit3,
          label: 'Draft',
          className: 'bg-gray-100 text-gray-700 hover:bg-gray-100'
        };
      case 'submitted':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          label: 'Ready to Sign',
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
        };
      case 'signed':
        return {
          variant: 'secondary' as const,
          icon: CheckCircle2,
          label: 'Signed',
          className: 'bg-green-100 text-green-800 hover:bg-green-100'
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const getTooltip = () => {
    if (status === 'signed' && signedAt) {
      const date = new Date(signedAt);
      return `Signed on ${date.toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    }
    return null;
  };

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className}`}
      title={getTooltip() || undefined}
    >
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
};
