import React from 'react';
import { cn } from '@/lib/utils';

export type CheckboxVariant = 'default' | 'outline' | 'filled';
export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  variant?: CheckboxVariant;
  size?: CheckboxSize;
}

const variantStyles: Record<CheckboxVariant, string> = {
  default: 'bg-white border-gray-300 checked:bg-primary-500 checked:border-primary-500',
  outline: 'bg-transparent border-2 border-gray-300 checked:bg-primary-500 checked:border-primary-500',
  filled: 'bg-gray-100 border-transparent checked:bg-primary-500 checked:border-primary-500',
};

const sizeStyles: Record<CheckboxSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
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
    const baseStyles = 'rounded border transition-colors duration-200 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';
    const errorStyles = error
      ? 'border-red-500 focus:ring-red-500'
      : '';
    const disabledStyles = disabled
      ? 'cursor-not-allowed opacity-60'
      : '';

    return (
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2">
          <input
            ref={ref}
            type="checkbox"
            className={cn(
              baseStyles,
              variantStyles[variant],
              sizeStyles[size],
              errorStyles,
              disabledStyles,
              className
            )}
            disabled={disabled}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error || helperText
                ? `${props.id}-description`
                : undefined
            }
            {...props}
          />
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

Checkbox.displayName = 'Checkbox'; 