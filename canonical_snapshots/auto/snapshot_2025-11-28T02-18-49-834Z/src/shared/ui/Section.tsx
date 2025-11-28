import React from 'react';

export interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({
  title,
  description,
  children,
  collapsible = false,
  defaultOpen = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  if (collapsible) {
    return (
      <div className={`border border-slate-200 rounded-lg ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-in-500 focus:ring-inset rounded-t-lg"
        >
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description && (
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-slate-400 transform transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="px-4 pb-4 border-t border-slate-200">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="text-sm text-slate-500">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};
