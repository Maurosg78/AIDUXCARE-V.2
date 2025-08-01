/**
 * @fileoverview Componente WizardTabs enterprise
 * @author AiDuxCare Development Team
 * @version 1.0.0
 */

import React from 'react';
import { WizardTabsProps, TabType } from '@/types/wizard';
import { I18N_TEXTS } from '@/utils/constants';

const WizardTabs: React.FC<WizardTabsProps> = ({
  activeTab,
  onTabChange,
  disabled = false
}) => {
  const tabs = [
    { id: TabType.LOGIN, label: I18N_TEXTS.tabs.login },
    { id: TabType.REGISTER, label: I18N_TEXTS.tabs.register }
  ];

  return (
    <div className="flex justify-center mb-8" role="tablist">
      <div className="bg-white rounded-full p-1 shadow-lg border border-gray-200">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 border border-gray-200'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => !disabled && onTabChange(tab.id)}
              disabled={disabled}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WizardTabs; 