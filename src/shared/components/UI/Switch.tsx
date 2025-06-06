import React from 'react';
import { cn } from '@/lib/utils';

export type SwitchVariant = 'default' | 'outline' | 'filled';
export type SwitchSize = 'sm' | 'md' | 'lg';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  variant?: SwitchVariant;
  size?: SwitchSize;
}

const variantStyles: Record<SwitchVariant, string> = {
  default: 'bg-gray-200 peer-checked:bg-primary-500',
  outline: 'bg-transparent border-2 border-gray-300 peer-checked:bg-primary-500 peer-checked:border-primary-500',
  filled: 'bg-gray-100 peer-checked:bg-primary-500',
};

const sizeStyles: Record<SwitchSize, { track: string; thumb: string }> = {
  sm: {
    track: 'h-4 w-7',
    thumb: 'h-3 w-3 left-0.5 peer-checked:left-3.5',
  },
  md: {
    track: 'h-5 w-9',
    thumb: 'h-4 w-4 left-0.5 peer-checked:left-4.5',
  },
  lg: {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5 left-0.5 peer-checked:left-5.5',
  },
};

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      helperText,
      error,
      variant = 'default',
      size = 'md',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';
    const errorStyles = error
      ? 'border-red-500 focus:ring-red-500'
      : '';
    const disabledStyles = disabled
      ? 'cursor-not-allowed opacity-60'
      : '';

    return (
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2">
          <div className={cn(baseStyles, disabledStyles)}>
            <input
              ref={ref}
              type="checkbox"
              className="peer sr-only"
              disabled={disabled}
              aria-invalid={!!error}
              aria-describedby={
                error || helperText
                  ? `${props.id}-description`
                  : undefined
              }
              {...props}
            />
            <div
              className={cn(
                variantStyles[variant],
                sizeStyles[size].track,
                errorStyles
              )}
            />
            <div
              className={cn(
                'absolute rounded-full bg-white shadow-sm transition-transform duration-200',
                sizeStyles[size].thumb
              )}
            />
          </div>
          {label && (
            <span className="text-sm font-medium text-gray-700">
              {label}
            </span>
          )}
        </label>
        {(error || helperText) && (
          <p
            id={`${props.id}-description`}
            className={cn(
              'text-sm',
              error ? 'text-red-500' : 'text-gray-500'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch'; 