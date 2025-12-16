// @ts-nocheck
/**
 * ProfessionalDataStep - Paso 2 del Wizard de Registro
 * Datos Profesionales (6 campos obligatorios del .md)
 * Incluye Universidad/Institución como especifica el .md
 * 
 * @version 1.0.0
 * @author AiDuxCare Development Team
 */

import React, { useState, useEffect } from 'react';
import { ProfessionalData } from '../../types/wizard';
import { useProfessionalProfile, ProfessionalProfile } from '../../context/ProfessionalProfileContext';
import { PROFESSIONAL_TITLES, PRIMARY_SPECIALTIES } from './onboardingConstants';

interface ProfessionalDataStepProps {
  data: ProfessionalData;
  errors: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
}

export const ProfessionalDataStep: React.FC<ProfessionalDataStepProps> = ({
  data,
  errors,
  onFieldChange
}) => {
  const { updateWizardData } = useProfessionalProfile();
  const [showOtherUniversity, setShowOtherUniversity] = useState(false);
  const [showOtherSpecialty, setShowOtherSpecialty] = useState(false);
  const [showOtherTitle, setShowOtherTitle] = useState(false);

  // Mapear campos del wizard a campos del contexto
  const handleFieldChangeWithContext = (field: string, value: string) => {
    // Solo logear cambios importantes, no cada letra
    if (field === 'professionalTitle' || field === 'specialty' || field === 'licenseNumber') {
      console.log(`ProfessionalDataStep - Campo cambiado: ${field} = ${value}`);
    }
    
    // Mapear campos del wizard a campos del contexto
    const fieldMapping: Record<string, keyof ProfessionalProfile> = {
      professionalTitle: 'professionalTitle',
      specialty: 'specialty',
      university: 'university',
      licenseNumber: 'licenseNumber',
      workplace: 'workplace',
      experienceYears: 'experienceYears'
    };

    const contextField = fieldMapping[field];
    if (contextField) {
      updateWizardData(contextField, value);
    }
    
    // También llamar al callback original para mantener compatibilidad
    onFieldChange(field, value);
  };

  // Universidades predefinidas
  const universities = [
    { value: 'universidad-complutense-madrid', label: 'Universidad Complutense de Madrid' },
    { value: 'universidad-autonoma-madrid', label: 'Universidad Autónoma de Madrid' },
    { value: 'universidad-carlos-iii', label: 'Universidad Carlos III de Madrid' },
    { value: 'universidad-politecnica-madrid', label: 'Universidad Politécnica de Madrid' },
    { value: 'universidad-rey-juan-carlos', label: 'Universidad Rey Juan Carlos' },
    { value: 'universidad-alcala', label: 'Universidad de Alcalá' },
    { value: 'universidad-barcelona', label: 'Universidad de Barcelona' },
    { value: 'universidad-valencia', label: 'Universidad de Valencia' },
    { value: 'universidad-sevilla', label: 'Universidad de Sevilla' },
    { value: 'universidad-granada', label: 'Universidad de Granada' },
    { value: 'universidad-salamanca', label: 'Universidad de Salamanca' },
    { value: 'universidad-navarra', label: 'Universidad de Navarra' },
    { value: 'universidad-pompeu-fabra', label: 'Universidad Pompeu Fabra' },
    { value: 'universidad-pais-vasco', label: 'Universidad del País Vasco' },
    { value: 'universidad-zaragoza', label: 'Universidad de Zaragoza' },
    { value: 'otro', label: 'Otra universidad' }
  ];

  // Especialidades por título profesional
  const getSpecialtiesByTitle = (title: string) => {
    if (title === 'Dr.' || title === 'Dra.') {
      return [
        { value: 'medicina-general', label: 'Medicina General' },
        { value: 'cardiologia', label: 'Cardiología' },
        { value: 'dermatologia', label: 'Dermatología' },
        { value: 'endocrinologia', label: 'Endocrinología' },
        { value: 'gastroenterologia', label: 'Gastroenterología' },
        { value: 'ginecologia', label: 'Ginecología' },
        { value: 'neurologia', label: 'Neurología' },
        { value: 'oncologia', label: 'Oncología' },
        { value: 'ortopedia', label: 'Ortopedia' },
        { value: 'pediatria', label: 'Pediatría' },
        { value: 'psiquiatria', label: 'Psiquiatría' },
        { value: 'radiologia', label: 'Radiología' },
        { value: 'traumatologia', label: 'Traumatología' },
        { value: 'urologia', label: 'Urología' },
        { value: 'otro', label: 'Otra especialidad' }
      ];
    } else if (title === 'FT.') {
      return [
        { value: 'fisioterapia-deportiva', label: 'Fisioterapia Deportiva' },
        { value: 'fisioterapia-ortopedica', label: 'Fisioterapia Ortopédica' },
        { value: 'fisioterapia-neurologica', label: 'Fisioterapia Neurológica' },
        { value: 'fisioterapia-respiratoria', label: 'Fisioterapia Respiratoria' },
        { value: 'fisioterapia-pediatrica', label: 'Fisioterapia Pediátrica' },
        { value: 'fisioterapia-geriatrica', label: 'Fisioterapia Geriátrica' },
        { value: 'fisioterapia-vestibular', label: 'Fisioterapia Vestibular' },
        { value: 'fisioterapia-pelvica', label: 'Fisioterapia Pélvica' },
        { value: 'otro', label: 'Otra área' }
      ];
    } else if (title === 'Ps.') {
      return [
        { value: 'psicologia-clinica', label: 'Psicología Clínica' },
        { value: 'psicologia-infantil', label: 'Psicología Infantil' },
        { value: 'psicologia-deportiva', label: 'Psicología Deportiva' },
        { value: 'psicologia-laboral', label: 'Psicología Laboral' },
        { value: 'psicologia-forense', label: 'Psicología Forense' },
        { value: 'psicologia-social', label: 'Psicología Social' },
        { value: 'psicologia-educativa', label: 'Psicología Educativa' },
        { value: 'otro', label: 'Otra área' }
      ];
    } else if (title === 'Nat.') {
      return [
        { value: 'naturopatia-general', label: 'Naturopatía General' },
        { value: 'naturopatia-nutricional', label: 'Naturopatía Nutricional' },
        { value: 'naturopatia-herbal', label: 'Naturopatía Herbal' },
        { value: 'naturopatia-homeopatica', label: 'Naturopatía Homeopática' },
        { value: 'naturopatia-acupuntura', label: 'Naturopatía con Acupuntura' },
        { value: 'otro', label: 'Otra área' }
      ];
    } else if (title === 'Pod.') {
      return [
        { value: 'podologia-general', label: 'Podología General' },
        { value: 'podologia-quirurgica', label: 'Podología Quirúrgica' },
        { value: 'podologia-deportiva', label: 'Podología Deportiva' },
        { value: 'podologia-ortopedica', label: 'Podología Ortopédica' },
        { value: 'podologia-geriatrica', label: 'Podología Geriátrica' },
        { value: 'otro', label: 'Otra área' }
      ];
    } else if (title === 'Nut.') {
      return [
        { value: 'nutricion-clinica', label: 'Nutrición Clínica' },
        { value: 'nutricion-deportiva', label: 'Nutrición Deportiva' },
        { value: 'nutricion-pediatrica', label: 'Nutrición Pediátrica' },
        { value: 'nutricion-geriatrica', label: 'Nutrición Geriátrica' },
        { value: 'nutricion-oncologica', label: 'Nutrición Oncológica' },
        { value: 'nutricion-vegetariana', label: 'Nutrición Vegetariana/Vegana' },
        { value: 'otro', label: 'Otra área' }
      ];
    } else if (title === 'TO.') {
      return [
        { value: 'terapia-ocupacional-pediatrica', label: 'Terapia Ocupacional Pediátrica' },
        { value: 'terapia-ocupacional-geriatrica', label: 'Terapia Ocupacional Geriátrica' },
        { value: 'terapia-ocupacional-neurologica', label: 'Terapia Ocupacional Neurológica' },
        { value: 'terapia-ocupacional-ortopedica', label: 'Terapia Ocupacional Ortopédica' },
        { value: 'terapia-ocupacional-mental', label: 'Terapia Ocupacional en Salud Mental' },
        { value: 'otro', label: 'Otra área' }
      ];
    } else if (title === 'Log.') {
      return [
        { value: 'logopedia-infantil', label: 'Logopedia Infantil' },
        { value: 'logopedia-adultos', label: 'Logopedia en Adultos' },
        { value: 'logopedia-neurologica', label: 'Logopedia Neurológica' },
        { value: 'logopedia-geriatrica', label: 'Logopedia Geriátrica' },
        { value: 'logopedia-educativa', label: 'Logopedia Educativa' },
        { value: 'otro', label: 'Otra área' }
      ];
    } else if (title === 'Opt.') {
      return [
        { value: 'optica-general', label: 'Óptica General' },
        { value: 'optica-contactologia', label: 'Contactología' },
        { value: 'optica-baja-vision', label: 'Baja Visión' },
        { value: 'optica-pediatrica', label: 'Óptica Pediátrica' },
        { value: 'otro', label: 'Otra área' }
      ];
    } else if (title === 'Bio.') {
      return [
        { value: 'biologia-clinica', label: 'Biología Clínica' },
        { value: 'biologia-molecular', label: 'Biología Molecular' },
        { value: 'biologia-genetica', label: 'Genética' },
        { value: 'biologia-microbiologia', label: 'Microbiología' },
        { value: 'otro', label: 'Otra área' }
      ];
    } else if (title === 'Qui.') {
      return [
        { value: 'quiropractica-general', label: 'Quiropraxia General' },
        { value: 'quiropractica-deportiva', label: 'Quiropraxia Deportiva' },
        { value: 'quiropractica-pediatrica', label: 'Quiropraxia Pediátrica' },
        { value: 'quiropractica-geriatrica', label: 'Quiropraxia Geriátrica' },
        { value: 'otro', label: 'Otra área' }
      ];
    } else {
      return [
        { value: 'area-general', label: 'Área General' },
        { value: 'especializacion-avanzada', label: 'Especialización Avanzada' },
        { value: 'investigacion', label: 'Investigación' },
        { value: 'docencia', label: 'Docencia' },
        { value: 'administracion-sanitaria', label: 'Administración Sanitaria' },
        { value: 'otro', label: 'Otra área' }
      ];
    }
  };

  const experienceLevels = [
    { value: '0-2', label: '0-2 años' },
    { value: '3-5', label: '3-5 años' },
    { value: '6-10', label: '6-10 años' },
    { value: '11-15', label: '11-15 años' },
    { value: '16-20', label: '16-20 años' },
    { value: '20+', label: 'Más de 20 años' }
  ];

  useEffect(() => {
    // Mostrar campo "otro" para universidad si se selecciona
    setShowOtherUniversity(data.university === 'otro' || data.university === 'other');
    
    // Mostrar campo "otro" para especialidad si se selecciona
    setShowOtherSpecialty(data.specialty === 'other');
    
    // Mostrar campo "otro" para título profesional si se selecciona
    setShowOtherTitle(data.professionalTitle === 'other');
  }, [data.university, data.specialty, data.professionalTitle]);

  const handleUniversityChange = (value: string) => {
    handleFieldChangeWithContext('university', value);
    if (value !== 'otro') {
      handleFieldChangeWithContext('universityOther', '');
    }
  };

  const handleSpecialtyChange = (value: string) => {
    handleFieldChangeWithContext('specialty', value);
    if (value !== 'otro') {
      handleFieldChangeWithContext('specialtyOther', '');
    }
  };

  return (
    <>
      {/* Formulario con Grid Simétrico Perfecto */}
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Fila 1: Título Profesional y Especialidad */}
          <div className="form-group">
            <label htmlFor="professionalTitle" className="block text-sm font-medium text-gray-700 mb-2">
              Professional Title *
            </label>
            <select 
              id="professionalTitle"
              value={data.professionalTitle} 
              onChange={(e) => {
                const value = e.target.value;
                handleFieldChangeWithContext('professionalTitle', value);
                if (value !== 'other') {
                  // Clear other title if switching away
                }
              }} 
              className={`block w-full h-12 px-4 py-3 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.professionalTitle ? 'border-red-300' : 'border-gray-200'}`}
            >
              <option value="">Select your professional title</option>
              {PROFESSIONAL_TITLES.map((title) => (
                <option key={title.value} value={title.value}>
                  {title.label}
                </option>
              ))}
            </select>
            {errors.professionalTitle && (
              <p className="text-sm text-red-600 mt-1">{errors.professionalTitle}</p>
            )}
          </div>
          
          {/* Other Title field */}
          {showOtherTitle && (
            <div className="form-group md:col-span-2">
              <label htmlFor="professionalTitleOther" className="block text-sm font-medium text-gray-700 mb-2">
                Specify your professional title *
              </label>
              <input 
                id="professionalTitleOther"
                type="text" 
                value={(data as any).professionalTitleOther || ''} 
                onChange={(e) => handleFieldChangeWithContext('professionalTitleOther', e.target.value)} 
                className={`block w-full h-12 px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.professionalTitle ? 'border-red-300' : 'border-gray-200'}`}
                placeholder="e.g., Athletic Therapist, Kinesiologist..."
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
              Primary Specialty *
            </label>
            <select 
              id="specialty"
              value={data.specialty} 
              onChange={(e) => handleSpecialtyChange(e.target.value)} 
              className={`block w-full h-12 px-4 py-3 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.specialty ? 'border-red-300' : 'border-gray-200'} ${!data.professionalTitle ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!data.professionalTitle}
            >
              <option value="">Select your primary specialty</option>
              {PRIMARY_SPECIALTIES.map((specialty) => (
                <option key={specialty.value} value={specialty.value}>
                  {specialty.label}
                </option>
              ))}
            </select>
            {errors.specialty && (
              <p className="text-sm text-red-600 mt-1">{errors.specialty}</p>
            )}
          </div>
          
          {/* Campo "otro" para especialidad - Ancho completo */}
          {showOtherSpecialty && (
            <div className="form-group md:col-span-2">
              <label htmlFor="specialtyOther" className="block text-sm font-medium text-gray-700 mb-2">
                Specify your specialty *
              </label>
              <input 
                id="specialtyOther"
                type="text" 
                value={data.specialtyOther || ''} 
                onChange={(e) => handleFieldChangeWithContext('specialtyOther', e.target.value)} 
                className={`block w-full h-12 px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.specialtyOther ? 'border-red-300' : 'border-gray-200'}`}
                placeholder="e.g., Manual Therapy, Dry Needling, Motor Control..."
              />
              {errors.specialtyOther && (
                <p className="text-sm text-red-600 mt-1">{errors.specialtyOther}</p>
              )}
            </div>
          )}
          
          {/* Fila 2: Universidad y Licencia */}
          <div className="form-group">
            <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-2">
              Universidad/Institución *
            </label>
            <select 
              id="university"
              value={data.university} 
              onChange={(e) => handleUniversityChange(e.target.value)} 
              className={`block w-full h-12 px-4 py-3 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.university ? 'border-red-300' : 'border-gray-200'}`}
            >
              <option value="">Selecciona tu universidad</option>
              {universities.map((university) => (
                <option key={university.value} value={university.value}>
                  {university.label}
                </option>
              ))}
            </select>
            {errors.university && (
              <p className="text-sm text-red-600 mt-1">{errors.university}</p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Número de Licencia/Colegiado *
            </label>
            <input 
              id="licenseNumber"
              type="text" 
              value={data.licenseNumber} 
              onChange={(e) => handleFieldChangeWithContext('licenseNumber', e.target.value)} 
              className={`block w-full h-12 px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.licenseNumber ? 'border-red-300' : 'border-gray-200'}`}
              placeholder="Tu número de licencia"
            />
            {errors.licenseNumber && (
              <p className="text-sm text-red-600 mt-1">{errors.licenseNumber}</p>
            )}
          </div>
          
          {/* Campo "otro" para universidad - Ancho completo */}
          {showOtherUniversity && (
            <div className="form-group md:col-span-2">
              <label htmlFor="universityOther" className="block text-sm font-medium text-gray-700 mb-2">
                Especifica tu universidad *
              </label>
              <input 
                id="universityOther"
                type="text" 
                value={data.universityOther || ''} 
                onChange={(e) => handleFieldChangeWithContext('universityOther', e.target.value)} 
                className={`block w-full h-12 px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.universityOther ? 'border-red-300' : 'border-gray-200'}`}
                placeholder="Ej: Universidad de [Ciudad], Instituto [Nombre]..."
              />
              {errors.universityOther && (
                <p className="text-sm text-red-600 mt-1">{errors.universityOther}</p>
              )}
            </div>
          )}
          
          {/* Fila 3: Centro de Trabajo y Años de Experiencia */}
          <div className="form-group">
            <label htmlFor="workplace" className="block text-sm font-medium text-gray-700 mb-2">
              Centro de Trabajo
            </label>
            <input 
              id="workplace"
              type="text" 
              value={data.workplace} 
              onChange={(e) => handleFieldChangeWithContext('workplace', e.target.value)} 
              className={`block w-full h-12 px-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.workplace ? 'border-red-300' : 'border-gray-200'}`}
              placeholder="Ej: Clínica, Hospital, Consulta particular..."
            />
            {errors.workplace && (
              <p className="text-sm text-red-600 mt-1">{errors.workplace}</p>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="experienceYears" className="block text-sm font-medium text-gray-700 mb-2">
              Años de Experiencia *
            </label>
            <select 
              id="experienceYears"
              value={data.experienceYears} 
              onChange={(e) => handleFieldChangeWithContext('experienceYears', e.target.value)} 
              className={`block w-full h-12 px-4 py-3 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white text-base ${errors.experienceYears ? 'border-red-300' : 'border-gray-200'}`}
            >
              <option value="">Selecciona tus años de experiencia</option>
              {experienceLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            {errors.experienceYears && (
              <p className="text-sm text-red-600 mt-1">{errors.experienceYears}</p>
            )}
          </div>
          
          {/* Información adicional - Ancho completo */}
          <div className="form-group md:col-span-2">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="h-5 w-5 text-gray-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">
                    Esta información nos ayuda a personalizar tu experiencia y asegurar que cumples con los requisitos profesionales para el uso de AiDuxCare.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 