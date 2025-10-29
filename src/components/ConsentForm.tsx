// src/components/ConsentForm.tsx

import React, { useState } from "react";
import { ConsentService } from "../services/ConsentService";
import { ConsentRecord } from "../types/consent";

export default function ConsentForm() {
  const [formData, setFormData] = useState<Partial<ConsentRecord>>({
    ai_processing_consent: false,
    cross_border_disclosure: false,
    research_vs_clinical: "clinical",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const checked = target.checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const consent: ConsentRecord = {
      ...formData,
      patient_id: crypto.randomUUID(),
      consent_date: new Date().toISOString(),
      consent_version: "1.0",
      ip_address_hash: "hashed_ip_placeholder",
    } as ConsentRecord;

    ConsentService.saveConsent(consent);
    alert("Consent saved successfully!");
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4">Patient Consent Form</h2>

      <label className="block mb-3">
        <input
          type="checkbox"
          name="ai_processing_consent"
          checked={!!formData.ai_processing_consent}
          onChange={handleChange}
        />{" "}
        I consent to the use of my anonymized data for AI processing.
      </label>

      <label className="block mb-3">
        <input
          type="checkbox"
          name="cross_border_disclosure"
          checked={!!formData.cross_border_disclosure}
          onChange={handleChange}
        />{" "}
        I consent to cross-border data processing (Canada → global AI models).
      </label>

      <label className="block mb-3">
        Research or Clinical Use:
        <select
          name="research_vs_clinical"
          value={formData.research_vs_clinical}
          onChange={handleChange}
          className="ml-2 border p-1 rounded"
        >
          <option value="clinical">Clinical</option>
          <option value="research">Research</option>
        </select>
      </label>

      <button
        type="submit"
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Submit Consent
      </button>
    </form>
  );
}
