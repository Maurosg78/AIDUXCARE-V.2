import React, { useState } from "react";

export function FileUploader({ label, onChange }: { label: string; onChange?: (f: File) => void }) {
  const [file, setFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected && onChange) onChange(selected);
  };

  return (
    <div>
      <label className="block font-medium text-gray-700 mb-1">{label}</label>
      <input type="file" accept=".pdf" onChange={handleChange} />
      {file && <p className="text-sm text-gray-500 mt-1">Selected: {file.name}</p>}
    </div>
  );
}
