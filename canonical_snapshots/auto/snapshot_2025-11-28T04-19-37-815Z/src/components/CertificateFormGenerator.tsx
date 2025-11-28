/**
 * Certificate Form Generator Component
 * 
 * React component for generating medical certificates from SOAP notes.
 * Provides UI for selecting certificate type, previewing data, and generating PDFs.
 * 
 * Sprint 2B - Day 5: Certificate Templates
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, AlertCircle, CheckCircle, Eye, X } from 'lucide-react';
import type { SOAPNote } from '../types/vertex-ai';
import type { Session } from '../services/sessionComparisonService';
import { CertificateTemplateService } from '../services/certificateTemplateService';
import { CertificatePdfGenerator } from '../services/certificatePdfGenerator';
import type { CertificateData, CertificateType, CertificateValidationResult } from '../types/certificate';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';
import { SuccessMessage } from './ui/SuccessMessage';

// ============================================================================
// INTERFACES
// ============================================================================

export interface CertificateFormGeneratorProps {
  soapNote: SOAPNote;
  session: Session;
  patientData: any;
  professionalData: any;
  onGenerate?: (certificateType: CertificateType, pdfBlob: Blob) => void;
  onClose?: () => void;
  className?: string;
}

interface CertificateFormGeneratorState {
  certificateType: CertificateType;
  certificateData: CertificateData | null;
  validation: CertificateValidationResult | null;
  previewMode: 'form' | 'preview';
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const CertificateFormGenerator: React.FC<CertificateFormGeneratorProps> = ({
  soapNote,
  session,
  patientData,
  professionalData,
  onGenerate,
  onClose,
  className = '',
}) => {
  const [state, setState] = useState<CertificateFormGeneratorState>({
    certificateType: 'medical-certificate',
    certificateData: null,
    validation: null,
    previewMode: 'form',
    isLoading: false,
    error: null,
    success: null,
  });

  // Extract certificate data when component mounts or data changes
  useEffect(() => {
    try {
      const extracted = CertificateTemplateService.extractCertificateData(
        soapNote,
        session,
        patientData,
        professionalData,
        state.certificateType
      );
      
      // Generate certificate based on type
      let certData: CertificateData;
      switch (state.certificateType) {
        case 'medical-certificate':
          certData = CertificateTemplateService.generateMedicalCertificate(extracted);
          break;
        case 'return-to-work-certificate':
          certData = CertificateTemplateService.generateReturnToWorkCertificate(extracted);
          break;
        case 'fitness-to-work-certificate':
          certData = CertificateTemplateService.generateFitnessToWorkCertificate(extracted);
          break;
        case 'disability-certificate':
          certData = CertificateTemplateService.generateDisabilityCertificate(extracted);
          break;
        case 'accommodation-certificate':
          certData = CertificateTemplateService.generateAccommodationCertificate(extracted);
          break;
        default:
          certData = extracted;
      }
      
      // Validate data
      const validation = CertificateTemplateService.validateCertificateData(certData);
      
      setState(prev => ({
        ...prev,
        certificateData: certData,
        validation: validation,
        error: validation.valid ? null : validation.errors.join(', '),
      }));
    } catch (error) {
      console.error('[CertificateFormGenerator] Error extracting certificate data:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to extract certificate data',
      }));
    }
  }, [soapNote, session, patientData, professionalData, state.certificateType]);

  // Handle certificate type change
  const handleCertificateTypeChange = (newType: CertificateType) => {
    setState(prev => ({ ...prev, certificateType: newType, previewMode: 'form' }));
  };

  // Handle PDF generation
  const handleGeneratePDF = () => {
    if (!state.certificateData) {
      setState(prev => ({ ...prev, error: 'No certificate data available' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let pdfBlob: Blob;
      
      switch (state.certificateType) {
        case 'medical-certificate':
          pdfBlob = CertificatePdfGenerator.generateMedicalCertificatePDF(state.certificateData);
          break;
        case 'return-to-work-certificate':
          pdfBlob = CertificatePdfGenerator.generateReturnToWorkCertificatePDF(state.certificateData);
          break;
        case 'fitness-to-work-certificate':
          pdfBlob = CertificatePdfGenerator.generateFitnessToWorkCertificatePDF(state.certificateData);
          break;
        case 'disability-certificate':
          pdfBlob = CertificatePdfGenerator.generateDisabilityCertificatePDF(state.certificateData);
          break;
        case 'accommodation-certificate':
          pdfBlob = CertificatePdfGenerator.generateAccommodationCertificatePDF(state.certificateData);
          break;
        default:
          throw new Error(`Unknown certificate type: ${state.certificateType}`);
      }

      // Download PDF
      const filename = CertificatePdfGenerator.getFilename(
        state.certificateType,
        state.certificateData.patient.name,
        state.certificateData.issueDate
      );
      CertificatePdfGenerator.downloadPDF(pdfBlob, filename);

      // Call callback if provided
      if (onGenerate) {
        onGenerate(state.certificateType, pdfBlob);
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        success: `Certificate generated successfully: ${filename}`,
      }));

      // Clear success message after 3 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 3000);
    } catch (error) {
      console.error('[CertificateFormGenerator] Error generating PDF:', error);
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

  // Certificate type options
  const certificateTypeOptions: Array<{ value: CertificateType; label: string; description: string }> = [
    {
      value: 'medical-certificate',
      label: 'Medical Certificate',
      description: 'Standard medical certificate for work absence',
    },
    {
      value: 'return-to-work-certificate',
      label: 'Return-to-Work Certificate',
      description: 'Certificate clearing patient to return to work',
    },
    {
      value: 'fitness-to-work-certificate',
      label: 'Fitness-to-Work Certificate',
      description: 'Certificate assessing fitness for work duties',
    },
    {
      value: 'disability-certificate',
      label: 'Disability Certificate',
      description: 'Certificate for disability benefits',
    },
    {
      value: 'accommodation-certificate',
      label: 'Accommodation Certificate',
      description: 'Certificate for workplace accommodations',
    },
  ];

  return (
    <div className={`certificate-form-generator bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Medical Certificate Generator</h2>
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

      {/* Certificate Type Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Certificate Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {certificateTypeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleCertificateTypeChange(option.value)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                state.certificateType === option.value
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

      {/* Certificate Data Preview */}
      {state.certificateData && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Certificate Data Preview</h3>
            <button
              onClick={handleTogglePreview}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Eye className="w-4 h-4" />
              {state.previewMode === 'form' ? 'Show Preview' : 'Show Form'}
            </button>
          </div>

          {state.previewMode === 'form' ? (
            <CertificateDataDisplay data={state.certificateData} />
          ) : (
            <CertificatePreview data={state.certificateData} certificateType={state.certificateType} />
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        {state.validation && state.validation.valid && (
          <div className="flex items-center gap-2 text-green-600 mr-auto">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Certificate data is valid</span>
          </div>
        )}
        
        <button
          onClick={handleGeneratePDF}
          disabled={state.isLoading || !state.certificateData || (state.validation && !state.validation.valid)}
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
 * Certificate Data Display Component
 */
const CertificateDataDisplay: React.FC<{ data: CertificateData }> = ({ data }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
      {/* Patient Info */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Patient Information</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <div><strong>Name:</strong> {data.patient.name}</div>
          <div><strong>DOB:</strong> {data.patient.dateOfBirth.toLocaleDateString()}</div>
          <div><strong>Address:</strong> {data.patient.address}, {data.patient.city}, {data.patient.province}</div>
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

      {/* Condition Info */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Medical Condition</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <div><strong>Diagnosis:</strong> {data.condition.diagnosis}</div>
          <div><strong>Onset Date:</strong> {data.condition.onsetDate.toLocaleDateString()}</div>
          <div><strong>Current Status:</strong> {data.condition.currentStatus}</div>
          <div><strong>Functional Impact:</strong> {data.condition.functionalImpact}</div>
          {data.condition.symptoms.length > 0 && (
            <div><strong>Symptoms:</strong> {data.condition.symptoms.join(', ')}</div>
          )}
        </div>
      </div>

      {/* Work Info */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Work Information</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <div><strong>Occupation:</strong> {data.work.occupation}</div>
          <div><strong>Cleared for Work:</strong> {data.work.clearedForWork ? 'Yes' : 'No'}</div>
          <div><strong>Cleared for Full Duties:</strong> {data.work.clearedForFullDuties ? 'Yes' : 'No'}</div>
          <div><strong>Cleared for Modified Duties:</strong> {data.work.clearedForModifiedDuties ? 'Yes' : 'No'}</div>
          {data.work.expectedReturnDate && (
            <div><strong>Expected Return Date:</strong> {data.work.expectedReturnDate.toLocaleDateString()}</div>
          )}
        </div>
      </div>

      {/* Work Restrictions */}
      {data.work.workRestrictions && data.work.workRestrictions.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Work Restrictions</h4>
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
            {data.work.workRestrictions.map((restriction, index) => (
              <li key={index}>{restriction}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Accommodations */}
      {data.work.accommodations && data.work.accommodations.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Workplace Accommodations</h4>
          <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
            {data.work.accommodations.map((accommodation, index) => (
              <li key={index}>{accommodation}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Treatment Info */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Treatment Information</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <div><strong>Duration:</strong> {data.treatment.treatmentDuration}</div>
          <div><strong>Follow-Up Required:</strong> {data.treatment.followUpRequired ? 'Yes' : 'No'}</div>
          {data.treatment.followUpDate && (
            <div><strong>Follow-Up Date:</strong> {data.treatment.followUpDate.toLocaleDateString()}</div>
          )}
          {data.treatment.treatmentProvided.length > 0 && (
            <div><strong>Treatments:</strong> {data.treatment.treatmentProvided.join(', ')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Certificate Preview Component
 */
const CertificatePreview: React.FC<{ data: CertificateData; certificateType: CertificateType }> = ({ data, certificateType }) => {
  const previewContent = useMemo(() => {
    switch (certificateType) {
      case 'medical-certificate':
        return CertificatePdfGenerator.generateMedicalCertificatePDF(data);
      case 'return-to-work-certificate':
        return CertificatePdfGenerator.generateReturnToWorkCertificatePDF(data);
      case 'fitness-to-work-certificate':
        return CertificatePdfGenerator.generateFitnessToWorkCertificatePDF(data);
      case 'disability-certificate':
        return CertificatePdfGenerator.generateDisabilityCertificatePDF(data);
      case 'accommodation-certificate':
        return CertificatePdfGenerator.generateAccommodationCertificatePDF(data);
      default:
        return new Blob(['No preview available'], { type: 'text/plain' });
    }
  }, [data, certificateType]);

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

