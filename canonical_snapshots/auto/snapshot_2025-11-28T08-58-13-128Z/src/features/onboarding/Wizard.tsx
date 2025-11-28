import React, { useState } from "react";
import { PersonalTab } from "./tabs/PersonalTab";
import { ProfessionalTab } from "./tabs/ProfessionalTab";
import { LegalTab } from "./tabs/LegalTab";

export default function Wizard() {
  const [step, setStep] = useState(0);
  const next = () => setStep((s) => Math.min(s + 1, 2));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const steps = [
    <PersonalTab key="personal" next={next} />,
    <ProfessionalTab key="professional" next={next} back={back} />,
    <LegalTab key="legal" back={back} />,
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-4">
          AiDuxCare Onboarding
        </h1>
        <div className="flex justify-center gap-2 mb-6">
          {[1,2,3].map((i) => (
            <div key={i} className={`h-2 w-20 rounded-full ${i-1 <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>
        {steps[step]}
      </div>
    </div>
  );
}
