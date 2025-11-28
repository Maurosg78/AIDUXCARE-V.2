/**
 * Tipos e interfaces para componentes UI compartidos
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import React from 'react';

/**
 * Props para el componente PageHeader
 */
export interface PageHeaderProps {
  /** Título principal del header */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Acciones adicionales (botones, enlaces, etc.) */
  actions?: React.ReactNode;
  /** Indica si mostrar botón de regreso */
  showBackButton?: boolean;
  /** Callback para navegación hacia atrás */
  onBack?: () => void;
}

/**
 * Props para el modal de recuperación de email
 */
export interface EmailRecoveryModalProps {
  /** Indica si el modal está abierto */
  isOpen: boolean;
  /** Email del usuario */
  email: string;
  /** Resultado de la validación del email */
  validationResult: {
    isValid: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  };
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Callback para recuperación de contraseña */
  onPasswordRecovery: () => Promise<void>;
  /** Callback para activación de cuenta */
  onAccountActivation: () => Promise<void>;
  /** Callback para continuar con el registro */
  onContinueRegistration: () => void;
}

/**
 * Props para el selector de código de país
 */
export interface CountryCodeSelectorProps {
  /** Código de país seleccionado */
  value: string;
  /** Callback cuando cambia la selección */
  onChange: (code: string) => void;
  /** Indica si el selector está deshabilitado */
  disabled?: boolean;
  /** Lista de países disponibles */
  countries?: Array<{
    code: string;
    name: string;
    flag: string;
    dialCode: string;
  }>;
}

/**
 * Props para componentes de formulario base
 */
export interface BaseFormProps {
  /** Indica si el formulario está cargando */
  loading?: boolean;
  /** Indica si el formulario está deshabilitado */
  disabled?: boolean;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Props para componentes de validación
 */
export interface ValidationProps {
  /** Indica si hay un error */
  hasError?: boolean;
  /** Mensaje de error */
  errorMessage?: string;
  /** Indica si el campo es requerido */
  required?: boolean;
  /** Indica si el campo es válido */
  isValid?: boolean;
}
