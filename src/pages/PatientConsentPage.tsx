// @ts-nocheck
import React, { useState } from "react";

const PatientConsentPage: React.FC = () => {
  const [patientName, setPatientName] = useState("");
  const [useType, setUseType] = useState("Clinical");

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  const consentData = {
    accepted: true,
    timestamp: new Date().toISOString(),
  };

  localStorage.setItem("aidux_patient_consent", JSON.stringify(consentData));

  // ✅ Redirección canónica
  window.location.href = "/workflow";
};

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center text-blue-700">
          Patient Consent Form
        </h1>

        <form onSubmit={handleSubmit}>
          <label className="block mb-4">
            <span className="text-gray-700">Patient Name</span>
            <input
              type="submit"
              required
	      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mt-4"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </label>

          <label className="block mb-4">
            <span className="text-gray-700">Use Type</span>
            <select
              className="w-full border rounded px-2 py-1 mt-1"
              value={useType}
              onChange={(e) => setUseType(e.target.value)}
            >
              <option value="Clinical">Clinical</option>
              <option value="Research">Research</option>
            </select>
          </label>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Submit Consent
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatientConsentPage;

