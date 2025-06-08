import React from 'react';
import {
  // Iconos médicos y sanitarios
  HeartIcon,
  UserIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  // Iconos de navegación
  HomeIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ArrowRightIcon,
  // Iconos de acción
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  // Iconos de estado
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  // Iconos de funcionalidad
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  DocumentIcon,
  // Iconos específicos para EMR
  ClipboardDocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  ComputerDesktopIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Mapeo de nombres amigables a componentes de Heroicons
const iconMap = {
  // Médicos y sanitarios
  'heart': HeartIcon,
  'user': UserIcon,
  'document': DocumentTextIcon,
  'clipboard': ClipboardDocumentListIcon,
  // Navegación
  'home': HomeIcon,
  'chevron-right': ChevronRightIcon,
  'chevron-left': ChevronLeftIcon,
  'arrow-right': ArrowRightIcon,
  // Acciones
  'plus': PlusIcon,
  'check': CheckIcon,
  'close': XMarkIcon,
  'edit': PencilIcon,
  // Estados
  'warning': ExclamationTriangleIcon,
  'info': InformationCircleIcon,
  'success': CheckCircleIcon,
  // Funcionalidad
  'search': MagnifyingGlassIcon,
  'settings': Cog6ToothIcon,
  'profile': UserCircleIcon,
  'file': DocumentIcon,
  // EMR específicos
  'medical-record': ClipboardDocumentCheckIcon,
  'analysis': DocumentMagnifyingGlassIcon,
  'chat': ChatBubbleLeftRightIcon,
  'computer': ComputerDesktopIcon,
  'ai': SparklesIcon
} as const;

export type IconName = keyof typeof iconMap;

interface IconProps {
  name: IconName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'warning' | 'success' | 'neutral';
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
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  };

  const colorClasses = {
    primary: 'text-aidux-primary',
    secondary: 'text-aidux-secondary',
    accent: 'text-aidux-accent',
    warning: 'text-aidux-warning',
    success: 'text-aidux-success',
    neutral: 'text-aidux-dark'
  };

  const classes = `${sizeClasses[size]} ${colorClasses[color]} ${className}`;

  return <IconComponent className={classes} />;
}; 