/**
 * Tab Component - Design System
 * Consistent tab styling with primary gradient for active state
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: 'default' | 'underline';
}

export const Tab: React.FC<TabProps> = ({
  children,
  className,
  active = false,
  variant = 'default',
  ...props
}) => {
  const baseStyles = 'px-4 py-2 font-medium transition-all duration-200 rounded-lg';
  
  if (variant === 'underline') {
    return (
      <button
        className={cn(
          baseStyles,
          active
            ? 'text-primary-purple border-b-2 border-primary-purple bg-purple-50/50'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 border-b-2 border-transparent',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
  
  // Default variant with gradient background
  return (
    <button
      className={cn(
        baseStyles,
        active
          ? 'bg-gradient-primary text-gray-800 shadow-sm'
          : 'text-gray-600 hover:text-gray-800 hover:bg-purple-50/50',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Tab;

