import React from 'react';

interface HeadingProps {
  level: 'h1' | 'h2' | 'h3' | 'h4';
  children: React.ReactNode;
  className?: string;
}

interface TextProps {
  children: React.ReactNode;
  className?: string;
}

// 🎨 COMPONENTES DE TIPOGRAFÍA - IDENTIDAD VISUAL OFICIAL AIDUXCARE

// Componente principal para títulos con jerarquía clara
export const Heading: React.FC<HeadingProps> = ({ level, children, className = '' }) => {
  const baseClasses = 'font-aidux font-semibold leading-tight text-azul-pizarra';
  
  const levelClasses = {
    h1: 'text-aidux-4xl md:text-aidux-5xl', // Título principal
    h2: 'text-aidux-2xl md:text-aidux-3xl', // Subtítulos importantes
    h3: 'text-aidux-xl md:text-aidux-2xl',  // Secciones
    h4: 'text-aidux-lg md:text-aidux-xl'    // Subsecciones
  };

  const Component = level;
  const classes = `${baseClasses} ${levelClasses[level]} ${className}`;

  return <Component className={classes}>{children}</Component>;
};

// Subtítulo para descripciones importantes
export const Subheading: React.FC<TextProps> = ({ children, className = '' }) => {
  return (
    <p className={`font-aidux text-aidux-lg md:text-aidux-xl text-verde-interseccion font-medium leading-relaxed ${className}`}>
      {children}
    </p>
  );
};

// Texto del cuerpo - legible y cómodo
export const BodyText: React.FC<TextProps> = ({ children, className = '' }) => {
  return (
    <p className={`font-aidux text-aidux-base md:text-aidux-lg text-azul-pizarra/80 leading-relaxed ${className}`}>
      {children}
    </p>
  );
};

// Texto pequeño para notas y detalles
export const SmallText: React.FC<TextProps> = ({ children, className = '' }) => {
  return (
    <p className={`font-aidux text-aidux-sm text-azul-pizarra/60 leading-normal ${className}`}>
      {children}
    </p>
  );
};

// Texto destacado para llamadas a la acción
export const HighlightText: React.FC<TextProps> = ({ children, className = '' }) => {
  return (
    <span className={`font-aidux font-semibold text-coral-suave ${className}`}>
      {children}
    </span>
  );
}; 