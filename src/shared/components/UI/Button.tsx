/**
 * 🔘 BUTTON COMPONENT - AIDUXCARE DESIGN SYSTEM
 * Componentes de botón con variantes y estados usando la paleta oficial
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const buttonVariants = {
  // Botón primario - Azul pizarra AiDuxCare
  primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary/20 shadow-sm hover:shadow-md active:scale-[0.98]',
  
  // Botón secundario - Verde intersección AiDuxCare
  secondary: 'bg-intersection text-white hover:bg-intersection/90 focus:ring-intersection/20 shadow-sm hover:shadow-md active:scale-[0.98]',
  
  // Botón outline - Borde con colores AiDuxCare
  outline: 'border-2 border-primary bg-white text-primary hover:bg-primary hover:text-white focus:ring-primary/20 hover:shadow-md active:scale-[0.98]',
  
  // Botón ghost - Solo texto
  ghost: 'text-primary hover:bg-primary/10 focus:ring-primary/20 active:scale-[0.98]',
  
  // Botón destructivo - Coral suave
  destructive: 'bg-accent text-white hover:bg-accent/90 focus:ring-accent/20 shadow-sm hover:shadow-md active:scale-[0.98]',
  
  // Botón success - Verde intersección
  success: 'bg-success text-white hover:bg-success/90 focus:ring-success/20 shadow-sm hover:shadow-md active:scale-[0.98]'
};

const buttonSizes = {
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-6 py-3 text-base rounded-xl',
  lg: 'px-8 py-4 text-lg rounded-xl',
  xl: 'px-12 py-5 text-xl rounded-2xl'
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';
  
  const variantClasses = buttonVariants[variant];
  const sizeClasses = buttonSizes[size];
  
  const combinedClasses = cn(
    baseClasses,
    variantClasses,
    sizeClasses,
    fullWidth && 'w-full',
    className
  );

  return (
    <button
      className={combinedClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-3"></div>
      )}
      {children}
    </button>
  );
};

// === COMPONENTES ESPECIALIZADOS PARA WIREFRAMES ===

// Botón CTA Principal (Página de Bienvenida)
export const CTAPrimaryButton: React.FC<Omit<ButtonProps, 'variant' | 'size'> & { 
  size?: 'lg' | 'xl';
  className?: string;
}> = ({ 
  size = 'xl', 
  className = '', 
  ...props 
}) => (
  <Button 
    variant="success" 
    size={size} 
    className={cn('hover:-translate-y-1 hover:shadow-2xl', className)} 
    {...props} 
  />
);

// Botón CTA Secundario (Página de Bienvenida)
export const CTASecondaryButton: React.FC<Omit<ButtonProps, 'variant' | 'size'> & { 
  size?: 'lg' | 'xl';
  className?: string;
}> = ({ 
  size = 'xl', 
  className = '', 
  ...props 
}) => (
  <Button 
    variant="outline" 
    size={size} 
    className={cn('hover:-translate-y-1 hover:shadow-lg', className)} 
    {...props} 
  />
);

// Botón Header (Navegación)
export const HeaderButton: React.FC<Omit<ButtonProps, 'variant' | 'size'> & { 
  className?: string;
}> = ({ 
  className = '', 
  ...props 
}) => (
  <Button 
    variant="ghost" 
    size="md" 
    className={cn('font-medium', className)} 
    {...props} 
  />
);

// Botón Acción Clínica (Ficha Clínica)
export const ClinicalActionButton: React.FC<Omit<ButtonProps, 'variant'> & { 
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}> = ({ 
  variant = 'primary', 
  className = '', 
  ...props 
}) => (
  <Button 
    variant={variant} 
    className={cn('font-semibold', className)} 
    {...props} 
  />
);

export default Button; 