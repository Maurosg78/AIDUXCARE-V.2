// src/context/SessionContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SessionStorage } from '../services/session-storage';

interface SessionContextType {
  sessionData: any;
  updateSessionData: (key: string, value: any) => void;
  saveSession: () => void;
  loadPreviousSession: (patientId: string) => any;
  
  // Nueva funcionalidad para selectedIds
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  onSelectionChange: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  
  // Para seguimiento rápido
  isQuickFollowUp: boolean;
  setIsQuickFollowUp: (value: boolean) => void;
  previousSessionData: any | null;
  setPreviousSessionData: (data: any) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionData, setSessionData] = useState({
    patientId: null,
    tab1: {
      transcript: '',
      analysisResults: null,
      selectedItems: [] // Renombrado para claridad
    },
    tab2: {
      suggestedTests: [],
      completedTests: []
    },
    tab3: {
      soapNote: null
    },
    metadata: {
      startTime: new Date().toISOString(),
      lastSaved: null,
      lastModified: null
    }
  });

  // Estado para selectedIds (compartido entre todos los tabs)
  const [selectedIds, setSelectedIdsState] = useState<string[]>([]);
  
  // Estados para seguimiento rápido
  const [isQuickFollowUp, setIsQuickFollowUp] = useState(false);
  const [previousSessionData, setPreviousSessionData] = useState<any | null>(null);

  const updateSessionData = (key: string, value: any) => {
    setSessionData(prev => ({
      ...prev,
      [key]: { ...prev[key], ...value },
      metadata: { ...prev.metadata, lastModified: new Date().toISOString() }
    }));
  };

  // Función principal para actualizar selectedIds
  const setSelectedIds = useCallback((ids: string[]) => {
    setSelectedIdsState(ids);
    // También actualizar en sessionData para persistencia
    updateSessionData('tab1', { selectedItems: ids });
    
    // Log para tracking ML futuro
    console.log('[SessionContext] Selection updated:', {
      count: ids.length,
      ids: ids,
      timestamp: new Date().toISOString()
    });
  }, []);

  // Alias para compatibilidad con componentes existentes
  const onSelectionChange = setSelectedIds;

  // Toggle individual para checkboxes
  const toggleSelection = useCallback((id: string) => {
    setSelectedIdsState(prev => {
      const isCurrentlySelected = prev.includes(id);
      const newSelection = isCurrentlySelected 
        ? prev.filter(item => item !== id)
        : [...prev, id];
      
      // Log para ML tracking
      console.log('[SessionContext] Toggle:', {
        id,
        action: isCurrentlySelected ? 'deselected' : 'selected',
        timestamp: new Date().toISOString()
      });
      
      // Actualizar sessionData
      updateSessionData('tab1', { selectedItems: newSelection });
      
      return newSelection;
    });
  }, []);

  // Limpiar toda la selección
  const clearSelection = useCallback(() => {
    console.log('[SessionContext] Clearing all selections');
    setSelectedIdsState([]);
    updateSessionData('tab1', { selectedItems: [] });
  }, []);

  // Verificar si un ID está seleccionado
  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  const saveSession = () => {
    if (sessionData.patientId) {
      const dataToSave = {
        ...sessionData,
        selectedIds: selectedIds // Incluir selectedIds en el guardado
      };
      SessionStorage.saveSession(sessionData.patientId, dataToSave);
      console.log('Sesión guardada:', new Date().toISOString());
    }
  };

  const loadPreviousSession = (patientId: string) => {
    const previousSession = SessionStorage.getSession(patientId);
    if (previousSession) {
      // Restaurar selectedIds si existen
      if (previousSession.selectedIds) {
        setSelectedIdsState(previousSession.selectedIds);
      }
      // Para seguimiento rápido
      setPreviousSessionData(previousSession);
    }
    return previousSession;
  };

  // Auto-guardado cada 30 segundos
  useEffect(() => {
    const interval = setInterval(saveSession, 30000);
    return () => clearInterval(interval);
  }, [sessionData, selectedIds]);

  // Sincronizar selectedIds con sessionData al inicio
  useEffect(() => {
    if (sessionData.tab1.selectedItems && sessionData.tab1.selectedItems.length > 0) {
      setSelectedIdsState(sessionData.tab1.selectedItems);
    }
  }, []); // Solo al montar

  return (
    <SessionContext.Provider value={{
      sessionData,
      updateSessionData,
      saveSession,
      loadPreviousSession,
      
      // Funcionalidad de selección
      selectedIds,
      setSelectedIds,
      onSelectionChange,
      toggleSelection,
      clearSelection,
      isSelected,
      
      // Seguimiento rápido
      isQuickFollowUp,
      setIsQuickFollowUp,
      previousSessionData,
      setPreviousSessionData
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession debe usarse dentro de SessionProvider');
  return context;
};
