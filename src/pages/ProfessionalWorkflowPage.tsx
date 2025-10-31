import React, { useState, useEffect } from "react";
import { useConsentCheck } from "../hooks/useConsentCheck";
import { ConsentRequiredBanner } from "../components/ConsentRequiredBanner";
import { ConsentStatusBadge } from "../components/ConsentStatusBadge";
import { WorkflowTabButton } from "../components/WorkflowTabButton";

export const ProfessionalWorkflowPage: React.FC = () => {
  const { isReady, hasConsent } = useConsentCheck();

  if (!isReady)
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Checking consent status...
      </div>
    );

  if (!hasConsent)
    return (
      <ConsentRequiredBanner onGoToConsent={() => (window.location.href = "/patient-consent")} />
    );

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Professional Workflow</h1>
        <ConsentStatusBadge hasConsent={hasConsent} version="1.1" />
      </div>
      <div className="flex space-x-4">
        <WorkflowTabButton label="1. Analysis" active />
        <WorkflowTabButton label="2. Physical Evaluation" />
        <WorkflowTabButton label="3. SOAP Note" />
      </div>
      <p className="text-gray-600 mt-4">Welcome! Legal consent verified under PHIPA/PIPEDA.</p>
    </div>
  );
};

export default ProfessionalWorkflowPage;
