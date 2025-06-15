import React from 'react';
import { colors, typography, semanticColors } from './tokens';

// === TIPOS ===
interface BaseTypographyProps {
  children: React.ReactNode;
  className?: string;
  color?: keyof typeof semanticColors | string;
  as?: keyof JSX.IntrinsicElements;
}

interface HeadingProps extends BaseTypographyProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

interface TextProps extends BaseTypographyProps {
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  lineHeight?: 'tight' | 'normal' | 'relaxed';
}

// === UTILIDADES ===
const getColorValue = (color: string): string => {
  if (color in semanticColors) {
    return semanticColors[color as keyof typeof semanticColors];
  }
  return color;
};

const getBaseStyles = (
  color?: string,
  className?: string
): React.CSSProperties => ({
  fontFamily: typography.fontFamily.sans.join(', '),
  color: color ? getColorValue(color) : semanticColors.textPrimary,
  margin: 0,
  padding: 0,
});

// === COMPONENTE HEADING ===
export const Heading: React.FC<HeadingProps> = ({
  children,
  level,
  size,
  weight = 'bold',
  color = 'textPrimary',
  className = '',
  as,
  ...props
}) => {
  // Mapeo de tamaños por defecto según el nivel
  const defaultSizes: Record<number, keyof typeof typography.fontSize> = {
    1: '7xl', // 52px - Títulos principales de hero
    2: '5xl', // 40px - Títulos de sección
    3: '3xl', // 28px - Subtítulos importantes
    4: '2xl', // 24px - Títulos de componentes
    5: 'xl',  // 20px - Títulos menores
    6: 'lg',  // 18px - Títulos pequeños
  };

  const finalSize = size || defaultSizes[level];
  const Component = as || (`h${level}` as keyof JSX.IntrinsicElements);

  const styles: React.CSSProperties = {
    ...getBaseStyles(color, className),
    fontSize: typography.fontSize[finalSize],
    fontWeight: typography.fontWeight[weight],
    lineHeight: level <= 2 ? typography.lineHeight.tight : typography.lineHeight.normal,
  };

  return (
    <Component style={styles} className={className} {...props}>
      {children}
    </Component>
  );
};

// === COMPONENTE TEXT ===
export const Text: React.FC<TextProps> = ({
  children,
  size = 'base',
  weight = 'normal',
  lineHeight = 'relaxed',
  color = 'textPrimary',
  className = '',
  as = 'p',
  ...props
}) => {
  const Component = as;

  const styles: React.CSSProperties = {
    ...getBaseStyles(color, className),
    fontSize: typography.fontSize[size],
    fontWeight: typography.fontWeight[weight],
    lineHeight: typography.lineHeight[lineHeight],
  };

  return (
    <Component style={styles} className={className} {...props}>
      {children}
    </Component>
  );
};

// === COMPONENTE BODY TEXT ===
export const BodyText: React.FC<Omit<TextProps, 'size'>> = ({
  children,
  weight = 'normal',
  lineHeight = 'relaxed',
  color = 'textPrimary',
  className = '',
  as = 'p',
  ...props
}) => {
  return (
    <Text
      size="base"
      weight={weight}
      lineHeight={lineHeight}
      color={color}
      className={className}
      as={as}
      {...props}
    >
      {children}
    </Text>
  );
};

// === COMPONENTE CAPTION ===
export const Caption: React.FC<Omit<TextProps, 'size'>> = ({
  children,
  weight = 'medium',
  lineHeight = 'normal',
  color = 'textSecondary',
  className = '',
  as = 'span',
  ...props
}) => {
  return (
    <Text
      size="sm"
      weight={weight}
      lineHeight={lineHeight}
      color={color}
      className={className}
      as={as}
      {...props}
    >
      {children}
    </Text>
  );
};

// === COMPONENTE LABEL ===
export const Label: React.FC<Omit<TextProps, 'size'>> = ({
  children,
  weight = 'medium',
  lineHeight = 'normal',
  color = 'textPrimary',
  className = '',
  as = 'label',
  ...props
}) => {
  return (
    <Text
      size="sm"
      weight={weight}
      lineHeight={lineHeight}
      color={color}
      className={className}
      as={as}
      {...props}
    >
      {children}
    </Text>
  );
};

// === COMPONENTES ESPECIALIZADOS PARA WIREFRAMES ===

// Título principal del Hero (wireframe página de bienvenida)
export const HeroTitle: React.FC<Omit<HeadingProps, 'level' | 'size'>> = (props) => (
  <Heading level={1} size="7xl" weight="bold" {...props} />
);

// Subtítulo del Hero
export const HeroSubtitle: React.FC<Omit<TextProps, 'size'>> = (props) => (
  <Text size="xl" weight="normal" lineHeight="relaxed" color="textSecondary" {...props} />
);

// Título de sección (beneficios, etc.)
export const SectionTitle: React.FC<Omit<HeadingProps, 'level' | 'size'>> = (props) => (
  <Heading level={2} size="5xl" weight="bold" {...props} />
);

// Título de beneficio/característica
export const FeatureTitle: React.FC<Omit<HeadingProps, 'level' | 'size'>> = (props) => (
  <Heading level={3} size="2xl" weight="semibold" {...props} />
);

// Descripción de beneficio/característica
export const FeatureDescription: React.FC<Omit<TextProps, 'size'>> = (props) => (
  <Text size="lg" weight="normal" lineHeight="relaxed" color="textSecondary" {...props} />
);

// Título de formulario clínico (SOAP)
export const FormSectionTitle: React.FC<Omit<HeadingProps, 'level' | 'size'>> = (props) => (
  <Heading level={4} size="xl" weight="semibold" {...props} />
);

// Texto de estadística
export const StatNumber: React.FC<Omit<HeadingProps, 'level' | 'size' | 'weight'>> = (props) => (
  <Heading level={2} size="6xl" weight="bold" {...props} />
);

export const StatLabel: React.FC<Omit<TextProps, 'size'>> = (props) => (
  <Text size="lg" weight="normal" color="textSecondary" {...props} />
); 