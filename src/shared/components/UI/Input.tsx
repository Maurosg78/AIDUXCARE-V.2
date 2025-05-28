/* eslint-disable jsx-a11y/aria-proptypes */ // Deshabilitado debido a falsos positivos con el patrón aria-invalid={...} en React. Se debe prestar especial atención a otros valores ARIA en este archivo durante las revisiones de código.

import React, { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

export type InputVariant = 'default' | 'outline' | 'filled';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<InputVariant, string> = {
  default: 'bg-white border-gray-300 focus:border-primary focus:ring-primary',
  outline: 'bg-transparent border-2 border-primary focus:border-primary-dark focus:ring-primary',
  filled: 'bg-gray-50 border-transparent focus:bg-white focus:border-primary focus:ring-primary',
};

const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

const baseStyles = 'block w-full rounded-md shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  variant = 'default',
  size = 'md',
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = true,
  className,
  id,
  ...props
}, ref) => {
  const inputStyles = twMerge(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    leftIcon && 'pl-10',
    rightIcon && 'pr-10',
    error && 'border-error focus:border-error focus:ring-error',
    className
  );

  const containerStyles = twMerge(
    'relative',
    fullWidth ? 'w-full' : 'w-auto'
  );

  return (
    <div className={containerStyles}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={id}
          className={inputStyles}
          {...(error ? { 'aria-invalid': 'true' } : {})}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          {...props}
        />
      </div>
    </div>
  );
});