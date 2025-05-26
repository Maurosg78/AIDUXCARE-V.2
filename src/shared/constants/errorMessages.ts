export const ERROR_MESSAGES = {
  NETWORK: 'Error de conexión al integrar la sugerencia',
  VALIDATION: 'La sugerencia no cumple con los requisitos de validación',
  INTEGRATION: 'Error al integrar la sugerencia',
  UNKNOWN: 'Error al integrar la sugerencia'
} as const;

export type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES]; 