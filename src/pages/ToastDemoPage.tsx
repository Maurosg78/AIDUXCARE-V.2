import React from 'react';
import { useErrorToast } from '@/hooks/useErrorToast';
import Button from '@/components/ui/button';

export default function ToastDemoPage() {
  const {
    showError,
    showSuccess,
    showWarning,
    showInfo,
    showNetworkError,
    showValidationError,
    showAuthError,
    showApiError
  } = useErrorToast();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Toast System Demo</h1>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Basic Toast Types</h2>
          
          <Button 
            onClick={() => showSuccess('Success!', 'Operation completed successfully')}
            className="w-full"
          >
            Show Success Toast
          </Button>
          
          <Button 
            onClick={() => showError('Error!', 'Something went wrong')}
            className="w-full"
          >
            Show Error Toast
          </Button>
          
          <Button 
            onClick={() => showWarning('Warning!', 'Please review your input')}
            className="w-full"
          >
            Show Warning Toast
          </Button>
          
          <Button 
            onClick={() => showInfo('Info', 'Here is some useful information')}
            className="w-full"
          >
            Show Info Toast
          </Button>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Common Error Scenarios</h2>
          
          <Button 
            onClick={() => showNetworkError(() => alert('Retry clicked!'))}
            className="w-full"
          >
            Network Error (with retry)
          </Button>
          
          <Button 
            onClick={() => showValidationError('email')}
            className="w-full"
          >
            Validation Error
          </Button>
          
          <Button 
            onClick={() => showAuthError()}
            className="w-full"
          >
            Auth Error
          </Button>
          
          <Button 
            onClick={() => showApiError(new Error('Database connection failed'))}
            className="w-full"
          >
            API Error
          </Button>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Examples:</h3>
        <pre className="text-sm text-gray-700">
{`// Basic usage
const { showError, showSuccess } = useErrorToast();

// In try/catch blocks
try {
  await saveNote();
  showSuccess('Note saved', 'Your clinical note has been saved successfully');
} catch (error) {
  showApiError(error);
}

// Network requests
fetch('/api/notes')
  .catch(() => showNetworkError(() => retryFunction()));`}
        </pre>
      </div>
    </div>
  );
}
