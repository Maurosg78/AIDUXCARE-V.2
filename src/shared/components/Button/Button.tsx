import React from 'react';
import { twMerge } from 'tailwind-merge';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-xl',
  };

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary-light',
    secondary: 'bg-secondary text-primary hover:bg-secondary-dark focus:ring-secondary-light',
    accent: 'bg-accent text-white hover:bg-accent-dark focus:ring-accent-light',
    success: 'bg-success text-white hover:bg-success-dark focus:ring-success-light',
    warning: 'bg-warning text-warning-text hover:bg-warning-dark focus:ring-warning-light border border-warning-border',
    error: 'bg-error text-error-text hover:bg-error-dark focus:ring-error-light border border-error-border',
    ghost: 'bg-transparent text-primary hover:bg-primary/10 focus:ring-primary-light',
  };

  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      className={twMerge(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        widthStyles,
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}; 