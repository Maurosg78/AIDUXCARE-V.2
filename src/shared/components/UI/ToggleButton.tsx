import React from 'react';

interface ToggleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isExpanded?: boolean;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({ 
  children, 
  isExpanded,
  ...props 
}) => {
  return (
    <button
      type="button"
      className="text-sm text-blue-600 hover:text-blue-800"
      {...props}
    >
      {children || (isExpanded ? 'Mostrar menos' : 'Mostrar más')}
    </button>
  );
}; 