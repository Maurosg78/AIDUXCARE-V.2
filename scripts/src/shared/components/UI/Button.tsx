import React from 'react';
import { colors, spacing, borderRadius, boxShadow, transitions, typography } from './tokens';
import { Icon, IconName } from './Icon';

// === TIPOS ===
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'outline' | 'ghost' | 'danger' | 'default' | 'destructive';
export type ButtonSize = 'sm' | 'base' | 'lg' | 'xl';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

// === CONFIGURACIÓN DE VARIANTES ===
const variantStyles: Record<ButtonVariant, {
  background: string;
  color: string;
  border: string;
  hoverBackground: string;
  hoverColor?: string;
  boxShadow?: string;
}> = {
  primary: {
    background: colors.primary[500],
    color: colors.white,
    border: `2px solid ${colors.primary[500]}`,
    hoverBackground: colors.primary[600],
    boxShadow: boxShadow.primary,
  },
  secondary: {
    background: colors.white,
    color: colors.primary[500],
    border: `2px solid ${colors.primary[500]}`,
    hoverBackground: colors.primary[50],
  },
  success: {
    background: colors.success[500],
    color: colors.white,
    border: `2px solid ${colors.success[500]}`,
    hoverBackground: colors.success[600],
    boxShadow: boxShadow.cta,
  },
  outline: {
    background: 'transparent',
    color: colors.gray[700],
    border: `2px solid ${colors.gray[300]}`,
    hoverBackground: colors.gray[50],
  },
  ghost: {
    background: 'transparent',
    color: colors.gray[700],
    border: '2px solid transparent',
    hoverBackground: colors.gray[100],
  },
  danger: {
    background: colors.error[500],
    color: colors.white,
    border: `2px solid ${colors.error[500]}`,
    hoverBackground: colors.error[600],
  },
  default: {
    background: colors.gray[100],
    color: colors.gray[700],
    border: `2px solid ${colors.gray[300]}`,
    hoverBackground: colors.gray[200],
  },
  destructive: {
    background: colors.error[500],
    color: colors.white,
    border: `2px solid ${colors.error[500]}`,
    hoverBackground: colors.error[600],
  },
};

// === CONFIGURACIÓN DE TAMAÑOS ===
const sizeStyles: Record<ButtonSize, {
  padding: string;
  fontSize: string;
  fontWeight: string;
  borderRadius: string;
  minHeight: string;
}> = {
  sm: {
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    borderRadius: borderRadius.base,
    minHeight: '32px',
  },
  base: {
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    borderRadius: borderRadius.md,
    minHeight: '40px',
  },
  lg: {
    padding: `${spacing[4]} ${spacing[6]}`,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    borderRadius: borderRadius.lg,
    minHeight: '48px',
  },
  xl: {
    padding: `${spacing[5]} ${spacing[8]}`,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    borderRadius: borderRadius.lg,
    minHeight: '56px',
  },
};

// === COMPONENTE PRINCIPAL ===
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'base',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const baseStyles: React.CSSProperties = {
    // Layout
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    width: fullWidth ? '100%' : 'auto',
    
    // Apariencia
    fontFamily: typography.fontFamily.sans.join(', '),
    fontSize: sizeStyle.fontSize,
    fontWeight: sizeStyle.fontWeight,
    padding: sizeStyle.padding,
    borderRadius: sizeStyle.borderRadius,
    minHeight: sizeStyle.minHeight,
    
    // Colores y bordes
    backgroundColor: disabled ? colors.gray[300] : variantStyle.background,
    color: disabled ? colors.gray[500] : variantStyle.color,
    border: disabled ? `2px solid ${colors.gray[300]}` : variantStyle.border,
    boxShadow: disabled ? 'none' : variantStyle.boxShadow,
    
    // Interacción
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: `all ${transitions.normal}`,
    textDecoration: 'none',
    outline: 'none',
    
    // Estados
    opacity: loading ? 0.7 : 1,
  };

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      e.currentTarget.style.backgroundColor = variantStyle.hoverBackground;
      if (variantStyle.hoverColor) {
        e.currentTarget.style.color = variantStyle.hoverColor;
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      e.currentTarget.style.backgroundColor = variantStyle.background;
      e.currentTarget.style.color = variantStyle.color;
    }
  };

  return (
    <button
      type={type}
      style={baseStyles}
      className={className}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: `2px solid ${variantStyle.color}`,
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      )}
      
      {!loading && leftIcon && (
        <Icon name={leftIcon} size="sm" color={variantStyle.color} />
      )}
      
      {children}
      
      {!loading && rightIcon && (
        <Icon name={rightIcon} size="sm" color={variantStyle.color} />
      )}
    </button>
  );
};

// === COMPONENTES ESPECIALIZADOS PARA WIREFRAMES ===

// Botón CTA principal (página de bienvenida)
export const CTAPrimaryButton: React.FC<Omit<ButtonProps, 'variant' | 'size'>> = (props) => (
  <Button variant="success" size="xl" {...props} />
);

// Botón CTA secundario (página de bienvenida)
export const CTASecondaryButton: React.FC<Omit<ButtonProps, 'variant' | 'size'>> = (props) => (
  <Button variant="secondary" size="lg" {...props} />
);

// Botón de navegación (header)
export const NavButton: React.FC<Omit<ButtonProps, 'variant' | 'size'>> = (props) => (
  <Button variant="ghost" size="base" {...props} />
);

// Botón de acción rápida (ficha clínica)
export const QuickActionButton: React.FC<Omit<ButtonProps, 'variant' | 'size'>> = (props) => (
  <Button variant="outline" size="sm" {...props} />
);

// Botón de finalizar consulta
export const FinishConsultationButton: React.FC<Omit<ButtonProps, 'variant' | 'size'>> = (props) => (
  <Button variant="success" size="lg" {...props} />
);

// === ESTILOS CSS PARA ANIMACIONES ===
// Nota: En una implementación real, estos estilos irían en un archivo CSS global
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inyectar estilos de animación si no existen
if (typeof document !== 'undefined' && !document.getElementById('button-animations')) {
  const style = document.createElement('style');
  style.id = 'button-animations';
  style.textContent = spinKeyframes;
  document.head.appendChild(style);
} 