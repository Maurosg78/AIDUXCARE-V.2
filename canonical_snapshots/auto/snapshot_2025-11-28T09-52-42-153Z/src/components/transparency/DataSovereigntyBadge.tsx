import React from 'react';

interface DataSovereigntyBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  className?: string;
}

/**
 * DataSovereigntyBadge Component
 * 
 * Displays a badge indicating 100% Canadian data sovereignty.
 * This is a key competitive advantage vs Jane.app and other US-based solutions.
 * 
 * @param size - Size of the badge ('sm', 'md', 'lg')
 * @param showDescription - Whether to show the description text below the badge
 * @param className - Additional CSS classes
 */
export const DataSovereigntyBadge: React.FC<DataSovereigntyBadgeProps> = ({ 
  size = 'md',
  showDescription = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };
  
  return (
    <div className={className}>
      <div className={`inline-flex items-center bg-green-100 text-green-800 
                       rounded-full font-medium border border-green-200 ${sizeClasses[size]}`}>
        <span className="mr-1.5 text-base">🇨🇦</span>
        <span>100% Canadian Data</span>
      </div>
      {showDescription && (
        <p className="text-sm text-gray-600 mt-2">
          Your data stays in Canada. No cross-border processing.
        </p>
      )}
    </div>
  );
};

