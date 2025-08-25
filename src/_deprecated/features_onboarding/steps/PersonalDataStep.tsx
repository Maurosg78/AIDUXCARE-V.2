import React from 'react';

interface PersonalDataStepProps {
  data: any;
  onUpdate: (field: string, value: any) => void;
  onNext: () => void;
}

const PersonalDataStep: React.FC<PersonalDataStepProps> = ({ data, onUpdate, onNext }) => {
  const handleFieldChange = (field: string, value: any) => {
    onUpdate(field, value);
  };

  const canProceed = data.firstName && data.lastName && data.email && data.licenseNumber;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Datos Personales</h2>
        <p className="text-gray-600">Información básica y licencia profesional</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primer Nombre *
          </label>
          <input
            type="text"
            value={data.firstName || ''}
            onChange={(e) => handleFieldChange('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Segundo Nombre
          </label>
          <input
            type="text"
            value={data.secondName || ''}
            onChange={(e) => handleFieldChange('secondName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primer Apellido *
          </label>
          <input
            type="text"
            value={data.lastName || ''}
            onChange={(e) => handleFieldChange('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Segundo Apellido
          </label>
          <input
            type="text"
            value={data.secondLastName || ''}
            onChange={(e) => handleFieldChange('secondLastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={data.email || ''}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            value={data.phone || ''}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de Licencia/Colegiado *
          </label>
          <input
            type="text"
            value={data.licenseNumber || ''}
            onChange={(e) => handleFieldChange('licenseNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: 12345-67890 o COL-12345"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            País de Licencia *
          </label>
          <select
            value={data.country || ''}
            onChange={(e) => handleFieldChange('country', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Selecciona un país</option>
            <option value="ES">España</option>
            <option value="MX">México</option>
            <option value="AR">Argentina</option>
            <option value="CO">Colombia</option>
            <option value="CL">Chile</option>
            <option value="PE">Perú</option>
            <option value="US">Estados Unidos</option>
            <option value="GB">Reino Unido</option>
            <option value="DE">Alemania</option>
            <option value="FR">Francia</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-2 rounded-lg text-white bg-gradient-to-r from-fuchsia-500 to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:from-fuchsia-600 hover:to-blue-600 transition-all"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default PersonalDataStep; 