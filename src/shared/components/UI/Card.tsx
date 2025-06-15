/**
 * 🃏 CARD COMPONENT - AIDUXCARE DESIGN SYSTEM
 * Componentes de tarjeta con variantes usando la paleta oficial AiDuxCare
 */

import React from 'react';
import { cn } from '@/lib/utils';

export type CardVariant = 'default' | 'clinical' | 'benefit' | 'outline' | 'filled';
export type CardSize = 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  size?: CardSize;
  fullWidth?: boolean;
  hover?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  // Tarjeta por defecto - Blanco con borde sutil
  default: 'bg-white border border-neutral/20 shadow-sm',
  
  // Tarjeta clínica - Verde menta suave para contenido médico
  clinical: 'bg-background border border-secondary/30 shadow-clinical',
  
  // Tarjeta de beneficio - Para página de bienvenida
  benefit: 'bg-white/80 border border-secondary/20 shadow-md backdrop-blur-sm',
  
  // Tarjeta outline - Solo borde
  outline: 'bg-transparent border-2 border-primary/20',
  
  // Tarjeta filled - Fondo sólido
  filled: 'bg-background border border-secondary/30',
};

const sizeStyles: Record<CardSize, string> = {
  sm: 'p-4 rounded-lg',
  md: 'p-6 rounded-xl',
  lg: 'p-8 rounded-2xl',
  xl: 'p-12 rounded-3xl',
};

const hoverStyles = 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer';

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      size = 'md',
      fullWidth = false,
      hover = false,
      className,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'transition-all duration-200';

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? 'w-full' : 'w-fit',
          hover && hoverStyles,
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-2 mb-4', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-semibold leading-tight text-primary', className)}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-base text-neutral/70 leading-relaxed', className)}
    {...props}
  />
));

CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('', className)}
    {...props}
  />
));

CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center justify-between pt-6 mt-6 border-t border-neutral/10', className)}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter'; 

// === COMPONENTES ESPECIALIZADOS PARA WIREFRAMES ===

// Tarjeta de beneficio (Página de Bienvenida)
export const BenefitCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}> = ({ children, className = '', hover = true }) => (
  <Card 
    variant="benefit" 
    size="lg" 
    hover={hover} 
    className={cn('text-center', className)}
  >
    {children}
  </Card>
);

// Tarjeta clínica (Ficha del Paciente)
export const ClinicalCard: React.FC<{
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}> = ({ title, children, className = '', actions }) => (
  <Card variant="clinical" size="md" fullWidth className={className}>
    {title && (
      <CardHeader>
        <CardTitle className="text-primary">{title}</CardTitle>
      </CardHeader>
    )}
    <CardContent>
      {children}
    </CardContent>
    {actions && (
      <CardFooter>
        {actions}
      </CardFooter>
    )}
  </Card>
);

// Tarjeta de información del paciente
export const PatientInfoCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <Card 
    variant="default" 
    size="md" 
    fullWidth 
    className={cn('border-l-4 border-l-accent', className)}
  >
    {children}
  </Card>
);

// Tarjeta de datos clínicos
export const ClinicalDataCard: React.FC<{
  title: string;
  children: React.ReactNode;
  status?: 'active' | 'completed' | 'review';
  className?: string;
}> = ({ title, children, status, className = '' }) => {
  const statusColors = {
    active: 'border-l-success bg-success/5',
    completed: 'border-l-intersection bg-intersection/5',
    review: 'border-l-warning bg-warning/5'
  };

  const statusStyle = status ? statusColors[status] : '';

  return (
    <Card 
      variant="default" 
      size="md" 
      fullWidth 
      className={cn('border-l-4', statusStyle, className)}
    >
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}; 