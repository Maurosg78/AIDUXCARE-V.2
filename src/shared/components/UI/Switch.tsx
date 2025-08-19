import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';

interface CustomProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  children?: ReactNode;
}

export const Switch = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & CustomProps>(
  ({ checked, onChange, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        role="switch"
        aria-checked={checked ? 'true' : 'false'}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        {...props}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
        {children}
      </button>
    );
  }
);

Switch.displayName = 'Switch';
