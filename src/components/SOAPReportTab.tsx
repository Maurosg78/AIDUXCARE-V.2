/**
 * AiDuxCare — SOAPReportTab
 * Market: CA | Language: en-CA
 * Fix: removed invalid template interpolation in function names
 */

import React from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/button";

interface SOAPReportTabProps {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  onDownloadPDF?: () => void;
}

export const SOAPReportTab: React.FC<SOAPReportTabProps> = ({
  subjective,
  objective,
  assessment,
  plan,
  onDownloadPDF,
}) => {
  const { t } = useTranslation();

  /** Helper to generate section text */
  const generatePlan = () => {
    return `${t("soap.plan")}: ${plan || t("soap.noData")}`;
  };

  const generateAssessment = () => {
    return `${t("soap.assessment")}: ${assessment || t("soap.noData")}`;
  };

  const generateObjective = () => {
    return `${t("soap.objective")}: ${objective || t("soap.noData")}`;
  };

  const generateSubjective = () => {
    return `${t("soap.subjective")}: ${subjective || t("soap.noData")}`;
  };

  /** Combine all sections */
  const fullSOAP = () => {
    return [
      generateSubjective(),
      generateObjective(),
      generateAssessment(),
      generatePlan(),
    ].join("\n\n");
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t("soap.title", "SOAP Report")}</h2>
        {onDownloadPDF && (
          <Button onClick={onDownloadPDF} variant="outline">
            {t("soap.downloadPdf", "Download PDF")}
          </Button>
        )}
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-3 text-gray-800">
        <p>
          <strong>{t("soap.subjective")}:</strong> {subjective || t("soap.noData")}
        </p>
        <p>
          <strong>{t("soap.objective")}:</strong> {objective || t("soap.noData")}
        </p>
        <p>
          <strong>{t("soap.assessment")}:</strong> {assessment || t("soap.noData")}
        </p>
        <p>
          <strong>{t("soap.plan")}:</strong> {plan || t("soap.noData")}
        </p>
      </div>

      <div className="bg-gray-50 border rounded-lg p-3 text-sm text-gray-600 whitespace-pre-wrap">
        {fullSOAP()}
      </div>
    </div>
  );
};

export default SOAPReportTab;
