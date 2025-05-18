import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onActionClick?: () => void;
  icon?: React.ReactNode;
}

/**
 * Componente para mostrar un estado vacío con un mensaje y posible acción
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onActionClick,
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-lg shadow-sm border border-gray-100">
      {icon ? (
        <div className="mb-4">
          {icon}
        </div>
      ) : (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
      )}
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md">{description}</p>
      
      {actionLabel && onActionClick && (
        <button
          type="button"
          onClick={onActionClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState; 