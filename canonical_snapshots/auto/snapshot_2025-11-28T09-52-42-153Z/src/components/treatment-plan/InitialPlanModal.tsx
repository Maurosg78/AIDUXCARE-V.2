/**
 * InitialPlanModal Component
 * 
 * Allows physiotherapists to create a manual initial treatment plan
 * for existing patients who don't have an initial assessment in AiduxCare.
 * 
 * This is used when:
 * - A physiotherapist brings existing patients to AiduxCare
 * - The patient is already in treatment but has no SOAP notes in the system
 * - The physiotherapist wants to document the current treatment plan
 */

import React, { useState } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import treatmentPlanService from '../../services/treatmentPlanService';
import { useAuth } from '../../hooks/useAuth';

interface InitialPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onPlanCreated: () => void;
}

interface PlanFormData {
  interventions: string[];
  modalities: string[];
  homeExercises: string[];
  patientEducation: string[];
  goals: string[];
  followUp: string;
  nextSessionFocus: string;
}

const AVAILABLE_MODALITIES = ['TENS', 'US', 'Tecar therapy', 'Infrared light', 'Shockwave therapy'];

export const InitialPlanModal: React.FC<InitialPlanModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  onPlanCreated,
}) => {
  const [formData, setFormData] = useState<PlanFormData>({
    interventions: [''],
    modalities: [],
    homeExercises: [''],
    patientEducation: [''],
    goals: [''],
    followUp: '',
    nextSessionFocus: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = (field: keyof PlanFormData, value: string = '') => {
    if (field === 'modalities') {
      // Modalities are selected from a list, not added manually
      return;
    }
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value],
    }));
  };

  const handleRemoveItem = (field: keyof PlanFormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }));
  };

  const handleUpdateItem = (field: keyof PlanFormData, index: number, value: string) => {
    setFormData(prev => {
      const updated = [...(prev[field] as string[])];
      updated[index] = value;
      return {
        ...prev,
        [field]: updated,
      };
    });
  };

  const handleToggleModality = (modality: string) => {
    setFormData(prev => {
      const modalities = prev.modalities.includes(modality)
        ? prev.modalities.filter(m => m !== modality)
        : [...prev.modalities, modality];
      return { ...prev, modalities };
    });
  };

  const validateForm = (): boolean => {
    if (formData.interventions.filter(i => i.trim()).length === 0) {
      setError('At least one intervention is required');
      return false;
    }
    if (formData.goals.filter(g => g.trim()).length === 0) {
      setError('At least one goal is required');
      return false;
    }
    if (!formData.nextSessionFocus.trim()) {
      setError('Next session focus is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { user } = useAuth();
      
      if (!user?.uid) {
        setError('User not authenticated');
        setIsSubmitting(false);
        return;
      }
      
      // Clean empty items
      const cleanData = {
        interventions: formData.interventions.filter(i => i.trim()),
        modalities: formData.modalities,
        homeExercises: formData.homeExercises.filter(e => e.trim()),
        patientEducation: formData.patientEducation.filter(e => e.trim()),
        goals: formData.goals.filter(g => g.trim()),
        followUp: formData.followUp.trim() || undefined,
        nextSessionFocus: formData.nextSessionFocus.trim(),
      };

      await treatmentPlanService.createManualInitialPlan(
        patientId,
        patientName,
        user?.uid || 'unknown',
        cleanData
      );

      // Reset form
      setFormData({
        interventions: [''],
        modalities: [],
        homeExercises: [''],
        patientEducation: [''],
        goals: [''],
        followUp: '',
        nextSessionFocus: '',
      });

      onPlanCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating manual initial plan:', err);
      setError(err.message || 'Failed to create treatment plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Create Initial Treatment Plan</h2>
            <p className="text-sm text-slate-500 mt-1">
              For: <span className="font-medium">{patientName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Existing Patient - No Initial Assessment</p>
              <p className="text-xs text-blue-700 mt-1">
                This patient is already in treatment. Please document their current treatment plan so we can track progress in future visits.
              </p>
            </div>
          </div>

          {/* Interventions */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Interventions <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {formData.interventions.map((intervention, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={intervention}
                    onChange={(e) => handleUpdateItem('interventions', index, e.target.value)}
                    placeholder="e.g., Manual therapy to lumbar spine"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                  {formData.interventions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem('interventions', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddItem('interventions')}
                className="text-sm text-primary-blue hover:text-primary-blue-hover flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add intervention
              </button>
            </div>
          </div>

          {/* Modalities */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Modalities
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_MODALITIES.map(modality => (
                <button
                  key={modality}
                  type="button"
                  onClick={() => handleToggleModality(modality)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition ${
                    formData.modalities.includes(modality)
                      ? 'bg-primary-blue text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {modality}
                </button>
              ))}
            </div>
            {formData.modalities.length === 0 && (
              <p className="text-xs text-slate-500 mt-2">No modalities selected (will be saved as "None")</p>
            )}
          </div>

          {/* Home Exercises */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Home Exercises
            </label>
            <div className="space-y-2">
              {formData.homeExercises.map((exercise, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={exercise}
                    onChange={(e) => handleUpdateItem('homeExercises', index, e.target.value)}
                    placeholder="e.g., Quad sets 3x10 daily"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                  {formData.homeExercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem('homeExercises', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddItem('homeExercises')}
                className="text-sm text-primary-blue hover:text-primary-blue-hover flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add exercise
              </button>
            </div>
          </div>

          {/* Patient Education */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Patient Education Topics
            </label>
            <div className="space-y-2">
              {formData.patientEducation.map((topic, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => handleUpdateItem('patientEducation', index, e.target.value)}
                    placeholder="e.g., Posture awareness"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                  {formData.patientEducation.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem('patientEducation', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddItem('patientEducation')}
                className="text-sm text-primary-blue hover:text-primary-blue-hover flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add topic
              </button>
            </div>
          </div>

          {/* Goals */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Treatment Goals <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {formData.goals.map((goal, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => handleUpdateItem('goals', index, e.target.value)}
                    placeholder="e.g., Pain reduction to 3/10"
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                  {formData.goals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem('goals', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => handleAddItem('goals')}
                className="text-sm text-primary-blue hover:text-primary-blue-hover flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add goal
              </button>
            </div>
          </div>

          {/* Follow-up */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Follow-up Appointment
            </label>
            <input
              type="text"
              value={formData.followUp}
              onChange={(e) => setFormData(prev => ({ ...prev, followUp: e.target.value }))}
              placeholder="e.g., Reassess in 2 weeks"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          {/* Next Session Focus */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Next Session Focus <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.nextSessionFocus}
              onChange={(e) => setFormData(prev => ({ ...prev, nextSessionFocus: e.target.value }))}
              placeholder="What should be the focus in the next visit? (e.g., Progress strengthening program, Reassess pain levels)"
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
            <p className="text-xs text-slate-500 mt-1">
              This will be displayed in "Today's Plan" for future visits
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-blue rounded-lg hover:bg-primary-blue-hover disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              'Create Treatment Plan'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

