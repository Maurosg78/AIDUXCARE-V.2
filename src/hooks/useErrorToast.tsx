import { useEnhancedToast } from './useEnhancedToast';

export function useErrorToast() {
  const { toast } = useEnhancedToast();

  const showError = (title: string, description?: string, action?: { label: string; onClick: () => void }) => {
    toast({
      type: 'error',
      title,
      description,
      action,
      duration: 7000, // Longer duration for errors
    });
  };

  const showSuccess = (title: string, description?: string) => {
    toast({
      type: 'success',
      title,
      description,
      duration: 4000,
    });
  };

  const showWarning = (title: string, description?: string) => {
    toast({
      type: 'warning',
      title,
      description,
      duration: 6000,
    });
  };

  const showInfo = (title: string, description?: string) => {
    toast({
      type: 'info',
      title,
      description,
      duration: 5000,
    });
  };

  // Common error scenarios
  const showNetworkError = (retry?: () => void) => {
    showError(
      'Network Error',
      'Unable to connect to the server. Please check your internet connection.',
      retry ? { label: 'Retry', onClick: retry } : undefined
    );
  };

  const showValidationError = (field: string) => {
    showError(
      'Validation Error',
      `Please check the ${field} field and try again.`
    );
  };

  const showAuthError = () => {
    showError(
      'Authentication Required',
      'Your session has expired. Please log in again.',
      {
        label: 'Log In',
        onClick: () => {
          // Redirect to login
          window.location.href = '/login';
        }
      }
    );
  };

  const showApiError = (error: Error | string) => {
    const message = error instanceof Error ? error.message : error;
    showError(
      'Request Failed',
      message || 'An unexpected error occurred. Please try again.'
    );
  };

  return {
    showError,
    showSuccess,
    showWarning,
    showInfo,
    showNetworkError,
    showValidationError,
    showAuthError,
    showApiError,
  };
}
