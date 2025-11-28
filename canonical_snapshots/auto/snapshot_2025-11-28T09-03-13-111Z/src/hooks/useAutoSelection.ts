import { useEffect, useCallback } from 'react';

interface AutoSelectionOptions {
  enabled?: boolean;
  delayMs?: number;
}

export const useAutoSelection = (
  results: any,
  onSelectionChange: (ids: string[]) => void,
  options: AutoSelectionOptions = {}
) => {
  const { enabled = true, delayMs = 100 } = options;

  useEffect(() => {
    if (!results || !enabled) return;

    const timer = setTimeout(() => {
      const autoSelectIds: string[] = [];
      
      // Leer el campo autoSelect que viene de la IA
      results.entities?.forEach((entity: any) => {
        if (entity.autoSelect && entity.id) {
          autoSelectIds.push(entity.id);
        }
      });
      
      // Red flags siempre autoSelect
      results.redFlags?.forEach((flag: any, idx: number) => {
        if (flag.autoSelect !== false) {
          autoSelectIds.push(`red-${idx}`);
        }
      });
      
      // Tests físicos con autoSelect
      results.physicalTests?.forEach((test: any, idx: number) => {
        if (test.autoSelect) {
          autoSelectIds.push(`physical-${idx}`);
        }
      });
      
      // Yellow flags si tienen autoSelect
      results.yellowFlags?.forEach((flag: any, idx: number) => {
        if (flag.autoSelect) {
          autoSelectIds.push(`yellow-${idx}`);
        }
      });

      if (autoSelectIds.length > 0) {
        console.log(`[AutoSelection] Pre-seleccionando ${autoSelectIds.length} items`);
        onSelectionChange(autoSelectIds);
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [results, enabled, onSelectionChange, delayMs]);

  const selectQuickValidation = useCallback(() => {
    if (!results) return;
    
    const quickIds: string[] = [];
    
    // Solo items de alta prioridad
    results.entities?.forEach((e: any) => {
      if ((e.priority === 'critical' || e.priority === 'high') && e.id) {
        quickIds.push(e.id);
      }
    });
    
    // Todos los red flags
    results.redFlags?.forEach((_: any, idx: number) => {
      quickIds.push(`red-${idx}`);
    });
    
    // Top 3 tests
    results.physicalTests?.slice(0, 3).forEach((_: any, idx: number) => {
      quickIds.push(`physical-${idx}`);
    });
    
    onSelectionChange(quickIds);
  }, [results, onSelectionChange]);

  const selectCriticalOnly = useCallback(() => {
    if (!results) return;
    
    const criticalIds: string[] = [];
    
    // Solo items críticos
    results.entities?.forEach((e: any) => {
      if (e.priority === 'critical' && e.id) {
        criticalIds.push(e.id);
      }
    });
    
    // Red flags siempre son críticos
    results.redFlags?.forEach((_: any, idx: number) => {
      criticalIds.push(`red-${idx}`);
    });
    
    onSelectionChange(criticalIds);
  }, [results, onSelectionChange]);

  return {
    selectQuickValidation,
    selectCriticalOnly
  };
};

export default useAutoSelection;
