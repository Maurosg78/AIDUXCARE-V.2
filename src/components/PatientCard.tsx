// @ts-nocheck
import { useState, useEffect } from 'react';
import { AlertCircle, Pill, User } from 'lucide-react';

import { Card, Button } from '../shared/ui';

interface PatientCardProps {
  patient: any;
  detectedMedications?: string[];
  onUpdatePatient?: (updatedPatient: any) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ 
  patient, 
  detectedMedications = [],
  onUpdatePatient 
}) => {
  const [localPatient, setLocalPatient] = useState(patient);
  const [showMedicationAlert, setShowMedicationAlert] = useState(false);

  useEffect(() => {
    // Si detectamos medicamentos nuevos que no están en la ficha
    if (detectedMedications.length > 0) {
      const currentMeds = localPatient.medicamentos?.toLowerCase() || '';
      const newMeds = detectedMedications.filter(med => 
        !currentMeds.includes(med.toLowerCase().replace('💊 ', ''))
      );
      
      if (newMeds.length > 0) {
        setShowMedicationAlert(true);
      }
    }
  }, [detectedMedications]);

  const addDetectedMedications = () => {
    const cleanMeds = detectedMedications.map(m => m.replace('💊 ', '')).join(', ');
    const updatedPatient = {
      ...localPatient,
      medicamentos: localPatient.medicamentos 
        ? `${localPatient.medicamentos}, ${cleanMeds}`
        : cleanMeds
    };
    setLocalPatient(updatedPatient);
    setShowMedicationAlert(false);
    if (onUpdatePatient) onUpdatePatient(updatedPatient);
    
    // Analytics
    if ((window as any).Analytics) {
      (window as any).Analytics.track('MEDICATIONS_AUTO_ADDED', {
        count: detectedMedications.length,
        medications: cleanMeds
      });
    }
  };

  return (
    <Card className="p-3 relative">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm flex items-center gap-1">
          <User className="w-4 h-4" />
          Ficha del Paciente
        </h3>
        {showMedicationAlert && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs animate-pulse">
            !
          </div>
        )}
      </div>
      
      <div className="text-xs space-y-1">
        <p><strong>{localPatient.nombre} {localPatient.apellidos}</strong></p>
        <p>ID: {localPatient.id}</p>
        <p>Edad: {localPatient.edad}</p>
        <p>Diagnóstico: {localPatient.diagnosticoPrevio}</p>
        
        <div className="mt-2 p-2 bg-gray-50 rounded">
          <div className="flex items-center gap-1 mb-1">
            <Pill className="w-3 h-3 text-blue-600" />
            <strong>Medicación actual:</strong>
          </div>
          <p className="ml-4">{localPatient.medicamentos || 'No registrada'}</p>
        </div>
        
        {localPatient.alergias && (
          <p className="text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Alergias: {localPatient.alergias}
          </p>
        )}
      </div>
      
      {showMedicationAlert && detectedMedications.length > 0 && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-xs font-semibold mb-1">Medicamentos detectados:</p>
          <div className="text-xs space-y-1">
            {detectedMedications.map((med, idx) => (
              <div key={idx}>{med}</div>
            ))}
          </div>
          <Button 
            onClick={addDetectedMedications}
            size="sm"
            className="mt-2 w-full text-xs"
          >
            Agregar a ficha
          </Button>
        </div>
      )}
    </Card>
  );
};