import React from 'react';
import {
  // Iconos para la página de bienvenida
  MicrophoneIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  LockClosedIcon,
  
  // Iconos para la ficha clínica
  UserIcon,
  CalendarIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  DocumentDuplicateIcon,
  PrinterIcon,
  EnvelopeIcon,
  ChartPieIcon,
  
  // Iconos de navegación y UI
  HomeIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  ArrowRightIcon,
  PlusIcon,
  MinusIcon,
  
  // Iconos de estado clínico
  HeartIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

import {
  // Versiones sólidas para estados activos
  MicrophoneIcon as MicrophoneIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  ShieldCheckIcon as ShieldCheckIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  XCircleIcon as XCircleIconSolid,
} from '@heroicons/react/24/solid';

import { colors, semanticColors } from './tokens';

// === TIPOS ===
export type IconName = 
  // Página de bienvenida
  | 'microphone'
  | 'document-text'
  | 'shield-check'
  | 'chart-bar'
  | 'clock'
  | 'user-group'
  | 'lock-closed'
  
  // Ficha clínica
  | 'user'
  | 'calendar'
  | 'cog'
  | 'check-circle'
  | 'exclamation-triangle'
  | 'x-circle'
  | 'play'
  | 'pause'
  | 'stop'
  | 'document-duplicate'
  | 'printer'
  | 'envelope'
  | 'chart-pie'
  
  // Navegación
  | 'home'
  | 'information-circle'
  | 'currency-dollar'
  | 'phone'
  | 'arrow-right'
  | 'plus'
  | 'minus'
  
  // Estado clínico
  | 'heart'
  | 'beaker'
  | 'clipboard-document-list';

export type IconSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
export type IconVariant = 'outline' | 'solid';

interface IconProps {
  name: IconName;
  size?: IconSize;
  variant?: IconVariant;
  color?: keyof typeof semanticColors | string;
  className?: string;
  onClick?: () => void;
}

// === MAPEO DE ICONOS ===
const iconMap = {
  outline: {
    'microphone': MicrophoneIcon,
    'document-text': DocumentTextIcon,
    'shield-check': ShieldCheckIcon,
    'chart-bar': ChartBarIcon,
    'clock': ClockIcon,
    'user-group': UserGroupIcon,
    'lock-closed': LockClosedIcon,
    'user': UserIcon,
    'calendar': CalendarIcon,
    'cog': CogIcon,
    'check-circle': CheckCircleIcon,
    'exclamation-triangle': ExclamationTriangleIcon,
    'x-circle': XCircleIcon,
    'play': PlayIcon,
    'pause': PauseIcon,
    'stop': StopIcon,
    'document-duplicate': DocumentDuplicateIcon,
    'printer': PrinterIcon,
    'envelope': EnvelopeIcon,
    'chart-pie': ChartPieIcon,
    'home': HomeIcon,
    'information-circle': InformationCircleIcon,
    'currency-dollar': CurrencyDollarIcon,
    'phone': PhoneIcon,
    'arrow-right': ArrowRightIcon,
    'plus': PlusIcon,
    'minus': MinusIcon,
    'heart': HeartIcon,
    'beaker': BeakerIcon,
    'clipboard-document-list': ClipboardDocumentListIcon,
  },
  solid: {
    'microphone': MicrophoneIconSolid,
    'document-text': DocumentTextIconSolid,
    'shield-check': ShieldCheckIconSolid,
    'check-circle': CheckCircleIconSolid,
    'exclamation-triangle': ExclamationTriangleIconSolid,
    'x-circle': XCircleIconSolid,
    // Para iconos que no tienen versión sólida, usar la outline
    'chart-bar': ChartBarIcon,
    'clock': ClockIcon,
    'user-group': UserGroupIcon,
    'lock-closed': LockClosedIcon,
    'user': UserIcon,
    'calendar': CalendarIcon,
    'cog': CogIcon,
    'play': PlayIcon,
    'pause': PauseIcon,
    'stop': StopIcon,
    'document-duplicate': DocumentDuplicateIcon,
    'printer': PrinterIcon,
    'envelope': EnvelopeIcon,
    'chart-pie': ChartPieIcon,
    'home': HomeIcon,
    'information-circle': InformationCircleIcon,
    'currency-dollar': CurrencyDollarIcon,
    'phone': PhoneIcon,
    'arrow-right': ArrowRightIcon,
    'plus': PlusIcon,
    'minus': MinusIcon,
    'heart': HeartIcon,
    'beaker': BeakerIcon,
    'clipboard-document-list': ClipboardDocumentListIcon,
  },
} as const;

// === MAPEO DE TAMAÑOS ===
const sizeMap: Record<IconSize, string> = {
  xs: '16px',
  sm: '20px',
  base: '24px',
  lg: '32px',
  xl: '48px',
  '2xl': '56px',
};

// === UTILIDADES ===
const getColorValue = (color: string): string => {
  if (color in semanticColors) {
    return semanticColors[color as keyof typeof semanticColors];
  }
  return color;
};

// === COMPONENTE PRINCIPAL ===
export const Icon: React.FC<IconProps> = ({
  name,
  size = 'base',
  variant = 'outline',
  color = 'textPrimary',
  className = '',
  onClick,
}) => {
  const IconComponent = iconMap[variant][name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" with variant "${variant}" not found`);
    return null;
  }

  const styles: React.CSSProperties = {
    width: sizeMap[size],
    height: sizeMap[size],
    color: getColorValue(color),
    cursor: onClick ? 'pointer' : 'default',
    transition: 'color 150ms ease-in-out',
  };

  return (
    <IconComponent
      style={styles}
      className={className}
      onClick={onClick}
    />
  );
};

// === COMPONENTES ESPECIALIZADOS PARA WIREFRAMES ===

// Icono de beneficio (página de bienvenida)
export const BenefitIcon: React.FC<{
  name: IconName;
  backgroundColor?: string;
  iconColor?: string;
}> = ({ 
  name, 
  backgroundColor = colors.success[50], 
  iconColor = colors.success[500] 
}) => {
  const containerStyle: React.CSSProperties = {
    width: '56px',
    height: '56px',
    backgroundColor,
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
  };

  return (
    <div style={containerStyle}>
      <Icon name={name} size="lg" color={iconColor} />
    </div>
  );
};

// Icono de estado clínico
export const ClinicalStatusIcon: React.FC<{
  status: 'improved' | 'stable' | 'worsened' | 'neutral';
  size?: IconSize;
}> = ({ status, size = 'base' }) => {
  const statusConfig = {
    improved: { name: 'check-circle' as IconName, color: semanticColors.clinicalImproved },
    stable: { name: 'exclamation-triangle' as IconName, color: semanticColors.clinicalStable },
    worsened: { name: 'x-circle' as IconName, color: semanticColors.clinicalWorsened },
    neutral: { name: 'information-circle' as IconName, color: semanticColors.clinicalNeutral },
  };

  const config = statusConfig[status];
  
  return (
    <Icon 
      name={config.name} 
      size={size} 
      color={config.color}
      variant="solid"
    />
  );
};

// Icono de nivel de riesgo
export const RiskLevelIcon: React.FC<{
  level: 'low' | 'medium' | 'high';
  size?: IconSize;
}> = ({ level, size = 'base' }) => {
  const riskConfig = {
    low: { name: 'check-circle' as IconName, color: semanticColors.riskLow },
    medium: { name: 'exclamation-triangle' as IconName, color: semanticColors.riskMedium },
    high: { name: 'x-circle' as IconName, color: semanticColors.riskHigh },
  };

  const config = riskConfig[level];
  
  return (
    <Icon 
      name={config.name} 
      size={size} 
      color={config.color}
      variant="solid"
    />
  );
}; 