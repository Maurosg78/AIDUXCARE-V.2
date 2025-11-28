/**
 * MVA Form Generator Component
 * 
 * React component for generating MVA forms from SOAP notes.
 * Provides UI for selecting form type, previewing data, and generating PDFs.
 * 
 * Sprint 2B - Day 3-4: MVA Templates
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, AlertCircle, CheckCircle, Eye, X } from 'lucide-react';
import type { SOAPNote } from '../types/vertex-ai';
import type { Session } from '../services/sessionComparisonService';
import { MVATemplateService } from '../services/mvaTemplateService';
import { MVAPdfGenerator } from '../services/mvaPdfGenerator';
import type { MVAFormData, MVAFormType, MVAValidationResult } from '../types/mva';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';
import { SuccessMessage } from './ui/SuccessMessage';

// ============================================================================
// INTERFACES
// ============================================================================

export interface MVAFormGeneratorProps {
  soapNote: SOAPNote;
  session: Session;
  patientData: any;
  professionalData: any;
  insuranceData?: any;
  onGenerate?: (formType: MVAFormType, pdfBlob: Blob) => void;
  onClose?: () => void;
  className?: string;
}

interface MVAFormGeneratorState {
  formType: MVAFormType;
  mvaData: MVAFormData | null;
  validation: MVAValidationResult | null;
  previewMode: 'form' | 'preview';
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const MVAFormGenerator: React.FC<MVAFormGeneratorProps> = ({
  soapNote,
  session,
  patientData,
  professionalData,
  insuranceData,
  onGenerate,
  onClose,
  className = '',
}) => {
  const [state, setState] = useState<MVAFormGeneratorState>({
    formType: 'treatment-plan',
    mvaData: null,
    validation: null,
    previewMode: 'form',
    isLoading: false,
    error: null,
    success: null,
  });

  // Extract MVA data when component mounts or data changes
  useEffect(() => {
    try {
      const extracted = MVATemplateService.extractMVAData(
        soapNote,
        session,
        patientData,
        professionalData,
        insuranceData
      );
      
      // Generate form based on type
      let formData: MVAFormData;
      switch (state.formType) {
        case 'treatment-plan':
          formData = MVATemplateService.generateTreatmentPlan(extracted);
          break;
        case 'treatment-confirmation':
          formData = MVATemplateService.generateTreatmentConfirmation(extracted);
          break;
        case 'treatment-plan-update':
          formData = MVATemplateService.generateTreatmentPlanUpdate(extracted);
          break;
        default:
          formData = extracted;
      }
      
      // Validate data
      const validation = MVATemplateService.validateMVAData(formData);
      
      setState(prev => ({
        ...prev,
        mvaData: formData,
        validation: validation,
        error: validation.valid ? null : validation.errors.join(', '),
      }));
    } catch (error) {
      console.error('[MVAFormGenerator] Error extracting MVA data:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to extract MVA data',
      }));
    }
  }, [soapNote, session, patientData, professionalData, insuranceData, state.formType]);

  // Handle form type change
  const handleFormTypeChange = (newType: MVAFormType) => {
    setState(prev => ({ ...prev, formType: newType, previewMode: 'form' }));
  };

  // Handle PDF generation
  const handleGeneratePDF = () => {
    if (!state.mvaData) {
      setState(prev => ({ ...prev, error: 'No MVA data available' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let pdfBlob: Blob;
      
      switch (state.formType) {
        case 'treatment-plan':
          pdfBlob = MVAPdfGenerator.generateTreatmentPlanPDF(state.mvaData);
          break;
        case 'treatment-confirmation':
          pdfBlob = MVAPdfGenerator.generateTreatmentConfirmationPDF(state.mvaData);
          break;
        case 'treatment-plan-update':
          pdfBlob = MVAPdfGenerator.generateTreatmentPlanUpdatePDF(state.mvaData);
          break;
        default:
          throw new Error(`Unknown form type: ${state.formType}`);
      }

      // Download PDF
      const filename = MVAPdfGenerator.getFilename(
        state.formType,
        state.mvaData.patient.name,
        state.mvaData.reportDate
      );
      MVAPdfGenerator.downloadPDF(pdfBlob, filename);

      // Call callback if provided
      if (onGenerate) {
        onGenerate(state.formType, pdfBlob);
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        success: `MVA form generated successfully: ${filename}`,
      }));

      // Clear success message after 3 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 3000);
    } catch (error) {
      console.error('[MVAFormGenerator] Error generating PDF:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate PDF',
      }));
    }
  };

  // Toggle preview mode
  const handleTogglePreview = () => {
    setState(prev => ({
      ...prev,
      previewMode: prev.previewMode === 'form' ? 'preview' : 'form',
    }));
  };

  // Form type options
  const formTypeOptions: Array<{ value: MVAFormType; label: string; description: string }> = [
    {
      value: 'treatment-plan',
      label: 'Treatment Plan (OCF-18)',
      description: 'Document treatment modalities and goals',
    },
    {
      value: 'treatment-confirmation',
      label: 'Treatment Confirmation (OCF-19)',
      description: 'Confirm treatment provided',
    },
    {
      value: 'treatment-plan-update',
      label: 'Treatment Plan Update (OCF-23)',
      description: 'Update treatment plan with progress',
    },
    {
      value: 'attendant-care-assessment',
      label: 'Attendant Care Assessment (OCF-21)',
      description: 'Assess attendant care needs',
    },
    {
      value: 'treatment-confirmation-update',
      label: 'Treatment Confirmation Update (OCF-24)',
      description: 'Update treatment confirmation',
    },
  ];

  return (
    <div className={`mva-form-generator bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">MVA Form Generator</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Success Message */}
      {state.success && (
        <div className="mb-4">
          <SuccessMessage message={state.success} />
        </div>
      )}

      {/* Error Message */}
      {state.error && (
        <div className="mb-4">
          <ErrorMessage message={state.error} />
        </div>
      )}

      {/* Form Type Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Form Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {formTypeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleFormTypeChange(option.value)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                state.formType === option.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900">{option.label}</div>
              <div className="text-sm text-gray-600 mt-1">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Validation Warnings */}
      {state.validation && state.validation.warnings.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-yellow-800 mb-1">Validation Warnings</div>
              <ul className="list-disc list-inside text-sm text-yellow-700">
                {state.validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {state.validation && !state.validation.valid && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-red-800 mb-1">Validation Errors</div>
              <ul className="list-disc list-inside text-sm text-red-700">
                {state.validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Form Data Preview */}
      {state.mvaData && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Form Data Preview</h3>
            <button
              onClick={handleTogglePreview}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Eye className="w-4 h-4" />
              {state.previewMode === 'form' ? 'Show Preview' : 'Show Form'}
            </button>
          </div>

          {state.previewMode === 'form' ? (
            <FormDataDisplay data={state.mvaData} />
          ) : (
            <FormPreview data={state.mvaData} formType={state.formType} />
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        {state.validation && state.validation.valid && (
          <div className="flex items-center gap-2 text-green-600 mr-auto">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Form data is valid</span>
          </div>
        )}
        
        <button
          onClick={handleGeneratePDF}
          disabled={state.isLoading || !state.mvaData || (state.validation && !state.validation.valid)}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {state.isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Generate & Download PDF</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Form Data Display Component
 */
const FormDataDisplay: React.FC<{ data: MVAFormData }> = ({ data }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
      {/* Patient Info */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Patient Information</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <div><strong>Name:</strong> {data.patient.name}</div>
          <div><strong>DOB:</strong> {data.patient.dateOfBirth.toLocaleDateString()}</div>
          <div><strong>Address:</strong> {data.patient.address}, {data.patient.city}, {data.patient.province}</div>
          {data.patient.claimNumber && (
            <div><strong>MVA Claim #:</strong> {data.patient.claimNumber}</div>
          )}
        </div>
      </div>

      {/* Professional Info */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Professional Information</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <div><strong>Name:</strong> {data.professional.name}</div>
          <div><strong>Registration:</strong> {data.professional.registrationNumber}</div>
          <div><strong>Clinic:</strong> {data.professional.clinicName}</div>
        </div>
      </div>

      {/* Accident Info */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Accident Information</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <div><strong>Date of Accident:</strong> {data.accident.dateOfAccident.toLocaleDateString()}</div>
          <div><strong>Type:</strong> {data.accident.accidentType}</div>
          <div><strong>Location:</strong> {data.accident.location}</div>
          <div><strong>Vehicle Role:</strong> {data.accident.vehicleRole.charAt(0).toUpperCase() + data.accident.vehicleRole.slice(1)}</div>
          <div><strong>Ambulance:</strong> {data.accident.ambulanceRequired ? 'Yes' : 'No'}</div>
          <div><strong>Hospital:</strong> {data.accident.hospitalAdmitted ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {/* Injury Info */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Injury Information</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <div><strong>Primary Injury:</strong> {data.injury.primaryInjury}</div>
          <div><strong>Body Parts:</strong> {data.injury.bodyPartsAffected.join(', ') || 'N/A'}</div>
          {data.injury.painLevel !== undefined && (
            <div><strong>Pain Level:</strong> {data.injury.painLevel}/10</div>
          )}
          {data.injury.symptoms.length > 0 && (
            <div><strong>Symptoms:</strong> {data.injury.symptoms.join(', ')}</div>
          )}
        </div>
      </div>

      {/* Functional Limitations */}
      {data.clinical.functionalLimitations.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Functional Limitations</h4>
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
            {data.clinical.functionalLimitations.map((limitation, index) => (
              <li key={index}>
                {limitation.activity}: {limitation.limitation} ({limitation.severity})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Insurance Info */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Insurance Information</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <div><strong>Company:</strong> {data.insurance.insuranceCompany}</div>
          <div><strong>Policy #:</strong> {data.insurance.policyNumber}</div>
          <div><strong>Claim #:</strong> {data.insurance.claimNumber}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Form Preview Component
 */
const FormPreview: React.FC<{ data: MVAFormData; formType: MVAFormType }> = ({ data, formType }) => {
  const previewContent = useMemo(() => {
    switch (formType) {
      case 'treatment-plan':
        return MVAPdfGenerator.generateTreatmentPlanPDF(data);
      case 'treatment-confirmation':
        return MVAPdfGenerator.generateTreatmentConfirmationPDF(data);
      case 'treatment-plan-update':
        return MVAPdfGenerator.generateTreatmentPlanUpdatePDF(data);
      default:
        return new Blob(['No preview available'], { type: 'text/plain' });
    }
  }, [data, formType]);

  const [previewText, setPreviewText] = useState<string>('');

  useEffect(() => {
    previewContent.text().then((text) => {
      setPreviewText(text);
    });
  }, [previewContent]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
      <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
        {previewText || 'Loading preview...'}
      </pre>
    </div>
  );
};

