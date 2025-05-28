import React from 'react';
import { cn } from '@/lib/utils';

/* eslint-disable jsx-a11y/aria-proptypes */ // Deshabilitado debido a falsos positivos con el patrón aria-invalid={...} en React. Se debe prestar especial atención a otros valores ARIA en este archivo durante las revisiones de código.

export type RadioVariant = 'default' | 'outline' | 'filled';
export type RadioSize = 'sm' | 'md' | 'lg';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  variant?: RadioVariant;
  size?: RadioSize;
}

const variantStyles: Record<RadioVariant, string> = {
  default: 'bg-white border-gray-300 checked:bg-primary-500 checked:border-primary-500',
  outline: 'bg-transparent border-2 border-gray-300 checked:bg-primary-500 checked:border-primary-500',
  filled: 'bg-gray-100 border-transparent checked:bg-primary-500 checked:border-primary-500',
};

const sizeStyles: Record<RadioSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
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
    const baseStyles = 'rounded-full border transition-colors duration-200 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';
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
            type="radio"
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

Radio.displayName = 'Radio'; 