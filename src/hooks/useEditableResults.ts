import { useState, useCallback, useEffect } from 'react';

type MedicationDecisionInput = {
  id: string;
  name: string;
  dose?: string;
  frequency?: string;
  state?: string;
  note?: string;
};

export const useEditableResults = (initialResults: any) => {
  const [editedResults, setEditedResults] = useState(initialResults);

  // Actualizar cuando cambien los resultados iniciales
  useEffect(() => {
    setEditedResults(initialResults);
  }, [initialResults]);

  const handleTextChange = useCallback((id: string, newText: string) => {
    setEditedResults((prev: any) => {
      if (!prev) return prev;
      
      const updated = { ...prev };
      
      // Buscar y actualizar en entities
      if (updated.entities) {
        const entityIndex = updated.entities.findIndex((e: any) => e.id === id);
        if (entityIndex !== -1) {
          updated.entities = [...updated.entities];
          const entity = updated.entities[entityIndex];
          const medicationData =
            entity?.type === 'medication' &&
            entity?.medication_data &&
            typeof entity.medication_data === 'object'
              ? {
                  ...entity.medication_data,
                  normalized_name: newText,
                  confidence: 'high',
                  requires_review: false,
                }
              : entity?.medication_data;

          updated.entities[entityIndex] = {
            ...entity,
            text: newText,
            medication_data: medicationData,
            edited: true
          };
        }
      }
      
      // Buscar en redFlags
      if (id.startsWith('red-')) {
        const index = parseInt(id.split('-')[1]);
        if (updated.redFlags && updated.redFlags[index]) {
          updated.redFlags = [...updated.redFlags];
          updated.redFlags[index] = newText;
        }
      }
      
      // Buscar en physicalTests
      if (id.startsWith('physical-')) {
        const index = parseInt(id.split('-')[1]);
        if (updated.physicalTests && updated.physicalTests[index]) {
          updated.physicalTests = [...updated.physicalTests];
          updated.physicalTests[index] = typeof updated.physicalTests[index] === 'string' 
            ? newText 
            : { ...updated.physicalTests[index], name: newText };
        }
      }
      
      // Buscar en yellowFlags
      if (id.startsWith('yellow-')) {
        const index = parseInt(id.split('-')[1]);
        if (updated.yellowFlags && updated.yellowFlags[index]) {
          updated.yellowFlags = [...updated.yellowFlags];
          updated.yellowFlags[index] = newText;
        }
      }
      
      // Buscar en biopsychosocial factors
      if (id.startsWith('occupational-')) {
        const index = parseInt(id.split('-')[1]);
        if (updated.biopsychosocial_occupational && updated.biopsychosocial_occupational[index]) {
          updated.biopsychosocial_occupational = [...updated.biopsychosocial_occupational];
          updated.biopsychosocial_occupational[index] = newText;
        }
      }
      
      if (id.startsWith('protective-')) {
        const index = parseInt(id.split('-')[1]);
        if (updated.biopsychosocial_protective && updated.biopsychosocial_protective[index]) {
          updated.biopsychosocial_protective = [...updated.biopsychosocial_protective];
          updated.biopsychosocial_protective[index] = newText;
        }
      }
      
      if (id.startsWith('functional-')) {
        const index = parseInt(id.split('-')[1]);
        if (updated.biopsychosocial_functional_limitations && updated.biopsychosocial_functional_limitations[index]) {
          updated.biopsychosocial_functional_limitations = [...updated.biopsychosocial_functional_limitations];
          updated.biopsychosocial_functional_limitations[index] = newText;
        }
      }
      
      if (id.startsWith('psychological-')) {
        const index = parseInt(id.split('-')[1]);
        if (updated.biopsychosocial_psychological && updated.biopsychosocial_psychological[index]) {
          updated.biopsychosocial_psychological = [...updated.biopsychosocial_psychological];
          updated.biopsychosocial_psychological[index] = newText;
        }
      }
      
      if (id.startsWith('social-')) {
        const index = parseInt(id.split('-')[1]);
        if (updated.biopsychosocial_social && updated.biopsychosocial_social[index]) {
          updated.biopsychosocial_social = [...updated.biopsychosocial_social];
          updated.biopsychosocial_social[index] = newText;
        }
      }
      
      if (id.startsWith('strength-')) {
        const index = parseInt(id.split('-')[1]);
        if (updated.biopsychosocial_patient_strengths && updated.biopsychosocial_patient_strengths[index]) {
          updated.biopsychosocial_patient_strengths = [...updated.biopsychosocial_patient_strengths];
          updated.biopsychosocial_patient_strengths[index] = newText;
        }
      }
      
      console.log('[Edit] Item modificado:', id, '→', newText);
      
      return updated;
    });
  }, []);

  const addCustomItem = useCallback((section: string, text: string) => {
    setEditedResults((prev: any) => {
      if (!prev) return prev;
      
      const updated = { ...prev };
      const customId = `custom-${Date.now()}`;
      
      switch(section) {
        case 'symptoms':
          if (!updated.entities) updated.entities = [];
          updated.entities = [...updated.entities, {
            id: customId,
            text: text,
            type: 'symptom',
            custom: true,
            edited: true
          }];
          break;
          
        case 'physical':
          if (!updated.physicalTests) updated.physicalTests = [];
          updated.physicalTests = [...updated.physicalTests, text];
          break;
          
        case 'redFlags':
          if (!updated.redFlags) updated.redFlags = [];
          updated.redFlags = [...updated.redFlags, text];
          break;
          
        case 'yellowFlags':
          if (!updated.yellowFlags) updated.yellowFlags = [];
          updated.yellowFlags = [...updated.yellowFlags, text];
          break;
          
        case 'biopsychosocial_occupational':
          if (!updated.biopsychosocial_occupational) updated.biopsychosocial_occupational = [];
          updated.biopsychosocial_occupational = [...updated.biopsychosocial_occupational, text];
          break;
          
        case 'biopsychosocial_protective':
          if (!updated.biopsychosocial_protective) updated.biopsychosocial_protective = [];
          updated.biopsychosocial_protective = [...updated.biopsychosocial_protective, text];
          break;
          
        case 'biopsychosocial_functional_limitations':
          if (!updated.biopsychosocial_functional_limitations) updated.biopsychosocial_functional_limitations = [];
          updated.biopsychosocial_functional_limitations = [...updated.biopsychosocial_functional_limitations, text];
          break;
          
        case 'biopsychosocial_psychological':
          if (!updated.biopsychosocial_psychological) updated.biopsychosocial_psychological = [];
          updated.biopsychosocial_psychological = [...updated.biopsychosocial_psychological, text];
          break;
          
        case 'biopsychosocial_social':
          if (!updated.biopsychosocial_social) updated.biopsychosocial_social = [];
          updated.biopsychosocial_social = [...updated.biopsychosocial_social, text];
          break;
          
        case 'biopsychosocial_patient_strengths':
          if (!updated.biopsychosocial_patient_strengths) updated.biopsychosocial_patient_strengths = [];
          updated.biopsychosocial_patient_strengths = [...updated.biopsychosocial_patient_strengths, text];
          break;
      }
      
      console.log('[Add] Item personalizado agregado:', section, text);
      
      return updated;
    });
  }, []);

  const addMedicationDecisionToResults = useCallback((medication: MedicationDecisionInput) => {
    setEditedResults((prev: any) => {
      if (!prev) return prev;

      const medicationParts = [
        medication.name,
        medication.dose,
        medication.frequency,
        medication.state ? `estado: ${medication.state}` : undefined,
        medication.note,
        'confirmado por fisioterapeuta',
      ];
      const medicationText = medicationParts
        .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
        .join(' · ');
      const medicationEntry = {
        medication_data: {
          original_text: medicationText,
          normalized_name: medication.name,
          confidence: 'high',
          requires_review: false,
          ...(medication.dose ? { dose: medication.dose } : {}),
          ...(medication.frequency ? { frequency: medication.frequency } : {}),
        },
        source: 'clinician_confirmed',
        text: medicationText,
      };
      const entityEntry = {
        id: `physio-medication-${medication.id}`,
        medication_data: medicationEntry.medication_data,
        source: 'clinician_confirmed',
        text: medicationText,
        type: 'medication',
        custom: true,
        edited: true,
      };
      const existingMedications = Array.isArray(prev.medicacion_actual)
        ? prev.medicacion_actual
        : [];
      const existingEntities = Array.isArray(prev.entities)
        ? prev.entities
        : [];
      const medicationEntityId = `physio-medication-${medication.id}`;
      const alreadyMerged = existingEntities.some((entity: any) => entity?.id === medicationEntityId);

      if (alreadyMerged) {
        return prev;
      }

      const updated = {
        ...prev,
        medicacion_actual: [...existingMedications, medicationEntry],
        entities: [...existingEntities, { ...entityEntry, id: medicationEntityId }],
      };

      return updated;
    });
  }, []);

  return {
    editedResults: editedResults || initialResults,
    handleTextChange,
    addCustomItem,
    addMedicationDecisionToResults,
  };
};

export default useEditableResults;
