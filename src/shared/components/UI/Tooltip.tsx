import React from 'react';
import { cn } from '@/lib/utils';

export type TooltipVariant = 'default' | 'outline' | 'filled';
export type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipProps {
  variant?: TooltipVariant;
  position?: TooltipPosition;
  content: string | undefined;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<TooltipVariant, string> = {
  default: 'bg-gray-900 text-white',
  outline: 'bg-transparent border border-gray-200 text-gray-900',
  filled: 'bg-primary-500 text-white',
};

const positionStyles: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
};

const arrowStyles: Record<TooltipPosition, string> = {
  top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-gray-900',
  right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-r-gray-900',
  bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-gray-900',
  left: 'right-0 top-1/2 -translate-y-1/2 translate-x-full border-l-gray-900',
};

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      variant = 'default',
      position = 'top',
      content,
      children,
      className,
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const baseStyles = 'absolute z-50 px-2 py-1 text-sm rounded shadow-lg whitespace-nowrap';

    return (
      <div
        ref={ref}
        className={cn('relative inline-block', className)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
        {isVisible && (
          <div
            className={cn(
              baseStyles,
              variantStyles[variant],
              positionStyles[position],
              className
            )}
            role="tooltip"
          >
            {content}
            <div
              className={cn(
                'absolute w-0 h-0 border-4 border-transparent',
                arrowStyles[position]
              )}
            />
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip'; 