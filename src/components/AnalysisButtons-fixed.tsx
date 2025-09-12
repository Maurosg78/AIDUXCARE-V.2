interface AnalysisButtonsProps {
  // ... otros props ...
  disabled?: boolean; // Nuevo
}

export const AnalysisButtons: React.FC<AnalysisButtonsProps> = ({
  // ... otros props ...
  disabled = false
}) => {
  const canAffordNormal = credits >= 1 && !disabled;
  const canAffordPro = credits >= 3 && !disabled;
  
  // ... resto del componente con los botones visibles pero deshabilitados si no hay texto
};
