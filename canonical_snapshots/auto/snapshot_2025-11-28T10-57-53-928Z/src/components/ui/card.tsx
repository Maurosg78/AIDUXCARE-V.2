/**
 * Card Component - Design System
 * Consistent card styling with primary gradient accents
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'bordered';
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  ...props
}) => {
  const baseStyles = 'rounded-xl transition-all duration-200';
  
  const variants = {
    default: 'bg-white border border-gray-200 shadow-sm',
    gradient: 'bg-gradient-primary-light border border-purple-200/30 shadow-sm',
    bordered: 'bg-white border-2 border-purple-200 shadow-md'
  };
  
  const paddings = {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8'
  };
  
  return (
    <div
      className={cn(
        baseStyles,
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

