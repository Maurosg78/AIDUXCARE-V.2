import React from 'react';

interface AiDuxCareLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: { width: 60, height: 60, fontSize: '0.875rem' },
  md: { width: 80, height: 80, fontSize: '1.25rem' },
  lg: { width: 120, height: 120, fontSize: '1.875rem' },
  xl: { width: 160, height: 160, fontSize: '2.5rem' }
};

export const AiDuxCareLogo: React.FC<AiDuxCareLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  showText = true
}) => {
  const sizeConfig = sizeMap[size] || sizeMap['md'];
  if (!sizeMap[size]) {
    console.warn(`AiDuxCareLogo: tamaño desconocido "${size}", usando 'md' por defecto.`);
  }
  const { width, height, fontSize } = sizeConfig;

  const LogoIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 120 120" 
      width={width} 
      height={height}
      className="aidux-logo-icon"
    >
      <defs>
        {/* Gradiente principal del logo */}
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5DA5A3" />
          <stop offset="50%" stopColor="#4A8280" />
          <stop offset="100%" stopColor="#3A6B69" />
        </linearGradient>
        
        {/* Gradiente más suave para la línea */}
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5DA5A3" />
          <stop offset="100%" stopColor="#4A8280" />
        </linearGradient>
        
        {/* Sombra sutil */}
        <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.1"/>
        </filter>
      </defs>
      
      {/* Círculo principal con forma de "C" estilizada */}
      <circle 
        cx="60" 
        cy="60" 
        r="35" 
        fill="none" 
        stroke="url(#logoGradient)" 
        strokeWidth="8" 
        strokeLinecap="round"
        strokeDasharray="190 30"
        strokeDashoffset="15"
        filter="url(#logoShadow)"
        opacity="0.95"
      />
      
      {/* Línea horizontal interna */}
      <rect 
        x="35" 
        y="57" 
        width="50" 
        height="6" 
        rx="3" 
        fill="url(#lineGradient)"
        filter="url(#logoShadow)"
        opacity="0.9"
      />
      
      {/* Punto de acento sutil */}
      <circle 
        cx="85" 
        cy="35" 
        r="2" 
        fill="#5DA5A3" 
        opacity="0.7"
      />
    </svg>
  );

  const LogoText = () => (
    <span 
      className="aidux-logo-text"
      style={{
        fontFamily: 'var(--font-family-heading)',
        fontSize,
        fontWeight: 600,
        color: '#2C3E50',
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