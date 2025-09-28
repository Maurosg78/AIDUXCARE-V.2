// @ts-nocheck
import React from 'react';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    default: selected 
      ? 'bg-brand-in-100 text-brand-in-700 border border-brand-in-200 focus:ring-brand-in-500' 
      : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 focus:ring-slate-500',
    success: selected 
      ? 'bg-green-100 text-green-700 border border-green-200 focus:ring-green-500' 
      : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 focus:ring-green-500',
    warning: selected 
      ? 'bg-yellow-100 text-yellow-700 border border-yellow-200 focus:ring-yellow-500' 
      : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 focus:ring-yellow-500',
    danger: selected 
      ? 'bg-red-100 text-red-700 border border-red-200 focus:ring-red-500' 
      : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabledClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-pressed={selected}
      aria-label={label}
    >
      {label}
    </button>
  );
};