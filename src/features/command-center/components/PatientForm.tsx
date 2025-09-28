// @ts-nocheck
import React, { useState } from 'react';

import PatientService from '../../../services/patientService';
import { AnalyticsService } from '../../../services/analyticsService';

import logger from '@/shared/utils/logger';

export interface PatientFormData {
  // Datos Personales Básicos - Nombres Separados
  firstName: string;
  middleName: string;
  lastName: string;
  secondLastName: string;
  preferredName: string; // Nombre por el que prefieren ser llamados
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  idNumber: string;
  
  // Datos Clínicos Relevantes
  medicalHistory: string;
  allergies: string;
  medications: string;
  previousInjuries: string;
  
  // Datos de Derivación y Origen
  referringPhysician: string;
  referringCenter: string;
  referralDate: string;
  referralReason: string;
  
  // Datos de Seguro y Facturación
  insuranceProvider: string;
  insurancePolicy: string;
  insuranceGroup: string;
  copayAmount: number;
  deductibleAmount: number;
  
  // Datos de Contacto de Emergencia
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  
  // Datos Ocupacionales
  occupation: string;
  workplace: string;
  workPhone: string;
  workEmail: string;
  
  // Datos de Facturación
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Datos de Seguimiento
  preferredContactMethod: 'email' | 'phone' | 'sms';
  preferredAppointmentTime: 'morning' | 'afternoon' | 'evening';
  notes: string;
  
  // Metadatos para Estadísticas
  source: 'direct' | 'referral' | 'online' | 'insurance';
  marketingChannel: 'google' | 'social' | 'referral' | 'direct';
  initialConsultationType: 'in-person' | 'virtual' | 'assessment';
}

interface PatientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated: (patientId: string) => void;
}

export const PatientForm: React.FC<PatientFormProps> = ({
  isOpen,
  onClose,
  onPatientCreated
}) => {
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    middleName: '',
    lastName: '',
    secondLastName: '',
    preferredName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'other',
    idNumber: '',
    medicalHistory: '',
    allergies: '',
    medications: '',
    previousInjuries: '',
    referringPhysician: '',
    referringCenter: '',
    referralDate: '',
    referralReason: '',
    insuranceProvider: '',
    insurancePolicy: '',
    insuranceGroup: '',
    copayAmount: 0,
    deductibleAmount: 0,
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    occupation: '',
    workplace: '',
    workPhone: '',
    workEmail: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    preferredContactMethod: 'email',
    preferredAppointmentTime: 'morning',
    notes: '',
    source: 'direct',
    marketingChannel: 'direct',
    initialConsultationType: 'in-person'
  });

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = 4;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Datos Personales
        if (!formData.firstName.trim()) newErrors.firstName = 'Nombre requerido';
        if (!formData.lastName.trim()) newErrors.lastName = 'Apellido requerido';
        if (!formData.email.trim()) newErrors.email = 'Email requerido';
        if (!formData.phone.trim()) newErrors.phone = 'Teléfono requerido';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Fecha de nacimiento requerida';
        break;

      case 2: // Datos Clínicos
        if (!formData.medicalHistory.trim()) newErrors.medicalHistory = 'Historial médico requerido';
        break;

      case 3: // Datos de Seguro
        // Opcional - no requiere validación estricta
        break;

      case 4: // Datos Adicionales
        // Opcional - no requiere validación estricta
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PatientFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
  };



  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Generar fullName a partir de los campos separados
      const fullName = [
        formData.firstName,
        formData.middleName,
        formData.lastName,
        formData.secondLastName
      ].filter(Boolean).join(' ');

      // Mapear género para compatibilidad
      const gender = formData.gender === 'prefer-not-to-say' ? 'other' : formData.gender;

      const patientId = await PatientService.createPatient({
        ...formData,
        fullName, // Agregar fullName generado
        gender, // Usar género mapeado
        status: 'active',
        lastVisit: new Date().toISOString()
      });

      // Registrar evento de analytics
      await AnalyticsService.trackEvent('patient_created', {
        patientId,
        source: formData.source,
        marketingChannel: formData.marketingChannel,
        initialConsultationType: formData.initialConsultationType,
        hasInsurance: !!formData.insuranceProvider,
        hasReferral: !!formData.referringPhysician,
        timestamp: new Date().toISOString()
      });

      // Registrar métricas de negocio
      await AnalyticsService.getInstance().trackBusinessMetrics({
        event: 'new_patient_registration',
        patientData: {
          hasInsurance: !!formData.insuranceProvider,
          hasReferral: !!formData.referringPhysician,
          source: formData.source,
          marketingChannel: formData.marketingChannel
        },
        timestamp: new Date().toISOString()
      });

      onPatientCreated(patientId);
      onClose();
    } catch (error) {
      logger.error('Error creando paciente:', error);
      setErrors({ submit: 'Error al crear paciente. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-internal-text">Datos Personales</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-internal-text mb-2">
            Nombre *
          </label>
          <input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent ${
              errors.firstName ? 'border-internal-error' : 'border-internal-border'
            }`}
            placeholder="Nombre"
          />
          {errors.firstName && <p className="text-internal-error text-sm mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label htmlFor="middleName" className="block text-sm font-medium text-internal-text mb-2">
            Segundo Nombre
          </label>
          <input
            id="middleName"
            type="text"
            value={formData.middleName}
            onChange={(e) => handleInputChange('middleName', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="Segundo nombre"
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-internal-text mb-2">
            Apellido *
          </label>
          <input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent ${
              errors.lastName ? 'border-internal-error' : 'border-internal-border'
            }`}
            placeholder="Apellido"
          />
          {errors.lastName && <p className="text-internal-error text-sm mt-1">{errors.lastName}</p>}
        </div>

        <div>
          <label htmlFor="secondLastName" className="block text-sm font-medium text-internal-text mb-2">
            Segundo Apellido
          </label>
          <input
            id="secondLastName"
            type="text"
            value={formData.secondLastName}
            onChange={(e) => handleInputChange('secondLastName', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="Segundo apellido"
          />
        </div>

        <div>
          <label htmlFor="preferredName" className="block text-sm font-medium text-internal-text mb-2">
            Nombre por el que prefieren ser llamados
          </label>
          <input
            id="preferredName"
            type="text"
            value={formData.preferredName}
            onChange={(e) => handleInputChange('preferredName', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="Ej: Juan, María, etc."
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-internal-text mb-2">
            Email *
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent ${
              errors.email ? 'border-internal-error' : 'border-internal-border'
            }`}
            placeholder="email@ejemplo.com"
          />
          {errors.email && <p className="text-internal-error text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-internal-text mb-2">
            Teléfono *
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent ${
              errors.phone ? 'border-internal-error' : 'border-internal-border'
            }`}
            placeholder="+34 600 000 000"
          />
          {errors.phone && <p className="text-internal-error text-sm mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-internal-text mb-2">
            Fecha de Nacimiento *
          </label>
          <input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent ${
              errors.dateOfBirth ? 'border-internal-error' : 'border-internal-border'
            }`}
          />
          {errors.dateOfBirth && <p className="text-internal-error text-sm mt-1">{errors.dateOfBirth}</p>}
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-internal-text mb-2">
            Género
          </label>
          <select
            id="gender"
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
          >
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
            <option value="other">Otro</option>
            <option value="prefer-not-to-say">Prefiero no decirlo</option>
          </select>
        </div>

        <div>
          <label htmlFor="idNumber" className="block text-sm font-medium text-internal-text mb-2">
            DNI/NIE
          </label>
          <input
            id="idNumber"
            type="text"
            value={formData.idNumber}
            onChange={(e) => handleInputChange('idNumber', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="12345678A"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-internal-text">Datos Clínicos y Derivación</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="medicalHistory" className="block text-sm font-medium text-internal-text mb-2">
            Historial Médico *
          </label>
          <textarea
            id="medicalHistory"
            value={formData.medicalHistory}
            onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent ${
              errors.medicalHistory ? 'border-internal-error' : 'border-internal-border'
            }`}
            placeholder="Condiciones médicas, cirugías previas, etc."
          />
          {errors.medicalHistory && <p className="text-internal-error text-sm mt-1">{errors.medicalHistory}</p>}
        </div>

        <div>
          <label htmlFor="allergies" className="block text-sm font-medium text-internal-text mb-2">
            Alergias
          </label>
          <input
            id="allergies"
            type="text"
            value={formData.allergies}
            onChange={(e) => handleInputChange('allergies', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="Medicamentos, alimentos, etc."
          />
        </div>

        <div>
          <label htmlFor="medications" className="block text-sm font-medium text-internal-text mb-2">
            Medicamentos Actuales
          </label>
          <input
            id="medications"
            type="text"
            value={formData.medications}
            onChange={(e) => handleInputChange('medications', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="Medicamentos que toma regularmente"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="previousInjuries" className="block text-sm font-medium text-internal-text mb-2">
            Lesiones Previas
          </label>
          <textarea
            id="previousInjuries"
            value={formData.previousInjuries}
            onChange={(e) => handleInputChange('previousInjuries', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="Lesiones, fracturas, cirugías previas"
          />
        </div>

        <div>
          <label htmlFor="referringPhysician" className="block text-sm font-medium text-internal-text mb-2">
            Médico Derivador
          </label>
          <input
            id="referringPhysician"
            type="text"
            value={formData.referringPhysician}
            onChange={(e) => handleInputChange('referringPhysician', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="Dr. Nombre Apellido"
          />
        </div>

        <div>
          <label htmlFor="referringCenter" className="block text-sm font-medium text-internal-text mb-2">
            Centro Derivador
          </label>
          <input
            id="referringCenter"
            type="text"
            value={formData.referringCenter}
            onChange={(e) => handleInputChange('referringCenter', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="Hospital, clínica, etc."
          />
        </div>

        <div>
          <label htmlFor="referralDate" className="block text-sm font-medium text-internal-text mb-2">
            Fecha de Derivación
          </label>
          <input
            id="referralDate"
            type="date"
            value={formData.referralDate}
            onChange={(e) => handleInputChange('referralDate', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
          />
        </div>

        <div>
          <label htmlFor="referralReason" className="block text-sm font-medium text-internal-text mb-2">
            Motivo de Derivación
          </label>
          <input
            id="referralReason"
            type="text"
            value={formData.referralReason}
            onChange={(e) => handleInputChange('referralReason', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="Dolor lumbar, rehabilitación, etc."
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-internal-text">Datos de Seguro y Facturación</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="insuranceProvider" className="block text-sm font-medium text-internal-text mb-2">
            Aseguradora
          </label>
          <input
            id="insuranceProvider"
            type="text"
            value={formData.insuranceProvider}
            onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="Adeslas, Sanitas, etc."
          />
        </div>

        <div>
          <label htmlFor="insurancePolicy" className="block text-sm font-medium text-internal-text mb-2">
            Número de Póliza
          </label>
          <input
            id="insurancePolicy"
            type="text"
            value={formData.insurancePolicy}
            onChange={(e) => handleInputChange('insurancePolicy', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="Número de póliza"
          />
        </div>

        <div>
          <label htmlFor="insuranceGroup" className="block text-sm font-medium text-internal-text mb-2">
            Grupo de Seguro
          </label>
          <input
            id="insuranceGroup"
            type="text"
            value={formData.insuranceGroup}
            onChange={(e) => handleInputChange('insuranceGroup', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="Grupo empresarial"
          />
        </div>

        <div>
          <label htmlFor="copayAmount" className="block text-sm font-medium text-internal-text mb-2">
            Copago (€)
          </label>
          <input
            id="copayAmount"
            type="number"
            value={formData.copayAmount}
            onChange={(e) => handleInputChange('copayAmount', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="0"
          />
        </div>

        <div>
          <label htmlFor="deductibleAmount" className="block text-sm font-medium text-internal-text mb-2">
            Deducible (€)
          </label>
          <input
            id="deductibleAmount"
            type="number"
            value={formData.deductibleAmount}
            onChange={(e) => handleInputChange('deductibleAmount', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="0"
          />
        </div>

        <div>
          <label htmlFor="source" className="block text-sm font-medium text-internal-text mb-2">
            Origen del Paciente
          </label>
          <select
            id="source"
            value={formData.source}
            onChange={(e) => handleInputChange('source', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
          >
            <option value="direct">Directo</option>
            <option value="referral">Derivación</option>
            <option value="online">Online</option>
            <option value="insurance">Seguro</option>
          </select>
        </div>

        <div>
          <label htmlFor="marketingChannel" className="block text-sm font-medium text-internal-text mb-2">
            Canal de Marketing
          </label>
          <select
            id="marketingChannel"
            value={formData.marketingChannel}
            onChange={(e) => handleInputChange('marketingChannel', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
          >
            <option value="direct">Directo</option>
            <option value="google">Google</option>
            <option value="social">Redes Sociales</option>
            <option value="referral">Referido</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-internal-text">Datos Adicionales</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="occupation" className="block text-sm font-medium text-internal-text mb-2">
            Ocupación
          </label>
          <input
            id="occupation"
            type="text"
            value={formData.occupation}
            onChange={(e) => handleInputChange('occupation', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="Profesión actual"
          />
        </div>

        <div>
          <label htmlFor="workplace" className="block text-sm font-medium text-internal-text mb-2">
            Lugar de Trabajo
          </label>
          <input
            id="workplace"
            type="text"
            value={formData.workplace}
            onChange={(e) => handleInputChange('workplace', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="Empresa o institución"
          />
        </div>

        <div>
          <label htmlFor="workPhone" className="block text-sm font-medium text-internal-text mb-2">
            Teléfono Laboral
          </label>
          <input
            id="workPhone"
            type="tel"
            value={formData.workPhone}
            onChange={(e) => handleInputChange('workPhone', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="+34 600 000 000"
          />
        </div>

        <div>
          <label htmlFor="workEmail" className="block text-sm font-medium text-internal-text mb-2">
            Email Laboral
          </label>
          <input
            id="workEmail"
            type="email"
            value={formData.workEmail}
            onChange={(e) => handleInputChange('workEmail', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="trabajo@empresa.com"
          />
        </div>

        <div>
          <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-internal-text mb-2">
            Método de Contacto Preferido
          </label>
          <select
            id="preferredContactMethod"
            value={formData.preferredContactMethod}
            onChange={(e) => handleInputChange('preferredContactMethod', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
          >
            <option value="email">Email</option>
            <option value="phone">Teléfono</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        <div>
          <label htmlFor="preferredAppointmentTime" className="block text-sm font-medium text-internal-text mb-2">
            Horario Preferido
          </label>
          <select
            id="preferredAppointmentTime"
            value={formData.preferredAppointmentTime}
            onChange={(e) => handleInputChange('preferredAppointmentTime', e.target.value)}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
          >
            <option value="morning">Mañana</option>
            <option value="afternoon">Tarde</option>
            <option value="evening">Noche</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-internal-text mb-2">
            Notas Adicionales
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
            placeholder="Información adicional relevante"
          />
        </div>
      </div>

      {/* Contacto de Emergencia */}
      <div className="border-t pt-6">
        <h4 className="text-md font-semibold text-internal-text mb-4">Contacto de Emergencia</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="emergencyContactName" className="block text-sm font-medium text-internal-text mb-2">
              Nombre del Contacto
            </label>
            <input
              id="emergencyContactName"
              type="text"
              value={formData.emergencyContact.name}
              onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
              placeholder="Nombre completo"
            />
          </div>

          <div>
            <label htmlFor="emergencyContactRelationship" className="block text-sm font-medium text-internal-text mb-2">
              Relación
            </label>
            <input
              id="emergencyContactRelationship"
              type="text"
              value={formData.emergencyContact.relationship}
              onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
              className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
              placeholder="Familiar, amigo, etc."
            />
          </div>

          <div>
            <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-internal-text mb-2">
              Teléfono de Emergencia
            </label>
            <input
              id="emergencyContactPhone"
              type="tel"
              value={formData.emergencyContact.phone}
              onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
              placeholder="+34 600 000 000"
            />
          </div>

          <div>
            <label htmlFor="emergencyContactEmail" className="block text-sm font-medium text-internal-text mb-2">
              Email de Emergencia
            </label>
            <input
              id="emergencyContactEmail"
              type="email"
              value={formData.emergencyContact.email}
              onChange={(e) => handleEmergencyContactChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-internal-border rounded-lg focus:ring-2 focus:ring-internal-accent focus:border-internal-accent"
              placeholder="emergencia@email.com"
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-internal-text">
              Nuevo{' '}
              <span className="bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Paciente
              </span>
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-internal-text">Paso {currentStep} de {totalSteps}</span>
              <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Form Content */}
          <div className="mb-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-internal-error">{errors.submit}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="px-6 py-2 border border-internal-border text-internal-text rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-internal-accent transition-all duration-200"
              >
                Anterior
              </button>
            )}
            
            <div className="flex space-x-4 ml-auto">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-internal-border text-internal-text rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-internal-accent transition-all duration-200"
              >
                Cancelar
              </button>
              
              {currentStep < totalSteps ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 text-white rounded-lg hover:from-red-600 hover:via-pink-600 hover:via-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-internal-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 via-pink-500 via-purple-500 to-blue-500 text-white rounded-lg hover:from-red-600 hover:via-pink-600 hover:via-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-internal-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? 'Creando...' : 'Crear Paciente'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};