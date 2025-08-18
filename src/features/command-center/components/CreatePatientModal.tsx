import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { patientsRepo, PatientCreateData } from '../../../repositories/patientsRepo';
import { DX_TOP, COMORBIDITIES, ALLERGIES, toOptions } from '../../../core/clinical/taxonomies';
import { TokenInput } from '../../../shared/ui/TokenInput';
import { MultiSelectCombobox } from '../../../shared/ui/MultiSelectCombobox';
import { logAction } from '../../../analytics/events';


interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PatientFormData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  chiefComplaint: string;
  hypotheses: string[]; // tokens de diagnóstico hipotético
  comorbidities: string[];
  allergies: string[];
}

export const CreatePatientModal: React.FC<CreatePatientModalProps> = ({ isOpen, onClose }) => {

  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    chiefComplaint: '',
    hypotheses: [],
    comorbidities: [],
    allergies: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.chiefComplaint.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const auth = getAuth();
      if (!auth.currentUser) throw new Error('Usuario no autenticado');

      const payload = {
        ownerUid: auth.currentUser.uid,
        status: 'active' as const,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        birthDate: formData.birthDate || undefined,
        chiefComplaint: formData.chiefComplaint.trim(),
        clinical: {
          diagnoses: formData.hypotheses.map(display => ({ display })),
          comorbidities: formData.comorbidities,
          allergies: formData.allergies,
        }
      };

      // normalizar alergias a objetos { display }
      const normalized = {
        ...payload,
        clinical: {
          ...payload.clinical,
          allergies: payload.clinical?.allergies?.map(a => ({ display: a }))
        }
      } as unknown as PatientCreateData;
      await patientsRepo.createPatient(normalized);
      logAction('create_patient_success', '/command-center');
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        setFormData({ firstName: '', lastName: '', email: '', phone: '', birthDate: '', chiefComplaint: '', hypotheses: [], comorbidities: [], allergies: [] });
      }, 2000);
    } catch (error) {
      console.error('Error creando paciente:', error);
      // Aquí se podría mostrar un toast de error
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-soft max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Crear Nuevo Paciente</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Stepper simple */}
          <div className="flex items-center gap-2 mb-2">
            <button type="button" onClick={() => setStep(1)} className={`px-3 py-1 rounded-lg text-sm ${step === 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>Paso 1</button>
            <button type="button" onClick={() => setStep(2)} className={`px-3 py-1 rounded-lg text-sm ${step === 2 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>Paso 2</button>
          </div>
          {step === 1 && (
          <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-in-500 focus:border-transparent"
                placeholder="Nombre"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-in-500 focus:border-transparent"
                placeholder="Apellido"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email (opcional)</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-in-500 focus:border-transparent" placeholder="email@ejemplo.com" disabled={isSubmitting} />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Teléfono (opcional)</label>
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-in-500 focus:border-transparent" placeholder="+34 600 000 000" disabled={isSubmitting} />
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-slate-700 mb-1">Fecha de Nacimiento (opcional)</label>
            <input type="date" id="birthDate" name="birthDate" value={formData.birthDate} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-in-500 focus:border-transparent" disabled={isSubmitting} />
          </div>
          
          </>
          )}

          {step === 2 && (
          <>
          <div className="space-y-4">
            <div>
              <label htmlFor="chiefComplaint" className="block text-sm font-medium text-slate-700 mb-1">Motivo de consulta / síntoma principal *</label>
              <textarea id="chiefComplaint" name="chiefComplaint" value={formData.chiefComplaint} onChange={(e) => setFormData(prev => ({ ...prev, chiefComplaint: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-in-500 focus:border-transparent" rows={3} maxLength={120} required disabled={isSubmitting} />
            </div>

            <TokenInput label="Hipótesis diagnóstica (ICD-10/SNOMED)" suggestions={DX_TOP} value={formData.hypotheses} onChange={(tokens) => setFormData(prev => ({ ...prev, hypotheses: tokens }))} />

            <MultiSelectCombobox
              label="Comorbilidades"
              options={toOptions(COMORBIDITIES)}
              value={formData.comorbidities}
              onChange={(vals) => {
                if (vals.length > formData.comorbidities.length) {
                  const added = vals.find(v => !formData.comorbidities.includes(v));
                  if (added) logAction('select_comorbidity', '/command-center');
                }
                setFormData(prev => ({ ...prev, comorbidities: vals }));
              }}
              allowCustom
              maxItems={10}
            />

            <MultiSelectCombobox
              label="Alergias"
              options={toOptions(ALLERGIES)}
              value={formData.allergies}
              onChange={(vals) => {
                if (vals.length > formData.allergies.length) {
                  const added = vals.find(v => !formData.allergies.includes(v));
                  if (added) logAction('select_allergy', '/command-center');
                }
                setFormData(prev => ({ ...prev, allergies: vals }));
              }}
              allowCustom
              maxItems={10}
            />
          </div>
          </>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 text-sm font-medium">
                  Paciente creado exitosamente
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            {step === 1 ? (
              <button type="button" onClick={() => setStep(2)} disabled={!formData.firstName.trim() || !formData.lastName.trim()} className="flex-1 px-4 py-2 btn-in disabled:opacity-50 disabled:cursor-not-allowed">
                Continuar
              </button>
            ) : (
            <button
              type="submit"
              disabled={isSubmitting || !formData.firstName.trim() || !formData.lastName.trim() || !formData.chiefComplaint.trim()}
              className="flex-1 px-4 py-2 btn-in disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creando...' : 'Crear Paciente'}
            </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
