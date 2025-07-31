import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}

const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className,
  color = 'primary',
  size = 'md'
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const colors = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent',
    neutral: 'bg-neutral'
  };

  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div
      className={cn(
        'w-full bg-neutral-200 rounded-full overflow-hidden',
        sizes[size],
        className
      )}
    >
      <div
        className={cn(
          'h-full transition-all duration-300 ease-in-out',
          colors[color]
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export { Progress }; 