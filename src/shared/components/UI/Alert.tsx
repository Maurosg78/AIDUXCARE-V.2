import React from 'react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'default' | 'outline' | 'filled';
export type AlertColor = 'primary' | 'success' | 'warning' | 'error' | 'info';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  color?: AlertColor;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

const variantStyles: Record<AlertVariant, Record<AlertColor, string>> = {
  default: {
    primary: 'bg-primary-50 text-primary-800 border-primary-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  outline: {
    primary: 'bg-transparent text-primary-700 border-primary-500',
    success: 'bg-transparent text-green-700 border-green-500',
    warning: 'bg-transparent text-yellow-700 border-yellow-500',
    error: 'bg-transparent text-red-700 border-red-500',
    info: 'bg-transparent text-blue-700 border-blue-500',
  },
  filled: {
    primary: 'bg-primary-500 text-white border-transparent',
    success: 'bg-green-500 text-white border-transparent',
    warning: 'bg-yellow-500 text-white border-transparent',
    error: 'bg-red-500 text-white border-transparent',
    info: 'bg-blue-500 text-white border-transparent',
  },
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = 'default',
      color = 'primary',
      title,
      description,
      icon,
      className,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'relative w-full rounded-lg border p-4';

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant][color],
          className
        )}
        role="alert"
        {...props}
      >
        <div className="flex items-start gap-4">
          {icon && (
            <div className="mt-0.5">
              {icon}
            </div>
          )}
          <div className="flex-1">
            {title && (
              <h5 className="mb-1 font-medium leading-none tracking-tight">
                {title}
              </h5>
            )}
            {description && (
              <div className="text-sm">
                {description}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert'; 