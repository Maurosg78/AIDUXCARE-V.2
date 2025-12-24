import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { useProfessionalProfile } from '../../context/ProfessionalProfileContext';
import logger from '@/shared/utils/logger';

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

interface EditAssistantProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditAssistantProfileModal: React.FC<EditAssistantProfileModalProps> = ({
  isOpen,
  onClose
}) => {
  const { profile, updateProfile, loading } = useProfessionalProfile();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Practice Preferences state
  const [tone, setTone] = useState('');
  const [verbosity, setVerbosity] = useState('');
  const [preferredTreatments, setPreferredTreatments] = useState('');
  const [doNotSuggest, setDoNotSuggest] = useState('');

  // Data Use Consent state
  const [personalizationFromClinicianInputs, setPersonalizationFromClinicianInputs] = useState(false);
  const [personalizationFromPatientData, setPersonalizationFromPatientData] = useState(false);
  const [allowAssistantMemoryAcrossSessions, setAllowAssistantMemoryAcrossSessions] = useState(false);
  const [useDeidentifiedDataForProductImprovement, setUseDeidentifiedDataForProductImprovement] = useState(false);

  // Initialize form from profile
  useEffect(() => {
    if (profile && isOpen) {
      const prefs = profile.practicePreferences as LocalPracticePreferences | undefined;
      const consent = profile.dataUseConsent as LocalDataUseConsent | undefined;

      setTone(prefs?.tone as string || '');
      setVerbosity(prefs?.verbosity as string || '');
      setPreferredTreatments(
        prefs?.preferredTreatments && Array.isArray(prefs.preferredTreatments)
          ? prefs.preferredTreatments.join(', ')
          : ''
      );
      setDoNotSuggest(
        prefs?.doNotSuggest && Array.isArray(prefs.doNotSuggest)
          ? prefs.doNotSuggest.join(', ')
          : ''
      );

      setPersonalizationFromClinicianInputs(consent?.personalizationFromClinicianInputs || false);
      setPersonalizationFromPatientData(consent?.personalizationFromPatientData || false);
      setAllowAssistantMemoryAcrossSessions(consent?.allowAssistantMemoryAcrossSessions || false);
      setUseDeidentifiedDataForProductImprovement(consent?.useDeidentifiedDataForProductImprovement || false);
    }
  }, [profile, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Guardrail B: Normalización simple de arrays desde "coma"
      // split(',') → trim() → filter(Boolean)
      const preferredTreatmentsArray = preferredTreatments
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      
      const doNotSuggestArray = doNotSuggest
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      // Guardrail A: Merge correcto de objetos anidados
      // Preservar todos los campos existentes + agregar/actualizar solo los del form
      const existingPracticePreferences = profile?.practicePreferences ?? {};
      const existingDataUseConsent = profile?.dataUseConsent ?? {};

      const mergedPracticePreferences = {
        ...existingPracticePreferences,
        ...(tone && { tone }),
        ...(verbosity && { verbosity }),
        ...(preferredTreatmentsArray.length > 0 && { preferredTreatments: preferredTreatmentsArray }),
        ...(doNotSuggestArray.length > 0 && { doNotSuggest: doNotSuggestArray }),
      };

      const mergedDataUseConsent = {
        ...existingDataUseConsent,
        personalizationFromClinicianInputs,
        personalizationFromPatientData,
        allowAssistantMemoryAcrossSessions,
        useDeidentifiedDataForProductImprovement,
      };

      const updates: any = {
        practicePreferences: mergedPracticePreferences,
        dataUseConsent: mergedDataUseConsent,
      };

      await updateProfile(updates);
      logger.info('Assistant profile updated successfully');
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar perfil';
      setError(errorMessage);
      logger.error('Error updating assistant profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit Assistant Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* Practice Preferences */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Practice Preferences</h3>
            <div className="space-y-4">
              <Input
                label="Tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="e.g., professional, friendly, concise"
              />
              <Input
                label="Verbosity"
                value={verbosity}
                onChange={(e) => setVerbosity(e.target.value)}
                placeholder="e.g., concise, moderate, detailed"
              />
              <Input
                label="Preferred Treatments (comma-separated)"
                value={preferredTreatments}
                onChange={(e) => setPreferredTreatments(e.target.value)}
                placeholder="e.g., Manual Therapy, Exercise, Ultrasound"
                helperText="Separate multiple treatments with commas"
              />
              <Input
                label="Do Not Suggest (comma-separated)"
                value={doNotSuggest}
                onChange={(e) => setDoNotSuggest(e.target.value)}
                placeholder="e.g., Acupuncture, Dry Needling"
                helperText="Separate multiple items with commas"
              />
            </div>
          </div>

          {/* Data Use & Privacy */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Use & Privacy</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={personalizationFromClinicianInputs}
                  onChange={(e) => setPersonalizationFromClinicianInputs(e.target.checked)}
                  className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Personalization from Clinician Inputs
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={personalizationFromPatientData}
                  onChange={(e) => setPersonalizationFromPatientData(e.target.checked)}
                  className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Personalization from Patient Data
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={allowAssistantMemoryAcrossSessions}
                  onChange={(e) => setAllowAssistantMemoryAcrossSessions(e.target.checked)}
                  className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Allow Assistant Memory Across Sessions
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useDeidentifiedDataForProductImprovement}
                  onChange={(e) => setUseDeidentifiedDataForProductImprovement(e.target.checked)}
                  className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Use Deidentified Data for Product Improvement
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            disabled={loading || !profile}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

