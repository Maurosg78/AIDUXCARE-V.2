import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { X, Loader2, User, Phone, Mail, FileText, Calendar } from 'lucide-react';

import { patientsRepo, PatientCreateData } from '../../../repositories/patientsRepo';
import { logAction } from '../../../analytics/events';
import logger from '@/shared/utils/logger';

interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePatientModal: React.FC<CreatePatientModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const firstNameInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    birthDate: '',
    chiefComplaint: '',
    isReferral: false,
    referralDiagnosis: '',
    suspectedDiagnosis: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (isOpen && firstNameInputRef.current) {
      setTimeout(() => firstNameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        birthDate: '',
        chiefComplaint: '',
        isReferral: false,
        referralDiagnosis: '',
        suspectedDiagnosis: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required for SMS consent';
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone format';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email';
    }
    if (!formData.birthDate) {
      newErrors.birthDate = 'Date of birth is required';
    }
    if (!formData.chiefComplaint.trim()) {
      newErrors.chiefComplaint = 'Required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const auth = getAuth();
      if (!auth.currentUser) throw new Error('User not authenticated');

      // Build payload - remove undefined fields (Firestore doesn't accept undefined)
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      const payload: any = {
        ownerUid: auth.currentUser.uid,
        status: 'active' as const,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        fullName: fullName,
        chiefComplaint: formData.chiefComplaint.trim(),
        clinical: {
          diagnoses: [],
          comorbidities: [],
          allergies: [],
        }
      };

      // Only add optional fields if they have values
      if (formData.email?.trim()) {
        payload.email = formData.email.trim();
      }
      if (formData.phone?.trim()) {
        payload.phone = formData.phone.trim();
      }
      if (formData.birthDate) {
        // Save as both birthDate (for patientsRepo) and dateOfBirth (for PatientService compatibility)
        payload.birthDate = formData.birthDate;
        payload.dateOfBirth = formData.birthDate;
      }
      
      // Add referral/suspected diagnosis fields
      if (formData.isReferral && formData.referralDiagnosis?.trim()) {
        payload.referralDiagnosis = formData.referralDiagnosis.trim();
        payload.referralReason = formData.referralDiagnosis.trim(); // Also save to referralReason for compatibility
      } else if (!formData.isReferral && formData.suspectedDiagnosis?.trim()) {
        payload.suspectedDiagnosis = formData.suspectedDiagnosis.trim();
      }
      
      // Set source based on referral status
      payload.source = formData.isReferral ? 'referral' : 'direct';
      
      const patientId = await patientsRepo.createPatient(payload);
      logAction('create_patient_success', '/command-center');
      
      // Close modal and redirect immediately
      onClose();
      navigate(`/consent-verification/${patientId}`);
    } catch (error) {
      logger.error('Error creating patient:', error);
      setErrors({ submit: 'Failed to create patient. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">New Patient</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isSubmitting}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Name Fields - Side by Side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={firstNameInputRef}
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                  errors.firstName 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-slate-300 focus:ring-indigo-500'
                }`}
                placeholder="John"
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                  errors.lastName 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-slate-300 focus:ring-indigo-500'
                }`}
                placeholder="Doe"
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Phone - Required for SMS */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Phone className="w-4 h-4 text-slate-500" />
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                errors.phone 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-slate-300 focus:ring-indigo-500'
              }`}
              placeholder="+1 (555) 123-4567"
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-red-600 text-xs mt-1">{errors.phone}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">Required for SMS consent delivery</p>
          </div>

          {/* Date of Birth - Required */}
          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-4 h-4 text-slate-500" />
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              required
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                errors.birthDate 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-slate-300 focus:ring-indigo-500'
              }`}
              disabled={isSubmitting}
            />
            {errors.birthDate && (
              <p className="text-red-600 text-xs mt-1">{errors.birthDate}</p>
            )}
          </div>

          {/* Email - Optional */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Mail className="w-4 h-4 text-slate-500" />
              Email <span className="text-slate-400 text-xs font-normal">(optional)</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                errors.email 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-slate-300 focus:ring-indigo-500'
              }`}
              placeholder="john.doe@example.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-red-600 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Chief Complaint */}
          <div>
            <label htmlFor="chiefComplaint" className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-4 h-4 text-slate-500" />
              Chief Complaint <span className="text-red-500">*</span>
            </label>
            <textarea
              id="chiefComplaint"
              name="chiefComplaint"
              value={formData.chiefComplaint}
              onChange={handleInputChange}
              required
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors resize-none ${
                errors.chiefComplaint 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-slate-300 focus:ring-indigo-500'
              }`}
              placeholder="Brief description of the patient's main concern..."
              disabled={isSubmitting}
            />
            {errors.chiefComplaint && (
              <p className="text-red-600 text-xs mt-1">{errors.chiefComplaint}</p>
            )}
          </div>

          {/* Referral Toggle */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <input
                type="checkbox"
                checked={formData.isReferral}
                onChange={(e) => setFormData(prev => ({ ...prev, isReferral: e.target.checked }))}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                disabled={isSubmitting}
              />
              <span>This is a referral patient</span>
            </label>
          </div>

          {/* Referral Diagnosis (shown when isReferral is true) */}
          {formData.isReferral && (
            <div>
              <label htmlFor="referralDiagnosis" className="block text-sm font-medium text-slate-700 mb-1">
                Referral Diagnosis <span className="text-slate-400 text-xs font-normal">(optional)</span>
              </label>
              <input
                type="text"
                id="referralDiagnosis"
                name="referralDiagnosis"
                value={formData.referralDiagnosis}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                placeholder="Diagnosis from referring physician..."
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Suspected Diagnosis (shown when isReferral is false) */}
          {!formData.isReferral && (
            <div>
              <label htmlFor="suspectedDiagnosis" className="block text-sm font-medium text-slate-700 mb-1">
                Suspected Diagnosis <span className="text-slate-400 text-xs font-normal">(optional)</span>
              </label>
              <input
                type="text"
                id="suspectedDiagnosis"
                name="suspectedDiagnosis"
                value={formData.suspectedDiagnosis}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                placeholder="Initial suspected diagnosis..."
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim() || !formData.birthDate || !formData.chiefComplaint.trim()}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Patient'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
