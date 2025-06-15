/**
 * 🎨 TYPOGRAPHY COMPONENTS - AIDUXCARE DESIGN SYSTEM
 * Sistema de tipografía coherente basado en la identidad visual oficial
 */

import React from 'react';
import { cn } from '@/lib/utils';

// === TIPOS DE COMPONENTES ===
interface HeadingProps {
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'white';
  className?: string;
  children: React.ReactNode;
}

interface TextProps {
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'muted' | 'white';
  className?: string;
  children: React.ReactNode;
}

// === COMPONENTE HEADING PRINCIPAL ===
export const Heading: React.FC<HeadingProps> = ({ 
  level, 
  size, 
  weight = 'semibold', 
  color = 'primary',
  className = '', 
  children 
}) => {
  const Component = level;
  
  // Tamaños por defecto basados en el nivel
  const defaultSizes = {
    h1: '5xl',
    h2: '3xl', 
    h3: '2xl',
    h4: 'xl',
    h5: 'lg',
    h6: 'base'
  };
  
  const actualSize = size || defaultSizes[level];
  
  const sizeClasses: Record<string, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl',
    '7xl': 'text-7xl'
  };
  
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    neutral: 'text-neutral',
    white: 'text-white'
  };

  const classes = cn(
    'font-heading leading-tight',
    sizeClasses[actualSize],
    weightClasses[weight],
    colorClasses[color],
    className
  );

  return <Component className={classes}>{children}</Component>;
};

// === COMPONENTE BODY TEXT ===
export const BodyText: React.FC<TextProps> = ({ 
  size = 'base',
  weight = 'normal',
  color = 'primary', 
  className = '', 
  children 
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',  
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };
  
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium', 
    semibold: 'font-semibold',
    bold: 'font-bold'
  };
  
  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    neutral: 'text-neutral',
    muted: 'text-neutral/60',
    white: 'text-white'
  };

  const classes = cn(
    'font-sans leading-relaxed',
    sizeClasses[size],
    weightClasses[weight], 
    colorClasses[color],
    className
  );

  return <p className={classes}>{children}</p>;
};

// === COMPONENTES ESPECIALIZADOS ===

// Subtítulo destacado
export const Subheading: React.FC<Omit<TextProps, 'color'> & { className?: string }> = ({ 
  size = 'lg',
  weight = 'medium',
  className = '', 
  children 
}) => (
  <BodyText 
    size={size} 
    weight={weight} 
    color="accent" 
    className={cn('text-intersection', className)}
  >
      {children}
  </BodyText>
  );

// Texto pequeño para metadatos
export const SmallText: React.FC<Omit<TextProps, 'size'> & { className?: string }> = ({ 
  weight = 'normal',
  color = 'muted',
  className = '', 
  children 
}) => (
  <BodyText 
    size="sm" 
    weight={weight} 
    color={color} 
    className={className}
  >
      {children}
  </BodyText>
  );

// Texto destacado para CTAs y highlights
export const HighlightText: React.FC<Omit<TextProps, 'color'> & { className?: string }> = ({ 
  size = 'base',
  weight = 'semibold',
  className = '', 
  children 
}) => (
  <span className={cn('text-accent font-medium', className)}>
      {children}
    </span>
  );

// === COMPONENTES ESPECIALIZADOS PARA WIREFRAMES ===

// Título Hero (Página de Bienvenida)
export const HeroTitle: React.FC<Omit<HeadingProps, 'level' | 'size'> & { className?: string }> = ({ 
  className = '', 
  ...props 
}) => (
  <Heading 
    level="h1" 
    size="6xl" 
    weight="bold" 
    className={cn('md:text-7xl', className)} 
    {...props} 
  />
);

// Subtítulo Hero
export const HeroSubtitle: React.FC<Omit<TextProps, 'size'> & { className?: string }> = ({ 
  className = '', 
  ...props 
}) => (
  <BodyText 
    size="xl" 
    weight="normal" 
    color="muted" 
    className={cn('max-w-3xl mx-auto', className)} 
    {...props} 
  />
);

// Título de Sección
export const SectionTitle: React.FC<Omit<HeadingProps, 'level'> & { className?: string }> = ({ 
  className = '', 
  ...props 
}) => (
  <Heading 
    level="h2" 
    size="3xl" 
    weight="semibold" 
    className={className} 
    {...props} 
  />
);

// Título de Card/Componente
export const CardTitle: React.FC<Omit<HeadingProps, 'level' | 'size'> & { className?: string }> = ({ 
  className = '', 
  ...props 
}) => (
  <Heading 
    level="h3" 
    size="xl" 
    weight="semibold" 
    className={className} 
    {...props} 
  />
); 