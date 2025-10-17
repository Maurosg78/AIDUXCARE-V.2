# Error Toast System

## Overview
Comprehensive error notification system for AiduxCare that provides user-friendly error messages, success confirmations, and contextual actions.

## Features
- Multiple toast types (error, success, warning, info)
- Contextual error messages for common scenarios
- Action buttons (retry, login, etc.)
- Auto-dismiss with configurable duration
- Manual dismiss capability
- Accessible ARIA attributes
- Visual icons and color coding

## Usage

### Basic Usage
```typescript
import { useErrorToast } from '@/hooks/useErrorToast';

const { showError, showSuccess, showWarning, showInfo } = useErrorToast();

// Basic notifications
showSuccess('Operation completed', 'Your data has been saved successfully');
showError('Failed to save', 'Please check your connection and try again');
```

### Common Error Scenarios
```typescript
const {
  showNetworkError,
  showValidationError,
  showAuthError,
  showApiError
} = useErrorToast();

// Network errors with retry
showNetworkError(() => retryFunction());

// Form validation errors
showValidationError('email');

// Authentication errors
showAuthError(); // Automatically provides login action

// API errors
try {
  await apiCall();
} catch (error) {
  showApiError(error);
}
```

### Integration in Hooks
```typescript
// In custom hooks
export const useDataFetching = () => {
  const { showApiError, showSuccess } = useErrorToast();
  
  const fetchData = async () => {
    try {
      const data = await api.getData();
      showSuccess('Data loaded', 'Information updated successfully');
      return data;
    } catch (error) {
      showApiError(error);
      throw error;
    }
  };
};
```

## Toast Types

### Error (Red)
- Duration: 7 seconds
- Icon: XCircle
- Use for: Failed operations, validation errors, network issues

### Success (Green)
- Duration: 4 seconds
- Icon: CheckCircle
- Use for: Successful operations, confirmations

### Warning (Yellow)
- Duration: 6 seconds
- Icon: AlertCircle
- Use for: Cautionary messages, non-critical issues

### Info (Blue)
- Duration: 5 seconds
- Icon: Info
- Use for: Informational messages, tips

## Implementation Details

### Provider Setup
The `EnhancedToastProvider` is integrated at the app level in `App.tsx`:
```typescript
<EnhancedToastProvider>
  <AppRouter />
</EnhancedToastProvider>
```

### Error Boundary Integration
Use with React Error Boundaries for comprehensive error handling:
```typescript
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## Testing
Demo page available at `/toast-demo` for testing all toast types and scenarios.

## Best Practices

1. **Use appropriate toast types** - Don't use error toasts for informational messages
2. **Provide actionable feedback** - Include retry buttons or next steps when possible
3. **Keep messages concise** - Users should understand the issue quickly
4. **Don't overwhelm** - Avoid showing multiple error toasts simultaneously
5. **Test error scenarios** - Ensure error handling works in all user flows

## Common Integration Points

- API request failures
- Form validation errors
- Authentication issues
- Network connectivity problems
- File upload/download errors
- Save/load operations

The system is designed to provide consistent, user-friendly error communication across the entire application.
