import React from "react";

interface Props {
  hasConsent: boolean;
  version?: string;
  date?: string;
}

export const ConsentStatusBadge: React.FC<Props> = ({
  hasConsent,
  version = "1.1",
  date,
}) => {
  const color = hasConsent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
  const label = hasConsent ? "Consent Active" : "No Consent";

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${color}`}
      title={date ? `Consent since ${date}` : ""}
    >
      <span className="mr-2">🧾</span> {label} {hasConsent && `v${version}`}
    </div>
  );
};
