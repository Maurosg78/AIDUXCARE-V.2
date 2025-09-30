import React from 'react';
import { User, Calendar, Pill, AlertCircle } from 'lucide-react';

interface PatientInfoHeaderProps {
  patientData: any;
  analysisResults: any;
}

export const PatientInfoHeader: React.FC<PatientInfoHeaderProps> = ({
  patientData,
  analysisResults
}) => {
  // Combinar información existente con nueva sin duplicar
  const mergePatientData = () => {
    const merged = { ...patientData };
    
    // Actualizar medicación si hay cambios
    if (analysisResults?.entities) {
      const newMeds = analysisResults.entities
        .filter((e: { type?: string; text?: string }) => e.type === 'medication')
        .map((e: { text?: string }) => e.text);
      
      // Comparar y actualizar solo si es diferente
      newMeds.forEach((med: string) => {
        if (!merged.medications?.includes(med)) {
          merged.medications = [...(merged.medications || []), med];
        }
      });
    }
    
    return merged;
  };

  const mergedData = mergePatientData();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-4 border border-blue-200">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <User className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold">{mergedData.name || 'Paciente'}</h2>
            <p className="text-sm text-gray-600">
              ID: {mergedData.id} | {mergedData.age} años | Dx: {mergedData.diagnosis}
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Última actualización: {new Date().toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
        {/* Historial Médico */}
        <div className="bg-white p-3 rounded">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Historial Médico
          </h3>
          <ul className="space-y-1 text-gray-600">
            {mergedData.surgeries?.map((surgery: string, idx: number) => (
              <li key={idx}>• {surgery}</li>
            ))}
            {mergedData.conditions?.map((condition: string, idx: number) => (
              <li key={idx}>• {condition}</li>
            ))}
          </ul>
        </div>

        {/* Medicación Actual */}
        <div className="bg-white p-3 rounded">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <Pill className="w-4 h-4" />
            Medicación Actual
          </h3>
          <ul className="space-y-1 text-gray-600">
            {mergedData.medications?.map((med: string, idx: number) => (
              <li key={idx}>• {med}</li>
            ))}
          </ul>
        </div>

        {/* Alergias y Antecedentes */}
        <div className="bg-white p-3 rounded">
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Información Importante
          </h3>
          <ul className="space-y-1 text-gray-600">
            <li>• Alergias: {mergedData.allergies || 'Ninguna conocida'}</li>
            <li>• Ant. Familiares: {mergedData.familyHistory || 'No relevantes'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
