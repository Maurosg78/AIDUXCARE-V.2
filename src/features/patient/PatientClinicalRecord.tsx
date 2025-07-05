import React, { useEffect, useState, useMemo } from "react";
import supabase from "@/core/auth/supabaseClient";
import VisitRecordCard from "./components/VisitRecordCard";
import VisitIndicators from "./components/VisitIndicators";
import ClinicalFilters, {
  ClinicalFilters as ClinicalFiltersType,
} from "./components/ClinicalFilters";

interface Visit {
  id: string;
  created_at: string;
  reason: string;
}

interface VisitSummary {
  visit_id: string;
  summary_text: string;
  created_at: string;
}

interface SuggestionLog {
  visit_id: string;
  content: string;
  field: string;
  accepted_by: string;
  accepted_at: string;
}

interface PatientClinicalRecordProps {
  patientId: string;
}

const PatientClinicalRecord: React.FC<PatientClinicalRecordProps> = ({
  patientId,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [summaries, setSummaries] = useState<Record<string, VisitSummary>>({});
  const [suggestions, setSuggestions] = useState<
    Record<string, SuggestionLog[]>
  >({});
  const [filters, setFilters] = useState<ClinicalFiltersType>({
    selectedFields: [],
    hasSummary: false,
    dateRange: {
      from: "",
      to: "",
    },
  });

  useEffect(() => {
    const loadPatientData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Cargar visitas del paciente
        const { data: visitsData, error: visitsError } = await supabase
          .from("visits")
          .select("id, created_at, reason")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false });

        if (visitsError) throw visitsError;
        if (!visitsData) throw new Error("No se encontraron visitas");

        setVisits(visitsData);

        // Cargar resúmenes de las visitas
        const { data: summariesData, error: summariesError } = await supabase
          .from("visit_summaries")
          .select("*")
          .in(
            "visit_id",
            visitsData.map((v) => v.id),
          );

        if (summariesError) throw summariesError;

        // Convertir array de resúmenes a objeto indexado por visit_id
        const summariesMap = (summariesData || []).reduce(
          (acc, summary) => ({
            ...acc,
            [summary.visit_id]: summary,
          }),
          {} as Record<string, VisitSummary>,
        );

        setSummaries(summariesMap);

        // Cargar sugerencias integradas
        const { data: suggestionsData, error: suggestionsError } =
          await supabase
            .from("suggestion_logs")
            .select("*")
            .in(
              "visit_id",
              visitsData.map((v) => v.id),
            )
            .eq("status", "integrated");

        if (suggestionsError) throw suggestionsError;

        // Agrupar sugerencias por visit_id
        const suggestionsMap = (suggestionsData || []).reduce(
          (acc, suggestion) => ({
            ...acc,
            [suggestion.visit_id]: [
              ...(acc[suggestion.visit_id] || []),
              suggestion,
            ],
          }),
          {} as Record<string, SuggestionLog[]>,
        );

        setSuggestions(suggestionsMap);
      } catch (err) {
        console.error("Error al cargar datos del paciente:", err);
        setError("Error al cargar el historial clínico");
      } finally {
        setIsLoading(false);
      }
    };

    loadPatientData();
  }, [patientId]);

  // Filtrar visitas según los criterios seleccionados
  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      // Filtrar por campos impactados
      if (filters.selectedFields.length > 0) {
        const visitSuggestions = suggestions[visit.id] || [];
        const hasSelectedField = visitSuggestions.some((suggestion) =>
          filters.selectedFields.includes(suggestion.field),
        );
        if (!hasSelectedField) return false;
      }

      // Filtrar por presencia de resumen
      if (filters.hasSummary && !summaries[visit.id]) {
        return false;
      }

      // Filtrar por rango de fechas
      const visitDate = new Date(visit.created_at);
      if (filters.dateRange.from) {
        const fromDate = new Date(filters.dateRange.from);
        if (visitDate < fromDate) return false;
      }
      if (filters.dateRange.to) {
        const toDate = new Date(filters.dateRange.to);
        if (visitDate > toDate) return false;
      }

      return true;
    });
  }, [visits, suggestions, summaries, filters]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Cargando historial clínico...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-md">
        <p className="text-gray-600">
          El paciente no tiene visitas registradas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Historial Clínico
      </h2>

      <ClinicalFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalVisits={visits.length}
        filteredVisits={filteredVisits.length}
      />

      {filteredVisits.map((visit) => (
        <div key={visit.id} className="bg-white rounded-lg shadow-sm">
          <VisitRecordCard
            visit={visit}
            summary={summaries[visit.id]}
            suggestions={suggestions[visit.id] || []}
          />
          <VisitIndicators
            suggestions={suggestions[visit.id] || []}
            visitId={visit.id}
          />
        </div>
      ))}

      {filteredVisits.length === 0 && (
        <div className="bg-gray-50 p-4 rounded-md text-center">
          <p className="text-gray-600">
            No hay visitas que coincidan con los filtros seleccionados
          </p>
        </div>
      )}
    </div>
  );
};

export default PatientClinicalRecord;
