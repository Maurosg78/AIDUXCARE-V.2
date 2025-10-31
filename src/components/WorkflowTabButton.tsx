import React from "react";

interface WorkflowTabButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

export const WorkflowTabButton: React.FC<WorkflowTabButtonProps> = ({ active, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`py-3 px-1 border-b-2 ${
        active
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500'
      }`}
    >
      {label}
    </button>
  );
};
