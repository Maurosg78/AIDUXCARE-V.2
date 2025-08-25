import React from 'react';

interface ProfessionalDataStepProps {
  data: any;
  onUpdate: (field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const ProfessionalDataStep: React.FC<ProfessionalDataStepProps> = ({ data, onUpdate, onNext, onBack }) => {
  const handleFieldChange = (field: string, value: any) => {
    onUpdate(field, value);
  };

  const canProceed = data.profession && data.specialty && data.yearsOfExperience > 0;

  const professionalTitles = [
    'Fisioterapeuta',
    'Médico',
    'Enfermero/a',
    'Psicólogo/a',
    'Terapeuta Ocupacional',
    'Logopeda',
    'Nutricionista',
    'Osteópata',
    'Quiropráctico',
    'Masajista Terapéutico',
    'Entrenador Personal',
    'Otro'
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Datos Profesionales</h2>
        <p className="text-gray-600">Profesión, especialidad y experiencia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profesión *
          </label>
          <select
            value={data.profession || ''}
            onChange={(e) => handleFieldChange('profession', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Selecciona tu profesión</option>
            {professionalTitles.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Especialidad *
          </label>
          <input
            type="text"
            value={data.specialty || ''}
            onChange={(e) => handleFieldChange('specialty', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Fisioterapia Deportiva, Psicología Clínica"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Años de Experiencia *
          </label>
          <input
            type="number"
            min="0"
            max="50"
            value={data.yearsOfExperience || ''}
            onChange={(e) => handleFieldChange('yearsOfExperience', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Certificaciones
          </label>
          <input
            type="text"
            value={data.certifications || ''}
            onChange={(e) => handleFieldChange('certifications', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Certificación en Terapia Manual"
          />
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all"
        >
          Anterior
        </button>
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

export default ProfessionalDataStep; 