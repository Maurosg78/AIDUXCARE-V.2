/**
 * ⚡ ICON COMPONENT - AIDUXCARE DESIGN SYSTEM
 * Sistema de iconografía usando Heroicons con paleta oficial AiDuxCare
 */

import React from 'react';
import {
  // Iconos médicos y sanitarios
  HeartIcon,
  UserIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  
  // Iconos de navegación
  HomeIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  
  // Iconos de acción
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  
  // Iconos de estado
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  
  // Iconos de funcionalidad
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  DocumentIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  
  // Iconos específicos para EMR
  ChatBubbleLeftRightIcon,
  ComputerDesktopIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CalendarIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  
  // Iconos de interfaz
  Bars3Icon,
  XMarkIcon as CloseIcon,
  EyeIcon,
  EyeSlashIcon,
  PrinterIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

// Iconos sólidos para estados activos
import {
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  XCircleIcon as XCircleIconSolid,
  HeartIcon as HeartIconSolid,
  SparklesIcon as SparklesIconSolid
} from '@heroicons/react/24/solid';

// Mapeo de nombres amigables a componentes de Heroicons
const iconMap = {
  // === MÉDICOS Y SANITARIOS ===
  'heart': HeartIcon,
  'heart-solid': HeartIconSolid,
  'user': UserIcon,
  'document': DocumentTextIcon,
  'clipboard': ClipboardDocumentListIcon,
  'medical-record': ClipboardDocumentCheckIcon,
  'analysis': DocumentMagnifyingGlassIcon,
  
  // === NAVEGACIÓN ===
  'home': HomeIcon,
  'chevron-right': ChevronRightIcon,
  'chevron-left': ChevronLeftIcon,
  'arrow-right': ArrowRightIcon,
  'arrow-left': ArrowLeftIcon,
  
  // === ACCIONES ===
  'plus': PlusIcon,
  'check': CheckIcon,
  'close': XMarkIcon,
  'edit': PencilIcon,
  'play': PlayIcon,
  'pause': PauseIcon,
  'stop': StopIcon,
  
  // === ESTADOS ===
  'warning': ExclamationTriangleIcon,
  'warning-solid': ExclamationTriangleIconSolid,
  'info': InformationCircleIcon,
  'success': CheckCircleIcon,
  'success-solid': CheckCircleIconSolid,
  'error': XCircleIcon,
  'error-solid': XCircleIconSolid,
  
  // === FUNCIONALIDAD ===
  'search': MagnifyingGlassIcon,
  'settings': Cog6ToothIcon,
  'profile': UserCircleIcon,
  'file': DocumentIcon,
  'microphone': MicrophoneIcon,
  'speaker': SpeakerWaveIcon,
  
  // === EMR ESPECÍFICOS ===
  'chat': ChatBubbleLeftRightIcon,
  'computer': ComputerDesktopIcon,
  'ai': SparklesIcon,
  'ai-solid': SparklesIconSolid,
  'shield': ShieldCheckIcon,
  'calendar': CalendarIcon,
  'clock': ClockIcon,
  'phone': PhoneIcon,
  'email': EnvelopeIcon,
  
  // === INTERFAZ ===
  'menu': Bars3Icon,
  'close-menu': CloseIcon,
  'eye': EyeIcon,
  'eye-slash': EyeSlashIcon,
  'print': PrinterIcon,
  'share': ShareIcon
} as const;

export type IconName = keyof typeof iconMap;

interface IconProps {
  name: IconName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'warning' | 'success' | 'neutral' | 'white';
}

export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 'md', 
  className = '',
  color = 'neutral'
}) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10'
  };

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    warning: 'text-warning',
    success: 'text-success',
    neutral: 'text-neutral',
    white: 'text-white'
  };

  const classes = `${sizeClasses[size]} ${colorClasses[color]} ${className}`;

  return <IconComponent className={classes} />;
}; 

// === COMPONENTES ESPECIALIZADOS PARA WIREFRAMES ===

// Icono de beneficio (Página de Bienvenida)
export const BenefitIcon: React.FC<{
  name: IconName;
  className?: string;
}> = ({ name, className = '' }) => {
  return (
    <div className={`w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 ${className}`}>
      <Icon name={name} size="xl" color="success" />
    </div>
  );
};

// Icono de estado clínico (Ficha Clínica)
export const ClinicalStatusIcon: React.FC<{
  status: 'active' | 'completed' | 'review' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ status, size = 'md', className = '' }) => {
  const statusConfig = {
    active: { name: 'play' as IconName, color: 'success' as const },
    completed: { name: 'success-solid' as IconName, color: 'success' as const },
    review: { name: 'clock' as IconName, color: 'warning' as const },
    warning: { name: 'warning-solid' as IconName, color: 'accent' as const }
  };

  const config = statusConfig[status];

  return (
    <Icon 
      name={config.name} 
      size={size} 
      color={config.color} 
      className={className} 
    />
  );
};

// Icono de navegación (Headers)
export const NavIcon: React.FC<{
  name: IconName;
  isActive?: boolean;
  className?: string;
}> = ({ name, isActive = false, className = '' }) => {
  return (
    <Icon 
      name={name} 
      size="md" 
      color={isActive ? 'accent' : 'neutral'} 
      className={className} 
    />
  );
};

export default Icon; 