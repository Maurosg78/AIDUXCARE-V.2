import React, { useState, useCallback } from 'react';
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

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  variant = 'default',
  size = 'md',
  defaultTab = tabs[0]?.id,
  onChange,
  className
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabClick = useCallback((tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  }, [onChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, tabId: string) => {
    const currentIndex = tabs.findIndex(tab => tab.id === tabId);
    const nextIndex = (currentIndex + 1) % tabs.length;
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        handleTabClick(tabs[nextIndex].id);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        handleTabClick(tabs[prevIndex].id);
        break;
      case 'Home':
        event.preventDefault();
        handleTabClick(tabs[0].id);
        break;
      case 'End':
        event.preventDefault();
        handleTabClick(tabs[tabs.length - 1].id);
        break;
    }
  }, [tabs, handleTabClick]);

  // Encontrar el tab activo para renderizado condicional
  const activeTabContent = tabs.find(tab => tab.id === activeTab);

  return (
    <div className={cn('w-full', className)}>
      <div 
        className={cn('flex', variantStyles[variant])} 
        role="tablist"
        aria-label="Tabs de navegación"
      >
        {tabs.map((tab, index) => {
          const isSelected = activeTab === tab.id;
          const isDisabled = tab.disabled;
          
          return (
            <button
              key={index}
              role="tab"
              aria-selected={isSelected}
              aria-controls={`tabpanel-${index}`}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              onClick={() => handleTabClick(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
              className={cn(
                'px-4 py-2 font-medium transition-colors',
                sizeStyles[size],
                tabStyles[variant],
                isSelected && activeTabStyles[variant],
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
              tabIndex={isSelected ? 0 : -1}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAREA 2: Renderizado condicional - solo renderiza el contenido del tab activo */}
      <div className="mt-4">
        {activeTabContent && (
          <div
            role="tabpanel"
            id={`tabpanel-${tabs.findIndex(tab => tab.id === activeTab)}`}
            aria-labelledby={`tab-${tabs.findIndex(tab => tab.id === activeTab)}`}
            className="outline-none"
          >
            {activeTabContent.content}
          </div>
        )}
      </div>
    </div>
  );
};

Tabs.displayName = 'Tabs'; 