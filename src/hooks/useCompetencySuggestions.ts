import React from "react";
import {
  CompetencySuggestionService,
  competencySuggestionService,
  CompetencySuggestion,
  CompetencySuggestionContextDefaults,
} from "../services/CompetencySuggestionService";

export const CompetencySuggestionsIntegrator: React.FC<{ text: string }> = ({ text }) => {
  const suggestions = CompetencySuggestionService.suggest(text);
  return (
    <div className="p-3 border rounded-md bg-gray-50">
      <h3 className="font-semibold mb-2 text-gray-800">💡 Suggested Competencies</h3>
      <ul className="list-disc pl-5 space-y-1 text-gray-700">
        {suggestions.map((s) => (
          <li key={s.id}>
            {s.label}{" "}
            <span className="text-xs text-gray-500">
              ({Math.round((s.confidence || 0) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export function useCompetencySuggestions(text: string): CompetencySuggestion[] {
  return competencySuggestionService.suggest(text);
}
