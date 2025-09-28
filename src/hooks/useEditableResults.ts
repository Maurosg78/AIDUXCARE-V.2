// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';

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
          updated.entities[entityIndex] = {
            ...updated.entities[entityIndex],
            text: newText,
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
      }
      
      console.log('[Add] Item personalizado agregado:', section, text);
      
      return updated;
    });
  }, []);

  return {
    editedResults: editedResults || initialResults,
    handleTextChange,
    addCustomItem
  };
};

export default useEditableResults;