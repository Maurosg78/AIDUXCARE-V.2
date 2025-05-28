/* eslint-disable jsx-a11y/aria-proptypes */
import React from 'react';
import { cn } from '@/lib/utils';

export type TabVariant = 'default' | 'pills' | 'underline';
export type TabSize = 'sm' | 'md' | 'lg';

export interface Tab {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: Tab[];
  variant?: TabVariant;
  size?: TabSize;
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

const variantStyles: Record<TabVariant, string> = {
  default: 'border-b border-gray-200',
  pills: 'space-x-2',
  underline: 'border-b border-gray-200',
};

const tabStyles: Record<TabVariant, string> = {
  default: 'border-b-2 border-transparent hover:border-gray-300',
  pills: 'rounded-full px-4 py-2 hover:bg-gray-100',
  underline: 'border-b-2 border-transparent hover:border-gray-300',
};

const activeTabStyles: Record<TabVariant, string> = {
  default: 'border-primary-500 text-primary-600',
  pills: 'bg-primary-500 text-white hover:bg-primary-600',
  underline: 'border-primary-500 text-primary-600',
};

const sizeStyles: Record<TabSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      tabs,
      variant = 'default',
      size = 'md',
      defaultTab,
      onChange,
      className,
    },
    ref
  ) => {
    const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id);

    const handleTabClick = (tabId: string) => {
      setActiveTab(tabId);
      onChange?.(tabId);
    };

    return (
      <div ref={ref} className={cn('w-full', className)}>
        {/* Tab List */}
        <div
          className={cn(
            'flex',
            variantStyles[variant],
            className
          )}
          role="tablist"
        >
          {tabs.map((tab) => (
            <React.Fragment key={tab.id}>
              {/* eslint-disable-next-line jsx-a11y/aria-proptypes */}
              <button
                role="tab"
                aria-selected={activeTab === tab.id ? 'true' : 'false'}
                aria-controls={`panel-${tab.id}`}
                disabled={tab.disabled}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'px-4 py-2 font-medium transition-colors',
                  sizeStyles[size],
                  tabStyles[variant],
                  activeTab === tab.id && activeTabStyles[variant],
                  tab.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {tab.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Tab Panels */}
        <div className="mt-4">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              role="tabpanel"
              id={`panel-${tab.id}`}
              aria-labelledby={tab.id}
              hidden={activeTab !== tab.id}
              className={cn(
                'outline-none',
                activeTab === tab.id ? 'block' : 'hidden'
              )}
            >
              {tab.content}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

Tabs.displayName = 'Tabs'; 