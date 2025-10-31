/**
 * AiDuxCare — WorkflowTabButton (fixed for optional onClick)
 * Market: CA | Language: en-CA
 */

import React from "react";

export interface WorkflowTabButtonProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const WorkflowTabButton: React.FC<WorkflowTabButtonProps> = ({
  label,
  active = false,
  onClick,
}) => {
  const base =
    "px-4 py-2 rounded-md text-sm font-medium border transition-colors duration-150";
  const activeStyle = active
    ? "bg-blue-600 text-white border-blue-600"
    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50";

  return (
    <button className={`${base} ${activeStyle}`} onClick={onClick}>
      {label}
    </button>
  );
};
