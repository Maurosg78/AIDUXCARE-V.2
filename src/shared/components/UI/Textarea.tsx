/**
 * 📝 TEXTAREA COMPONENT - AIDUXCARE DESIGN SYSTEM
 * Componente de área de texto con paleta oficial
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'clinical' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const baseStyles = 'border rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 resize-vertical min-h-[80px]';
    
    const variants = {
      default: 'border-neutral/30 bg-white focus:border-primary focus:ring-primary/20 text-primary placeholder:text-neutral/50',
      clinical: 'border-secondary/30 bg-secondary/5 focus:border-secondary focus:ring-secondary/20 text-primary placeholder:text-neutral/50',
      success: 'border-success/30 bg-success/5 focus:border-success focus:ring-success/20 text-primary placeholder:text-neutral/50',
      error: 'border-accent/30 bg-accent/5 focus:border-accent focus:ring-accent/20 text-primary placeholder:text-neutral/50',
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
    };

    return (
        <textarea
          className={cn(
            baseStyles,
          variants[variant],
          sizes[size],
            className
          )}
        ref={ref}
          {...props}
        />
    );
  }
);

Textarea.displayName = 'Textarea'; 

export { Textarea }; 