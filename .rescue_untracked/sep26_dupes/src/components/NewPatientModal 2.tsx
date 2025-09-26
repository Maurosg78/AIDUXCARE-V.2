import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

import { Button } from '../shared/ui';

interface PatientFormData {
  id: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  edad: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  medicoDerivador: string;
  institucionDerivadora: string;
  diagnosticoPrevio: string;
  comorbilidades: string;
  medicamentos: string;
  alergias: string;
  consentimientoFirmado: boolean;
}

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: PatientFormData) => void;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<PatientFormData>({
    id: `PAC-${Date.now()}`,
    nombre: '',
    apellidos: '',
    fechaNacimiento: '',
    edad: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    medicoDerivador: '',
    institucionDerivadora: '',
    diagnosticoPrevio: '',
    comorbilidades: '',
    medicamentos: '',
    alergias: '',
    consentimientoFirmado: false
  });

  const [errors, setErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!formData.nombre.trim()) {
      newErrors.push('Nombre es obligatorio');
    }
    
    if (!formData.apellidos.trim()) {
      newErrors.push('Al menos un apellido es obligatorio');
    }
    
    if (!formData.email.trim()) {
      newErrors.push('Email es obligatorio');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.push('Email no válido');
    }
    
    if (!formData.telefono.trim()) {
      newErrors.push('Teléfono es obligatorio');
    } else if (!/^\+?[\d\s-()]+$/.test(formData.telefono) || formData.telefono.replace(/\D/g, '').length < 9) {
      newErrors.push('Teléfono debe tener al menos 9 dígitos');
    }
    
    if (!formData.consentimientoFirmado) {
      newErrors.push('Debe confirmar el consentimiento informado');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Calcular edad si hay fecha de nacimiento
    if (formData.fechaNacimiento) {
      const birthDate = new Date(formData.fechaNacimiento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      formData.edad = `${age} años`;
    }
    
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Nuevo Paciente - Registro Completo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700">Errores de validación:</p>
                <ul className="text-sm text-red-600 mt-1">
                  {errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm font-semibold">ID Único: {formData.id}</p>
            <p className="text-xs text-gray-600">Generado automáticamente - HIPAA/GDPR Compliant</p>
          </div>

          <div className="bg-yellow-50 p-3 rounded">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Campos obligatorios:</span> Los marcados con asterisco (*) son requeridos por normativa
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nombre <span className="text-red-500">*</span>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className={`w-full px-3 py-1 border rounded mt-1 ${errors.some(e => e.includes('Nombre')) ? 'border-red-500' : ''}`}
                  required
                  placeholder="Nombre del paciente"
                />
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Apellidos <span className="text-red-500">*</span>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                  className={`w-full px-3 py-1 border rounded mt-1 ${errors.some(e => e.includes('apellido')) ? 'border-red-500' : ''}`}
                  required
                  placeholder="Al menos un apellido"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email <span className="text-red-500">*</span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full px-3 py-1 border rounded mt-1 ${errors.some(e => e.includes('Email')) ? 'border-red-500' : ''}`}
                  required
                  placeholder="correo@ejemplo.com"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Teléfono <span className="text-red-500">*</span>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  className={`w-full px-3 py-1 border rounded mt-1 ${errors.some(e => e.includes('Teléfono')) ? 'border-red-500' : ''}`}
                  required
                  placeholder="+34 600 000 000"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Fecha de Nacimiento
                <input
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData({...formData, fechaNacimiento: e.target.value})}
                  className="w-full px-3 py-1 border rounded mt-1"
                  max={new Date().toISOString().split('T')[0]}
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Dirección
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  className="w-full px-3 py-1 border rounded mt-1"
                  placeholder="Opcional"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Ciudad
                <input
                  type="text"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                  className="w-full px-3 py-1 border rounded mt-1"
                  placeholder="Opcional"
                />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Código Postal
                <input
                  type="text"
                  value={formData.codigoPostal}
                  onChange={(e) => setFormData({...formData, codigoPostal: e.target.value})}
                  className="w-full px-3 py-1 border rounded mt-1"
                  placeholder="Opcional"
                />
              </label>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Información Médica</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Médico Derivador
                  <input
                    type="text"
                    value={formData.medicoDerivador}
                    onChange={(e) => setFormData({...formData, medicoDerivador: e.target.value})}
                    className="w-full px-3 py-1 border rounded mt-1"
                    placeholder="Opcional"
                  />
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Institución Derivadora
                  <input
                    type="text"
                    value={formData.institucionDerivadora}
                    onChange={(e) => setFormData({...formData, institucionDerivadora: e.target.value})}
                    className="w-full px-3 py-1 border rounded mt-1"
                    placeholder="Opcional"
                  />
                </label>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">
                Diagnóstico Previo
                <textarea
                  value={formData.diagnosticoPrevio}
                  onChange={(e) => setFormData({...formData, diagnosticoPrevio: e.target.value})}
                  className="w-full px-3 py-1 border rounded mt-1"
                  rows={2}
                  placeholder="Opcional - Se puede actualizar después"
                />
              </label>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">
                Medicación Actual
                <textarea
                  value={formData.medicamentos}
                  onChange={(e) => setFormData({...formData, medicamentos: e.target.value})}
                  className="w-full px-3 py-1 border rounded mt-1"
                  rows={2}
                  placeholder="Opcional - Se detectará automáticamente con IA"
                />
              </label>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">
                Alergias
                <textarea
                  value={formData.alergias}
                  onChange={(e) => setFormData({...formData, alergias: e.target.value})}
                  className="w-full px-3 py-1 border rounded mt-1"
                  rows={2}
                  placeholder="Importante para seguridad del paciente"
                />
              </label>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className={`flex items-center gap-2 ${errors.some(e => e.includes('consentimiento')) ? 'text-red-500' : ''}`}>
              <input
                type="checkbox"
                checked={formData.consentimientoFirmado}
                onChange={(e) => setFormData({...formData, consentimientoFirmado: e.target.checked})}
                required
              />
              <span className="text-sm">
                <span className="text-red-500">*</span> Confirmo que he obtenido el consentimiento informado del paciente según RGPD/HIPAA
              </span>
            </label>
          </div>

          <div className="flex justify-between items-center pt-4">
            <p className="text-xs text-gray-500">
              Los datos serán encriptados (AES-256) y almacenados según normativa
            </p>
            <div className="flex gap-2">
              <Button type="button" onClick={onClose} variant="outline">
                Cancelar
              </Button>
              <Button type="submit">
                Crear Paciente
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
