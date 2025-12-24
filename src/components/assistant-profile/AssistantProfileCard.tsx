import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { Card } from '../../shared/ui/Card';
import { Button } from '../../shared/ui/Button';
import { useProfessionalProfile } from '../../context/ProfessionalProfileContext';
import { EditAssistantProfileModal } from './EditAssistantProfileModal';

// Tipos locales (no tocar core/ai)
interface LocalPracticePreferences {
  tone?: string;
  verbosity?: string;
  preferredTreatments?: string[];
  doNotSuggest?: string[];
  [key: string]: unknown;
}

interface LocalDataUseConsent {
  personalizationFromClinicianInputs?: boolean;
  personalizationFromPatientData?: boolean;
  allowAssistantMemoryAcrossSessions?: boolean;
  useDeidentifiedDataForProductImprovement?: boolean;
  [key: string]: unknown;
}

export const AssistantProfileCard: React.FC = () => {
  const { profile, loading } = useProfessionalProfile();
  // Ajuste 1: isOpen inteligente - abierto si no hay datos, cerrado si ya existen
  const defaultOpen = !profile?.practicePreferences && !profile?.dataUseConsent;
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showEditModal, setShowEditModal] = useState(false);

  if (loading) {
    return (
      <Card className="mb-6">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    );
  }

  const practicePreferences = profile?.practicePreferences as LocalPracticePreferences | undefined;
  const dataUseConsent = profile?.dataUseConsent as LocalDataUseConsent | undefined;

  const hasPreferences = practicePreferences && (
    practicePreferences.tone ||
    practicePreferences.verbosity ||
    (practicePreferences.preferredTreatments && practicePreferences.preferredTreatments.length > 0) ||
    (practicePreferences.doNotSuggest && practicePreferences.doNotSuggest.length > 0)
  );

  const hasConsent = dataUseConsent && (
    dataUseConsent.personalizationFromClinicianInputs !== undefined ||
    dataUseConsent.personalizationFromPatientData !== undefined ||
    dataUseConsent.allowAssistantMemoryAcrossSessions !== undefined ||
    dataUseConsent.useDeidentifiedDataForProductImprovement !== undefined
  );

  return (
    <>
      <Card className="mb-6" variant="outlined">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Your Assistant Profile
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="h-8 w-8"
              >
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>

          {/* Copy */}
          <p className="text-sm text-gray-600 mb-4">
            These settings shape how your Assistant writes and what it suggests. You can change them anytime.
          </p>

          {/* Content (colapsable) */}
          {isOpen && (
            <div className="space-y-4">
              {/* Practice Preferences */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Practice Preferences
                </h4>
                {hasPreferences ? (
                  <div className="space-y-2 text-sm text-gray-700">
                    {practicePreferences.tone && (
                      <div>
                        <span className="font-medium">Tone:</span>{' '}
                        <span className="text-gray-600">{practicePreferences.tone}</span>
                      </div>
                    )}
                    {practicePreferences.verbosity && (
                      <div>
                        <span className="font-medium">Verbosity:</span>{' '}
                        <span className="text-gray-600">{practicePreferences.verbosity}</span>
                      </div>
                    )}
                    {practicePreferences.preferredTreatments && practicePreferences.preferredTreatments.length > 0 && (
                      <div>
                        <span className="font-medium">Preferred Treatments:</span>{' '}
                        <span className="text-gray-600">
                          {practicePreferences.preferredTreatments.join(', ')}
                        </span>
                      </div>
                    )}
                    {practicePreferences.doNotSuggest && practicePreferences.doNotSuggest.length > 0 && (
                      <div>
                        <span className="font-medium">Do Not Suggest:</span>{' '}
                        <span className="text-gray-600">
                          {practicePreferences.doNotSuggest.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Not set yet</p>
                )}
              </div>

              {/* Data Use & Privacy */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Data Use & Privacy
                </h4>
                {hasConsent ? (
                  <div className="space-y-2 text-sm text-gray-700">
                    <div>
                      <span className="font-medium">Personalization from Clinician Inputs:</span>{' '}
                      <span className={dataUseConsent.personalizationFromClinicianInputs ? 'text-green-600' : 'text-gray-600'}>
                        {dataUseConsent.personalizationFromClinicianInputs ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Personalization from Patient Data:</span>{' '}
                      <span className={dataUseConsent.personalizationFromPatientData ? 'text-green-600' : 'text-gray-600'}>
                        {dataUseConsent.personalizationFromPatientData ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    {dataUseConsent.allowAssistantMemoryAcrossSessions !== undefined && (
                      <div>
                        <span className="font-medium">Assistant Memory Across Sessions:</span>{' '}
                        <span className={dataUseConsent.allowAssistantMemoryAcrossSessions ? 'text-green-600' : 'text-gray-600'}>
                          {dataUseConsent.allowAssistantMemoryAcrossSessions ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    )}
                    {dataUseConsent.useDeidentifiedDataForProductImprovement !== undefined && (
                      <div>
                        <span className="font-medium">Use Deidentified Data for Product Improvement:</span>{' '}
                        <span className={dataUseConsent.useDeidentifiedDataForProductImprovement ? 'text-green-600' : 'text-gray-600'}>
                          {dataUseConsent.useDeidentifiedDataForProductImprovement ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Not set yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {showEditModal && (
        <EditAssistantProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
};

