import React from 'react';
import { colors, spacing, borderRadius, boxShadow, semanticColors } from './tokens';

// === TIPOS ===
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'clinical' | 'ai-assistant' | 'warning';
export type CardPadding = 'none' | 'sm' | 'base' | 'lg' | 'xl';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

// === CONFIGURACIÓN DE VARIANTES ===
const variantStyles: Record<CardVariant, {
  background: string;
  border: string;
  boxShadow: string;
  borderRadius: string;
}> = {
  default: {
    background: colors.white,
    border: `1px solid ${colors.gray[200]}`,
    boxShadow: boxShadow.sm,
    borderRadius: borderRadius.lg,
  },
  elevated: {
    background: colors.white,
    border: 'none',
    boxShadow: boxShadow.lg,
    borderRadius: borderRadius.lg,
  },
  outlined: {
    background: colors.white,
    border: `2px solid ${colors.gray[200]}`,
    boxShadow: 'none',
    borderRadius: borderRadius.lg,
  },
  clinical: {
    background: colors.gray[50],
    border: `1px solid ${colors.gray[200]}`,
    boxShadow: boxShadow.sm,
    borderRadius: borderRadius.lg,
  },
  'ai-assistant': {
    background: colors.success[50],
    border: `1px solid ${colors.success[200]}`,
    boxShadow: boxShadow.sm,
    borderRadius: borderRadius.lg,
  },
  warning: {
    background: colors.warning[50],
    border: `1px solid ${colors.warning[200]}`,
    boxShadow: boxShadow.sm,
    borderRadius: borderRadius.lg,
  },
};

// === CONFIGURACIÓN DE PADDING ===
const paddingStyles: Record<CardPadding, string> = {
  none: '0',
  sm: spacing[3],
  base: spacing[4],
  lg: spacing[6],
  xl: spacing[8],
};

// === COMPONENTE PRINCIPAL ===
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'base',
  className = '',
  onClick,
  style = {},
  ...props
}) => {
  const variantStyle = variantStyles[variant];
  const paddingValue = paddingStyles[padding];

  const baseStyles: React.CSSProperties = {
    backgroundColor: variantStyle.background,
    border: variantStyle.border,
    borderRadius: variantStyle.borderRadius,
    boxShadow: variantStyle.boxShadow,
    padding: paddingValue,
    cursor: onClick ? 'pointer' : 'default',
    transition: onClick ? 'all 150ms ease-in-out' : 'none',
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = boxShadow.md;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = variantStyle.boxShadow;
    }
  };

  return (
    <div
      style={baseStyles}
      className={className}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};

// === COMPONENTES ESPECIALIZADOS PARA WIREFRAMES ===

// Card de beneficio (página de bienvenida)
export const BenefitCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <Card variant="default" padding="lg" className={className}>
    {children}
  </Card>
);

// Card de estadística (página de bienvenida)
export const StatCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <Card variant="elevated" padding="lg" className={className}>
    <div style={{ textAlign: 'center' }}>
      {children}
    </div>
  </Card>
);

// Card de sección SOAP (ficha clínica)
export const SOAPSectionCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <Card variant="clinical" padding="lg" className={className}>
    {children}
  </Card>
);

// Card del asistente IA (ficha clínica)
export const AIAssistantCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <Card variant="ai-assistant" padding="base" className={className}>
    {children}
  </Card>
);

// Card de historial del paciente
export const PatientHistoryCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <Card variant="warning" padding="base" className={className}>
    {children}
  </Card>
);

// Card de transcripción de audio
export const AudioTranscriptionCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <Card 
    variant="default" 
    padding="base" 
    className={className}
    style={{ backgroundColor: colors.primary[50] }}
  >
    {children}
  </Card>
);

// Card de acciones rápidas
export const QuickActionsCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <Card variant="outlined" padding="base" className={className}>
    {children}
  </Card>
);

// Container principal para layout de 2 columnas (ficha clínica)
export const TwoColumnLayout: React.FC<{
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
  className?: string;
}> = ({ leftColumn, rightColumn, className = '' }) => {
  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '70% 30%',
    gap: spacing[6],
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: `0 ${spacing[6]}`,
  };

  return (
    <div style={containerStyle} className={className}>
      <div>{leftColumn}</div>
      <div>{rightColumn}</div>
    </div>
  );
};

// Container para grid de beneficios (página de bienvenida)
export const BenefitsGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: spacing[12],
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  return (
    <div style={gridStyle} className={className}>
      {children}
    </div>
  );
};

// Container para grid de estadísticas
export const StatsGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[8],
    width: '100%',
    maxWidth: '1000px',
    margin: '0 auto',
  };

  return (
    <div style={gridStyle} className={className}>
      {children}
    </div>
  );
};

// Container principal de página
export const PageContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const containerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: `0 ${spacing[6]}`,
  };

  return (
    <div style={containerStyle} className={className}>
      {children}
    </div>
  );
};

// Container de sección con padding vertical
export const SectionContainer: React.FC<{
  children: React.ReactNode;
  backgroundColor?: string;
  className?: string;
}> = ({ children, backgroundColor = colors.white, className = '' }) => {
  const sectionStyle: React.CSSProperties = {
    backgroundColor,
    padding: `${spacing[20]} 0`,
    width: '100%',
  };

  return (
    <section style={sectionStyle} className={className}>
      <PageContainer>
        {children}
      </PageContainer>
    </section>
  );
}; 