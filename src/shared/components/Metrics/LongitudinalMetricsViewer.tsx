import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  LongitudinalMetric,
  getEvolutionIndicator,
  getLongitudinalMetricsByPatient,
  getLongitudinalMetricForVisit,
} from "../../../services/UsageAnalyticsService";

/**
 * Props para el componente LongitudinalMetricsViewer
 */
interface LongitudinalMetricsViewerProps {
  patientId?: string;
  visitId?: string;
  compactView?: boolean;
}

/**
 * Interfaz para tipar los detalles de métricas previas
 */
interface PreviousMetricsDetails {
  generated: number;
  accepted: number;
  integrated: number;
  field_matched: number;
  warnings: number;
  estimated_time_saved_minutes: number;
}

/**
 * Interfaz para tipar los detalles de métricas longitudinales
 */
interface MetricDetails {
  previous_metrics: PreviousMetricsDetails;
  current_metrics: PreviousMetricsDetails;
  comparison_date: string;
}

/**
 * Función para verificar si un objeto tiene el formato de MetricDetails
 */
function isMetricDetails(details: unknown): details is MetricDetails {
  if (!details || typeof details !== "object") return false;

  const d = details as Record<string, unknown>;

  return (
    "previous_metrics" in d &&
    "current_metrics" in d &&
    "comparison_date" in d &&
    typeof d.previous_metrics === "object" &&
    typeof d.current_metrics === "object" &&
    typeof d.comparison_date === "string"
  );
}

/**
 * Función para obtener de forma segura detalles de métricas
 */
function getPreviousMetric(
  details: unknown,
  key: keyof PreviousMetricsDetails,
  defaultValue = 0,
): number {
  if (!isMetricDetails(details)) return defaultValue;

  const value = details.previous_metrics[key];
  return typeof value === "number" ? value : defaultValue;
}

/**
 * Componente que muestra métricas longitudinales de evolución clínica
 */
const LongitudinalMetricsViewer: React.FC<LongitudinalMetricsViewerProps> = ({
  patientId,
  visitId,
  compactView = false,
}) => {
  // Estados
  const [metrics, setMetrics] = useState<LongitudinalMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] =
    useState<LongitudinalMetric | null>(null);
  const [expandedView, setExpandedView] = useState(false);

  // Cargar métricas al montar el componente
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Si tenemos un visitId específico, cargar solo esa métrica
        if (visitId) {
          const metric = await getLongitudinalMetricForVisit(visitId);
          if (metric) {
            setMetrics([metric]);
            setSelectedMetric(metric);
          } else {
            setMetrics([]);
            setSelectedMetric(null);
          }
        }
        // Si tenemos un patientId, cargar todas las métricas del paciente
        else if (patientId) {
          const patientMetrics =
            await getLongitudinalMetricsByPatient(patientId);
          setMetrics(patientMetrics);

          if (patientMetrics.length > 0) {
            setSelectedMetric(patientMetrics[0]);
          }
        } else {
          setError("Se requiere un patientId o visitId para mostrar métricas");
        }
      } catch (err) {
        console.error("Error al cargar métricas longitudinales:", err);
        setError("Error al cargar métricas de evolución clínica");
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [patientId, visitId]);

  // Si no hay métricas, no mostrar nada
  if (!loading && metrics.length === 0) {
    if (compactView) {
      return null;
    }

    return (
      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 text-center my-4">
        <p className="text-gray-500">
          No hay métricas longitudinales disponibles
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Se requieren al menos dos visitas para generar métricas comparativas
        </p>
      </div>
    );
  }

  // Formatear fecha para mostrar
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", {
        locale: es,
      });
    } catch (e) {
      return dateString;
    }
  };

  // El cálculo de variación porcentual se hacía directamente en renderVariation

  // Obtener clase CSS según la evolución clínica
  const getEvolutionClass = (
    evolution: "improved" | "stable" | "worsened",
  ): string => {
    switch (evolution) {
      case "improved":
        return "text-green-600";
      case "stable":
        return "text-yellow-600";
      case "worsened":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Mostrar texto según la evolución clínica
  const getEvolutionText = (
    evolution: "improved" | "stable" | "worsened",
  ): string => {
    switch (evolution) {
      case "improved":
        return "Mejoría";
      case "stable":
        return "Estable";
      case "worsened":
        return "Empeoramiento";
      default:
        return "Desconocido";
    }
  };

  // Vista compacta (para uso en tarjetas o paneles pequeños)
  if (compactView && selectedMetric) {
    return (
      <div className="border rounded-md border-gray-200 bg-white p-3 shadow-sm">
        <h3 className="text-sm font-medium text-gray-700 flex items-center mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4 mr-1 text-blue-500"
          >
            <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" />
          </svg>
          Evolución Clínica
        </h3>

        <div className="flex items-center mb-2">
          <div className="text-2xl mr-2">
            {getEvolutionIndicator(selectedMetric.clinical_evolution)}
          </div>
          <div
            className={`font-medium ${getEvolutionClass(selectedMetric.clinical_evolution)}`}
          >
            {getEvolutionText(selectedMetric.clinical_evolution)}
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Comparación con visita anterior: {formatDate(selectedMetric.date)}
        </div>
      </div>
    );
  }

  // Vista detallada
  return (
    <div className="border rounded-md border-gray-200 bg-white shadow-sm mt-6 mb-6">
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 mr-2 text-blue-500"
          >
            <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.035-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.035.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75c-1.035 0-1.875-.84-1.875-1.875V8.625zM3 13.125c0-1.035.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75C3.84 21.75 3 20.91 3 19.875v-6.75z" />
          </svg>
          Métricas de Evolución Clínica
        </h3>
        <button
          onClick={() => setExpandedView(!expandedView)}
          className="px-3 py-1 text-sm font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100"
        >
          {expandedView ? "Vista resumida" : "Vista detallada"}
        </button>
      </div>

      {loading ? (
        <div className="p-4 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando métricas...</p>
        </div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : selectedMetric ? (
        <div className="p-4">
          {/* Encabezado con la evolución general */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center">
              <div className="text-3xl mr-3">
                {getEvolutionIndicator(selectedMetric.clinical_evolution)}
              </div>
              <div>
                <div
                  className={`text-xl font-semibold ${getEvolutionClass(selectedMetric.clinical_evolution)}`}
                >
                  {getEvolutionText(selectedMetric.clinical_evolution)}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedMetric.previous_visit_id
                    ? `Comparación entre visitas del ${formatDate(selectedMetric.date)}`
                    : "Primera visita - no hay comparación previa"}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                Nivel de riesgo
              </div>
              <div
                className={`font-semibold ${
                  selectedMetric.risk_level_summary === "low"
                    ? "text-green-600"
                    : selectedMetric.risk_level_summary === "medium"
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {selectedMetric.risk_level_summary === "low"
                  ? "Bajo"
                  : selectedMetric.risk_level_summary === "medium"
                    ? "Medio"
                    : "Alto"}
              </div>
            </div>
          </div>

          {/* Indicadores de métricas clave */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Métrica 1: Campos clínicos cambiados */}
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                Campos modificados
              </div>
              <div className="text-xl font-semibold text-gray-700">
                {selectedMetric.fields_changed}
              </div>
            </div>

            {/* Métrica 2: Sugerencias generadas e integradas */}
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                Sugerencias IA
              </div>
              <div className="text-xl font-semibold text-gray-700">
                {selectedMetric.suggestions_integrated} /{" "}
                {selectedMetric.suggestions_generated}
                <span className="text-sm font-normal text-gray-500 ml-1">
                  (
                  {selectedMetric.suggestions_generated > 0
                    ? Math.round(
                        (selectedMetric.suggestions_integrated /
                          selectedMetric.suggestions_generated) *
                          100,
                      )
                    : 0}
                  %)
                </span>
              </div>
            </div>

            {/* Métrica 3: Audio transcrito validado */}
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                Audio transcrito
              </div>
              <div className="text-xl font-semibold text-gray-700">
                {selectedMetric.audio_items_validated}
                <span className="text-sm font-normal text-gray-500 ml-1">
                  ítems
                </span>
              </div>
            </div>

            {/* Métrica 4: Tiempo estimado ahorrado */}
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                Tiempo ahorrado
              </div>
              <div className="text-xl font-semibold text-gray-700">
                {selectedMetric.time_saved_minutes}
                <span className="text-sm font-normal text-gray-500 ml-1">
                  min
                </span>
              </div>
            </div>
          </div>

          {/* Sección expandida con más detalles */}
          {expandedView && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">
                Detalles comparativos
              </h4>

              {/* Tabla de comparación */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Métrica
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Valor actual
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Valor previo
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Variación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Solo podemos mostrar comparaciones si tenemos detalles */}
                    {selectedMetric.details && (
                      <>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Sugerencias IA
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {selectedMetric.suggestions_generated}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getPreviousMetric(
                              selectedMetric.details,
                              "generated",
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {renderVariation(
                              selectedMetric.suggestions_generated,
                              getPreviousMetric(
                                selectedMetric.details,
                                "generated",
                              ),
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Tiempo ahorrado
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {selectedMetric.time_saved_minutes} min
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getPreviousMetric(
                              selectedMetric.details,
                              "estimated_time_saved_minutes",
                            )}{" "}
                            min
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {renderVariation(
                              selectedMetric.time_saved_minutes,
                              getPreviousMetric(
                                selectedMetric.details,
                                "estimated_time_saved_minutes",
                              ),
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Tasa de aceptación
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {selectedMetric.suggestions_generated > 0
                              ? Math.round(
                                  (selectedMetric.suggestions_accepted /
                                    selectedMetric.suggestions_generated) *
                                    100,
                                )
                              : 0}
                            %
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getPreviousMetric(
                              selectedMetric.details,
                              "generated",
                            ) > 0
                              ? Math.round(
                                  (getPreviousMetric(
                                    selectedMetric.details,
                                    "accepted",
                                  ) /
                                    getPreviousMetric(
                                      selectedMetric.details,
                                      "generated",
                                    )) *
                                    100,
                                )
                              : 0}
                            %
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {renderVariation(
                              selectedMetric.suggestions_generated > 0
                                ? Math.round(
                                    (selectedMetric.suggestions_accepted /
                                      selectedMetric.suggestions_generated) *
                                      100,
                                  )
                                : 0,
                              getPreviousMetric(
                                selectedMetric.details,
                                "generated",
                              ) > 0
                                ? Math.round(
                                    (getPreviousMetric(
                                      selectedMetric.details,
                                      "accepted",
                                    ) /
                                      getPreviousMetric(
                                        selectedMetric.details,
                                        "generated",
                                      )) *
                                      100,
                                  )
                                : 0,
                            )}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Notas adicionales si existen */}
              {selectedMetric.notes && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                  <p className="font-medium mb-1">Notas adicionales:</p>
                  <p>{selectedMetric.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Selector de métrica si hay múltiples */}
          {metrics.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Historial de métricas:
              </h4>
              <div className="flex flex-wrap gap-2">
                {metrics.map((metric) => (
                  <button
                    key={metric.visit_id}
                    onClick={() => setSelectedMetric(metric)}
                    className={`px-3 py-1 text-sm rounded-md transition ${
                      selectedMetric === metric
                        ? "bg-blue-100 text-blue-700 font-medium"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {formatDate(metric.date)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          No se encontraron métricas para esta visita
        </div>
      )}
    </div>
  );
};

// Función auxiliar para renderizar variaciones con flechas y colores
const renderVariation = (current: number, previous: number): JSX.Element => {
  if (previous === 0 && current === 0) {
    return <span className="text-gray-500">Sin cambio</span>;
  }

  const percentChange = getPercentChange(current, previous);
  const isIncrease = current > previous;

  return (
    <div
      className={`flex items-center ${isIncrease ? "text-green-600" : "text-red-600"}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={`w-4 h-4 mr-1 ${isIncrease ? "" : "transform rotate-180"}`}
      >
        <path
          fillRule="evenodd"
          d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
          clipRule="evenodd"
        />
      </svg>
      <span>{Math.abs(percentChange)}%</span>
    </div>
  );
};

// Función auxiliar para calcular variación porcentual
const getPercentChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

export default LongitudinalMetricsViewer;
