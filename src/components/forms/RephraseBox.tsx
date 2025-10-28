import React, { useState } from "react";
import { useRephraseAI } from "../../hooks/useRephraseAI";

export const RephraseBox: React.FC = () => {
  const [text, setText] = useState("");
  const { suggestion, loading, rephrase } = useRephraseAI({
    role: "physio",
    section: "soap",
    tone: "formal",
  });

  return (
    <div className="p-3 border rounded-md bg-gray-50">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your clinical note..."
        className="w-full p-2 border rounded-md"
      />
      <button
        onClick={() => rephrase(text)}
        disabled={loading}
        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md"
      >
        {loading ? "Rephrasing..." : "Suggest improvement"}
      </button>

      {suggestion && (
        <div className="mt-3 p-2 bg-green-50 border rounded-md text-sm">
          <strong>Suggestion:</strong> {suggestion}
        </div>
      )}
    </div>
  );
};
