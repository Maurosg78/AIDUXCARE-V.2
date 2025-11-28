import React from "react";

export function ConsentCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="mt-4">
      <label className="flex items-start space-x-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1"
        />
        <span className="text-sm text-gray-700">
          I acknowledge that AiDuxCare operates under PHIPA and PIPEDA, and I consent to the secure processing of my professional and patient data within Canada.
        </span>
      </label>
    </div>
  );
}
