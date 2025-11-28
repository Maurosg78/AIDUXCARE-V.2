/**
 * Input Component - Design System
 * Consistent input styling with primary color focus
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  className,
  error = false,
  label,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseStyles = 'w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2';
  
  const styles = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50'
    : 'border-purple-200 focus:border-primary-purple focus:ring-purple-200 bg-white';
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(baseStyles, styles, className)}
        {...props}
      />
    </div>
  );
};

export default Input;

