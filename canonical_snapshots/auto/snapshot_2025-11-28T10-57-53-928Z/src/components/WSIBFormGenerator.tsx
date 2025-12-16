/**
 * WSIB Form Generator Component
 * 
 * React component for generating WSIB forms from SOAP notes.
 * Provides UI for selecting form type, previewing data, and generating PDFs.
 * 
 * Sprint 2B - Day 1: WSIB Templates
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, AlertCircle, CheckCircle, Eye, X } from 'lucide-react';
import type { SOAPNote } from '../types/vertex-ai';
import type { Session } from '../services/sessionComparisonService';
import { WSIBTemplateService } from '../services/wsibTemplateService';
import { WSIBPdfGenerator } from '../services/wsibPdfGenerator';
import type { WSIBFormData, WSIBFormType, WSIBValidationResult } from '../types/wsib';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';
import { SuccessMessage } from './ui/SuccessMessage';

// ============================================================================
// INTERFACES
// ============================================================================

export interface WSIBFormGeneratorProps {
  soapNote: SOAPNote;
  session: Session;
  patientData: any;
  professionalData: any;
  onGenerate?: (formType: WSIBFormType, pdfBlob: Blob) => void;
  onClose?: () => void;
  className?: string;
}

interface WSIBFormGeneratorState {
  formType: WSIBFormType;
  wsibData: WSIBFormData | null;
  validation: WSIBValidationResult | null;
  previewMode: 'form' | 'preview';
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const WSIBFormGenerator: React.FC<WSIBFormGeneratorProps> = ({
  soapNote,
  session,
  patientData,
  professionalData,
  onGenerate,
  onClose,
  className = '',
}) => {
  const [state, setState] = useState<WSIBFormGeneratorState>({
    formType: 'functional-abilities-form',
    wsibData: null,
    validation: null,
    previewMode: 'form',
    isLoading: false,
    error: null,
    success: null,
  });

  // Extract WSIB data when component mounts or data changes
  useEffect(() => {
    try {
      const extracted = WSIBTemplateService.extractWSIBData(
        soapNote,
        session,
        patientData,
        professionalData
      );
      
      // Generate form based on type
      let formData: WSIBFormData;
      switch (state.formType) {
        case 'functional-abilities-form':
          formData = WSIBTemplateService.generateFunctionalAbilitiesForm(extracted);
          break;
        case 'treatment-plan':
          formData = WSIBTemplateService.generateTreatmentPlan(extracted);
          break;
        case 'progress-report':
          formData = WSIBTemplateService.generateProgressReport(extracted);
          break;
        case 'return-to-work-assessment':
          formData = WSIBTemplateService.generateReturnToWorkAssessment(extracted);
          break;
        default:
          formData = extracted;
      }
      
      // Validate data
      const validation = WSIBTemplateService.validateWSIBData(formData);
      
      setState(prev => ({
        ...prev,
        wsibData: formData,
        validation: validation,
        error: validation.valid ? null : validation.errors.join(', '),
      }));
    } catch (error) {
      console.error('[WSIBFormGenerator] Error extracting WSIB data:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to extract WSIB data',
      }));
    }
  }, [soapNote, session, patientData, professionalData, state.formType]);

  // Handle form type change
  const handleFormTypeChange = (newType: WSIBFormType) => {
    setState(prev => ({ ...prev, formType: newType, previewMode: 'form' }));
  };

  // Handle PDF generation
  const handleGeneratePDF = () => {
    if (!state.wsibData) {
      setState(prev => ({ ...prev, error: 'No WSIB data available' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let pdfBlob: Blob;
      
      switch (state.formType) {
        case 'functional-abilities-form':
          pdfBlob = WSIBPdfGenerator.generateFAF8PDF(state.wsibData);
          break;
        case 'treatment-plan':
          pdfBlob = WSIBPdfGenerator.generateTreatmentPlanPDF(state.wsibData);
          break;
        case 'progress-report':
          pdfBlob = WSIBPdfGenerator.generateProgressReportPDF(state.wsibData);
          break;
        case 'return-to-work-assessment':
          pdfBlob = WSIBPdfGenerator.generateRTWAssessmentPDF(state.wsibData);
          break;
        default:
          throw new Error(`Unknown form type: ${state.formType}`);
      }

      // Download PDF
      const filename = WSIBPdfGenerator.getFilename(
        state.formType,
        state.wsibData.patient.name,
        state.wsibData.reportDate
      );
      WSIBPdfGenerator.downloadPDF(pdfBlob, filename);

      // Call callback if provided
      if (onGenerate) {
        onGenerate(state.formType, pdfBlob);
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        success: `WSIB form generated successfully: ${filename}`,
      }));

      // Clear success message after 3 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 3000);
    } catch (error) {
      console.error('[WSIBFormGenerator] Error generating PDF:', error);
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
  const formTypeOptions: Array<{ value: WSIBFormType; label: string; description: string }> = [
    {
      value: 'functional-abilities-form',
      label: 'Functional Abilities Form (FAF-8)',
      description: 'Assess functional limitations and work capacity',
    },
    {
      value: 'treatment-plan',
      label: 'Treatment Plan',
      description: 'Document treatment modalities and goals',
    },
    {
      value: 'progress-report',
      label: 'Progress Report',
      description: 'Report on patient progress and changes',
    },
    {
      value: 'return-to-work-assessment',
      label: 'Return-to-Work Assessment',
      description: 'Assess readiness for return to work',
    },
  ];

  return (
    <div className={`wsib-form-generator bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">WSIB Form Generator</h2>
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
      {state.wsibData && (
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
            <FormDataDisplay data={state.wsibData} />
          ) : (
            <FormPreview data={state.wsibData} formType={state.formType} />
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
          disabled={state.isLoading || !state.wsibData || (state.validation && !state.validation.valid)}
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
const FormDataDisplay: React.FC<{ data: WSIBFormData }> = ({ data }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
      {/* Patient Info */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Patient Information</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <div><strong>Name:</strong> {data.patient.name}</div>
          <div><strong>DOB:</strong> {data.patient.dateOfBirth.toLocaleDateString()}</div>
          <div><strong>Address:</strong> {data.patient.address}, {data.patient.city}, {data.patient.province}</div>
          {data.patient.wsibClaimNumber && (
            <div><strong>WSIB Claim #:</strong> {data.patient.wsibClaimNumber}</div>
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

      {/* Injury Info */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Injury Information</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <div><strong>Date of Injury:</strong> {data.injury.dateOfInjury.toLocaleDateString()}</div>
          <div><strong>Mechanism:</strong> {data.injury.mechanismOfInjury}</div>
          <div><strong>Body Parts:</strong> {data.injury.bodyPartAffected.join(', ') || 'N/A'}</div>
        </div>
      </div>

      {/* Functional Limitations */}
      {data.clinical.functionalLimitations.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Functional Limitations</h4>
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
            {data.clinical.functionalLimitations.map((limitation, index) => (
              <li key={index}>
                {limitation.activity}: {limitation.limitation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Work Restrictions */}
      {data.clinical.workRestrictions.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Work Restrictions</h4>
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
            {data.clinical.workRestrictions.map((restriction, index) => (
              <li key={index}>{restriction.restriction}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Form Preview Component
 */
const FormPreview: React.FC<{ data: WSIBFormData; formType: WSIBFormType }> = ({ data, formType }) => {
  const previewContent = useMemo(() => {
    switch (formType) {
      case 'functional-abilities-form':
        return WSIBPdfGenerator.generateFAF8PDF(data);
      case 'treatment-plan':
        return WSIBPdfGenerator.generateTreatmentPlanPDF(data);
      case 'progress-report':
        return WSIBPdfGenerator.generateProgressReportPDF(data);
      case 'return-to-work-assessment':
        return WSIBPdfGenerator.generateRTWAssessmentPDF(data);
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

