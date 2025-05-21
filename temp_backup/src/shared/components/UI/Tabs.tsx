import React from 'react';

interface TabOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  options: TabOption[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ options, activeTab, onChange }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {options.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={`
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              flex items-center py-4 px-1 border-b-2 font-medium text-sm
            `}
            disabled={tab.disabled}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Tabs; 