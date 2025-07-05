 // Deshabilitado debido a falsos positivos con el patrón aria-invalid={...} en React. Se debe prestar especial atención a otros valores ARIA en este archivo durante las revisiones de código.
import React from 'react';
import { cn } from '@/lib/utils';

export type TextareaVariant = 'default' | 'outline' | 'filled';
export type TextareaSize = 'sm' | 'md' | 'lg';

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  variant?: TextareaVariant;
  size?: TextareaSize;
  fullWidth?: boolean;
}

const variantStyles: Record<TextareaVariant, string> = {
  default: 'bg-white border-gray-300 focus:border-primary-500 focus:ring-primary-500',
  outline: 'bg-transparent border-2 border-gray-300 focus:border-primary-500 focus:ring-primary-500',
  filled: 'bg-gray-100 border-transparent focus:bg-white focus:border-primary-500 focus:ring-primary-500',
};

const sizeStyles: Record<TextareaSize, string> = {
  sm: 'text-sm py-1 px-2',
  md: 'text-base py-2 px-3',
  lg: 'text-lg py-3 px-4',
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      variant = 'default',
      size = 'md',
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'block w-full rounded-md shadow-sm transition-colors duration-200 resize-none';
    const errorStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : '';
    const disabledStyles = disabled
      ? 'bg-gray-100 cursor-not-allowed opacity-60'
      : '';

    return (
      <div className={cn('flex flex-col gap-1', fullWidth ? 'w-full' : 'w-fit')}>
        {label && (
          <label
            htmlFor={props.id}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            baseStyles,
            variantStyles[variant],
            sizeStyles[size],
            errorStyles,
            disabledStyles,
            className
          )}
          disabled={disabled}
          {...(error ? { 'aria-invalid': 'true' } : {})}
          aria-describedby={
            error || helperText
              ? `${props.id}-description`
              : undefined
          }
          {...props}
        />
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

Textarea.displayName = 'Textarea'; 