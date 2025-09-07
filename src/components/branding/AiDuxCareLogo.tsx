// @ts-nocheck
import React from 'react';

interface AiDuxCareLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: { width: 60, height: 40, fontSize: '0.875rem' },
  md: { width: 120, height: 80, fontSize: '1.25rem' },
  lg: { width: 180, height: 120, fontSize: '1.875rem' },
  xl: { width: 240, height: 160, fontSize: '2.5rem' }
};

export const AiDuxCareLogo: React.FC<AiDuxCareLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  showText = true
}) => {
  const { width, height, fontSize } = sizeMap[size];

  const LogoIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 120 80" 
      width={width} 
      height={height}
      className="aidux-logo-icon"
    >
      {/* Definiciones para las intersecciones */}
      <defs>
        {/* Gradiente para intersecciones */}
        <linearGradient id="intersectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: 'var(--aidux-intersection-green)', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: 'var(--aidux-intersection-green-dark)', stopOpacity: 1}} />
        </linearGradient>
      </defs>
      
      {/* Círculo IA (azul) - Tecnología, análisis */}
      <circle 
        cx="30" 
        cy="40" 
        r="18" 
        fill="none" 
        stroke="var(--aidux-blue-slate)" 
        strokeWidth="3" 
        opacity="0.9"
      />
      
      {/* Círculo Seguridad Clínica (verde menta) - Salud */}
      <circle 
        cx="60" 
        cy="25" 
        r="18" 
        fill="none" 
        stroke="var(--aidux-mint-green)" 
        strokeWidth="3" 
        opacity="0.9"
      />
      
      {/* Círculo Cuidado Humano (coral) - Cuidado */}
      <circle 
        cx="60" 
        cy="55" 
        r="18" 
        fill="none" 
        stroke="var(--aidux-coral)" 
        strokeWidth="3" 
        opacity="0.9"
      />
      
      {/* Intersecciones con color unificado */}
      {/* Intersección IA + Seguridad */}
      <path 
        d="M 42 32 A 18 18 0 0 1 48 25 A 18 18 0 0 1 42 32" 
        fill="var(--aidux-intersection-green)" 
        opacity="0.8"
      />
      
      {/* Intersección IA + Cuidado */}
      <path 
        d="M 42 48 A 18 18 0 0 1 48 55 A 18 18 0 0 1 42 48" 
        fill="var(--aidux-intersection-green)" 
        opacity="0.8"
      />
      
      {/* Intersección Seguridad + Cuidado */}
      <path 
        d="M 60 37 A 18 18 0 0 1 60 43 A 18 18 0 0 1 60 37" 
        fill="var(--aidux-intersection-green)" 
        opacity="0.8"
      />
      
      {/* Intersección central (donde se unen los tres) */}
      <circle 
        cx="50" 
        cy="40" 
        r="4" 
        fill="var(--aidux-intersection-green)" 
        opacity="1"
      />
      
      {/* Iconos simbólicos sutiles */}
      {/* IA: punto tecnológico */}
      <circle 
        cx="30" 
        cy="40" 
        r="2" 
        fill="var(--aidux-blue-slate)" 
        opacity="0.6"
      />
      
      {/* Seguridad: cruz médica pequeña */}
      <g transform="translate(60,25)" opacity="0.6">
        <rect x="-1" y="-4" width="2" height="8" fill="var(--aidux-mint-green-dark)"/>
        <rect x="-4" y="-1" width="8" height="2" fill="var(--aidux-mint-green-dark)"/>
      </g>
      
      {/* Cuidado: corazón pequeño */}
      <g transform="translate(60,55)" opacity="0.6">
        <path 
          d="M-3,-1 C-3,-3 -1,-3 0,-1 C1,-3 3,-3 3,-1 C3,0 0,3 0,3 C0,3 -3,0 -3,-1 Z" 
          fill="var(--aidux-coral-dark)"
        />
      </g>
    </svg>
  );

  const LogoText = () => (
    <span 
      className="aidux-logo-text bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent"
      style={{
        fontFamily: 'var(--font-family-heading)',
        fontSize,
        fontWeight: 600,
        letterSpacing: '-0.02em'
      }}
    >
      AiDuxCare
    </span>
  );

  if (variant === 'icon') {
    return (
      <div className={`aidux-logo aidux-logo--icon ${className}`}>
        <LogoIcon />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`aidux-logo aidux-logo--text ${className}`}>
        <LogoText />
      </div>
    );
  }

  return (
    <div className={`aidux-logo aidux-logo--full ${className}`}>
      <div className="flex items-center gap-3">
        <LogoIcon />
        {showText && <LogoText />}
      </div>
    </div>
  );
};

// Componente simplificado para header/navbar
export const AiDuxCareLogoCompact: React.FC<{ className?: string }> = ({ className = '' }) => (
  <AiDuxCareLogo size="sm" className={`${className}`} />
);

// Componente para páginas principales
export const AiDuxCareLogoHero: React.FC<{ className?: string }> = ({ className = '' }) => (
  <AiDuxCareLogo size="xl" className={`${className}`} />
);

export default AiDuxCareLogo; 