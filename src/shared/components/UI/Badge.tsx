import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'default' | 'outline' | 'filled';
export type BadgeSize = 'sm' | 'md' | 'lg';
export type BadgeColor = 'primary' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: BadgeColor;
}

const variantStyles: Record<BadgeVariant, Record<BadgeColor, string>> = {
  default: {
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  },
  outline: {
    primary: 'bg-transparent border border-primary-500 text-primary-500',
    success: 'bg-transparent border border-green-500 text-green-500',
    warning: 'bg-transparent border border-yellow-500 text-yellow-500',
    error: 'bg-transparent border border-red-500 text-red-500',
    info: 'bg-transparent border border-blue-500 text-blue-500',
  },
  filled: {
    primary: 'bg-primary-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-base px-3 py-1',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      color = 'primary',
      className,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center font-medium rounded-full';

    return (
      <span
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant][color],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge'; 