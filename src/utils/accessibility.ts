/**
 * @fileoverview Utilidades de accesibilidad enterprise
 * @author AiDuxCare Development Team
 * @version 1.0.0
 */

import { AccessibilityProps, AccessibilityAnnouncement } from '@/types/wizard';

/**
 * Genera props de accesibilidad para elementos de formulario
 */
export const getAccessibilityProps = (
  fieldName: string,
  hasError: boolean = false,
  isRequired: boolean = false,
  isDisabled: boolean = false
): AccessibilityProps => {
  return {
    'aria-label': fieldName,
    'aria-describedby': hasError ? `${fieldName}-error` : undefined,
    'aria-invalid': hasError,
    'aria-required': isRequired,
    'aria-disabled': isDisabled,
    role: 'textbox',
    tabIndex: isDisabled ? -1 : 0
  };
};

/**
 * Genera props de accesibilidad para checkboxes
 */
export const getCheckboxAccessibilityProps = (
  id: string,
  hasError: boolean = false,
  isRequired: boolean = false,
  isDisabled: boolean = false
): AccessibilityProps => {
  return {
    'aria-describedby': hasError ? `${id}-error` : undefined,
    'aria-invalid': hasError,
    'aria-required': isRequired,
    'aria-disabled': isDisabled,
    role: 'checkbox',
    tabIndex: isDisabled ? -1 : 0
  };
};

/**
 * Anuncia cambios a lectores de pantalla
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remover después de un breve delay
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Maneja navegación por teclado
 */
export const handleKeyboardNavigation = (
  event: KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  onNavigate: (index: number) => void
): void => {
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % totalItems;
      onNavigate(nextIndex);
      break;
      
    case 'ArrowUp':
    case 'ArrowLeft':
      event.preventDefault();
      const prevIndex = currentIndex === 0 ? totalItems - 1 : currentIndex - 1;
      onNavigate(prevIndex);
      break;
      
    case 'Home':
      event.preventDefault();
      onNavigate(0);
      break;
      
    case 'End':
      event.preventDefault();
      onNavigate(totalItems - 1);
      break;
  }
};

/**
 * Enfoca el primer elemento de error
 */
export const focusFirstError = (errorFields: string[]): void => {
  if (errorFields.length > 0) {
    const firstErrorField = document.getElementById(errorFields[0]);
    if (firstErrorField) {
      firstErrorField.focus();
      announceToScreenReader('Error de validación encontrado');
    }
  }
};

/**
 * Genera ID único para elementos de accesibilidad
 */
export const generateAccessibilityId = (prefix: string, suffix: string): string => {
  return `${prefix}-${suffix}-${Date.now()}`;
};

/**
 * Valida si el elemento es accesible por teclado
 */
export const isKeyboardAccessible = (element: HTMLElement): boolean => {
  const tabIndex = element.getAttribute('tabindex');
  return tabIndex !== '-1' && !element.hasAttribute('disabled');
};

/**
 * Configura focus trap para modales
 */
export const setupFocusTrap = (container: HTMLElement): (() => void) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  const handleTabKey = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  };
  
  container.addEventListener('keydown', handleTabKey);
  
  // Enfocar el primer elemento
  if (firstElement) {
    firstElement.focus();
  }
  
  // Retornar función de limpieza
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}; 