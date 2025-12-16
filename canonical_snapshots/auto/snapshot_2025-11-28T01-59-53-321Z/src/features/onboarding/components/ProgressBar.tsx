import React from "react";

export function ProgressBar({ step }: { step: number }) {
  const width = ((step + 1) / 3) * 100;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
