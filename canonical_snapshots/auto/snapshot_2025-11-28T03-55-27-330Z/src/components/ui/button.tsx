// @ts-nocheck
import React from 'react';

import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'ghost' | 'gradient' | 'logout';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-apple';
  
  const variants = {
    // Primary: Main actions (Start Recording, Generate SOAP, etc.)
    primary: 'bg-gradient-primary hover:bg-gradient-primary-hover text-white font-semibold shadow-sm hover:shadow-md',
    
    // Secondary: Secondary actions (Save Draft, Preview, etc.)
    secondary: 'bg-gradient-secondary hover:bg-gradient-secondary-hover text-white font-medium shadow-sm hover:shadow-md',
    
    // Success: Positive actions (Finalize, Approve, Complete)
    success: 'bg-gradient-success hover:bg-gradient-success-hover text-white font-medium shadow-sm hover:shadow-md',
    
    // Warning: Warning actions (Review Required, etc.)
    warning: 'bg-gradient-warning hover:bg-gradient-warning-hover text-white font-medium shadow-sm hover:shadow-md',
    
    // Danger: Destructive actions (Delete, Remove, etc.)
    danger: 'bg-gradient-danger hover:bg-gradient-danger-hover text-white font-medium shadow-sm hover:shadow-md',
    
    // Info: Informational actions (Learn More, Info, etc.)
    info: 'bg-gradient-info hover:bg-gradient-info-hover text-white font-medium shadow-sm hover:shadow-md',
    
    // Outline: Secondary actions with border
    outline: 'border-2 border-primary-blue text-primary-blue hover:bg-primary-blue/5 font-semibold bg-white',
    
    // Ghost: Tertiary actions
    ghost: 'text-gray-600 hover:bg-gray-100 font-medium',
    
    // Gradient: Alias for primary (backward compatibility)
    gradient: 'bg-gradient-to-r from-primary-blue to-primary-purple hover:from-primary-blue-hover hover:to-primary-purple-hover text-white font-semibold shadow-sm hover:shadow-md',
    
    // Logout: Special intense gradient for logout
    logout: 'bg-gradient-logout hover:bg-gradient-logout-hover text-white font-medium shadow-sm hover:shadow-md',
  };

  const sizes = {
    // Mobile-friendly sizes: min 44px (iOS) / 48dp (Android)
    sm: 'h-11 min-h-[44px] px-4 py-2.5 text-sm', // 44px minimum for mobile
    md: 'h-12 min-h-[48px] px-5 py-3', // 48px for Android, comfortable for iOS
    lg: 'h-14 min-h-[56px] px-8 py-4 text-[15px]', // Larger for primary actions
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
