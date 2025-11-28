import React from "react";

export function StepHeader({ step }: { step: number }) {
  const titles = ["Personal Info", "Professional Info", "Legal & Compliance"];
  return (
    <h1 className="text-2xl font-bold text-center text-blue-700">
      {titles[step]}
    </h1>
  );
}
