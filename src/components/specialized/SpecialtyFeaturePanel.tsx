/**
 * 🎯 SPECIALTY FEATURE PANEL - PANEL DE CARACTERÍSTICAS POR ESPECIALIDAD
 */

import React, { useState } from 'react';
import { 
  specialtyFeatureService, 
  MedicalSpecialty, 
  SpecialtyFeature, 
  SpecialtyProfile 
} from '../../services/SpecialtyFeatureService';

interface SpecialtyFeaturePanelProps {
  currentSpecialty: MedicalSpecialty;
  onFeatureSelect?: (featureId: string) => void;
  compact?: boolean;
}

const SpecialtyFeaturePanel: React.FC<SpecialtyFeaturePanelProps> = ({
  currentSpecialty,
  onFeatureSelect,
  compact = false
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'beta' | 'discovery'>('active');
  
  const profile = specialtyFeatureService.getSpecialtyProfile(currentSpecialty);
  const activeFeatures = specialtyFeatureService.getActiveFeatures(currentSpecialty);
  const betaFeatures = specialtyFeatureService.getBetaFeatures(currentSpecialty);
  const discoveryAreas = specialtyFeatureService.getDiscoveryAreas(currentSpecialty);

  if (compact) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-[#BDC3C7]/20">
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-2xl">{profile.icon}</span>
          <div>
            <h3 className="font-semibold text-[#2C3E50] text-sm">{profile.displayName}</h3>
            <span className="text-xs text-[#2C3E50]/60">{profile.currentMaturity}</span>
          </div>
        </div>

        <div className="space-y-2">
          {activeFeatures.slice(0, 2).map((feature) => (
            <div key={feature.id} className="p-2 bg-[#F7F7F7] rounded-lg">
              <span className="text-sm font-medium text-[#2C3E50]">{feature.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#BDC3C7]/20">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-[#A8E6CF]/20">
          {profile.icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#2C3E50]">{profile.displayName}</h3>
          <span className="text-sm text-[#2C3E50]/60">{profile.currentMaturity}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-4 bg-[#F7F7F7] rounded-lg p-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 px-3 py-2 rounded-md text-sm ${
            activeTab === 'active' ? 'bg-white text-[#2C3E50]' : 'text-[#2C3E50]/60'
          }`}
        >
          Activas ({activeFeatures.length})
        </button>
        <button
          onClick={() => setActiveTab('beta')}
          className={`flex-1 px-3 py-2 rounded-md text-sm ${
            activeTab === 'beta' ? 'bg-white text-[#2C3E50]' : 'text-[#2C3E50]/60'
          }`}
        >
          Beta ({betaFeatures.length})
        </button>
        <button
          onClick={() => setActiveTab('discovery')}
          className={`flex-1 px-3 py-2 rounded-md text-sm ${
            activeTab === 'discovery' ? 'bg-white text-[#2C3E50]' : 'text-[#2C3E50]/60'
          }`}
        >
          Descubrimiento ({discoveryAreas.length})
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {activeTab === 'active' && activeFeatures.map((feature) => (
          <div key={feature.id} className="p-3 border border-[#BDC3C7]/20 rounded-lg">
            <h4 className="font-medium text-[#2C3E50]">{feature.name}</h4>
            <p className="text-sm text-[#2C3E50]/70 mt-1">{feature.description}</p>
          </div>
        ))}

        {activeTab === 'beta' && betaFeatures.map((feature) => (
          <div key={feature.id} className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
            <h4 className="font-medium text-[#2C3E50]">{feature.name}</h4>
            <p className="text-sm text-[#2C3E50]/70 mt-1">{feature.description}</p>
          </div>
        ))}

        {activeTab === 'discovery' && discoveryAreas.map((area, index) => (
          <div key={index} className="p-3 bg-[#8B7ED8]/10 rounded-lg">
            <p className="text-sm text-[#2C3E50]">{area}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpecialtyFeaturePanel;