import React, { useState, useEffect } from "react";
import { useUser } from "../../core/auth/UserContext";

// Interfaces para los tipos de datos
interface PatientVisit {
  id: string;
  date: string;
  professional_name: string;
  status: "scheduled" | "completed" | "cancelled";
  speciality: string;
}

interface PatientForm {
  id: string;
  visit_id: string;
  title: string;
  date: string;
  status: "draft" | "completed";
}

/**
 * Portal para pacientes donde pueden ver sus visitas y datos de salud
 */
const PatientPortalPage: React.FC = () => {
  const { profile, user } = useUser();
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<PatientVisit[]>([]);
  const [forms, setForms] = useState<PatientForm[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);

  useEffect(() => {
    const loadPatientData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        // En un escenario real, cargaríamos las visitas específicas del paciente
        // Por ahora, mostramos datos de demostración
        setVisits([
          {
            id: "visit-1",
            date: new Date(2023, 10, 15).toISOString(),
            professional_name: "Dr. García Fernández",
            status: "completed",
            speciality: "Medicina Familiar",
          },
          {
            id: "visit-2",
            date: new Date(2023, 11, 3).toISOString(),
            professional_name: "Dra. Rodríguez Pérez",
            status: "completed",
            speciality: "Cardiología",
          },
          {
            id: "visit-3",
            date: new Date().toISOString(),
            professional_name: "Dr. Martínez López",
            status: "scheduled",
            speciality: "Medicina Interna",
          },
        ]);

        // Formularios/documentos clínicos asociados (demo)
        setForms([
          {
            id: "form-1",
            visit_id: "visit-1",
            title: "Analítica general",
            date: new Date(2023, 10, 17).toISOString(),
            status: "completed",
          },
          {
            id: "form-2",
            visit_id: "visit-1",
            title: "Informe de consulta",
            date: new Date(2023, 10, 15).toISOString(),
            status: "completed",
          },
          {
            id: "form-3",
            visit_id: "visit-2",
            title: "Electrocardiograma",
            date: new Date(2023, 11, 3).toISOString(),
            status: "completed",
          },
        ]);
      } catch (error) {
        console.error("Error cargando datos del paciente:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [user?.id]);

  // Filtrar formularios según la visita seleccionada
  const filteredForms = selectedVisitId
    ? forms.filter((form) => form.visit_id === selectedVisitId)
    : forms;

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-6">
        <div className="bg-white shadow-sm rounded-md p-6">
          <h1 className="text-2xl font-bold text-slateBlue mb-4">
            Portal del Paciente
          </h1>
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xl">
              {profile?.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-slateBlue font-medium">{profile?.full_name}</p>
              <p className="text-slateBlue/60 text-sm">Paciente</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-softCoral"></div>
          </div>
        ) : (
          <>
            <div className="bg-white shadow-sm rounded-md p-6">
              <h2 className="text-lg font-semibold text-slateBlue mb-4">
                Mis Consultas Médicas
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {visits.map((visit) => (
                  <div
                    key={visit.id}
                    onClick={() =>
                      setSelectedVisitId(
                        selectedVisitId === visit.id ? null : visit.id,
                      )
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedVisitId(
                          selectedVisitId === visit.id ? null : visit.id,
                        );
                      }
                    }}
                    className={`border rounded-md p-4 cursor-pointer transition ${
                      selectedVisitId === visit.id
                        ? "border-softCoral bg-softCoral/5"
                        : "border-gray-200 hover:border-softCoral"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-slateBlue">
                          {visit.professional_name}
                        </h3>
                        <p className="text-sm text-slateBlue/70">
                          {visit.speciality}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slateBlue">
                          {formatDate(visit.date)}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            visit.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {visit.status === "completed"
                            ? "Completada"
                            : "Programada"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-md p-6">
              <h2 className="text-lg font-semibold text-slateBlue mb-4">
                {selectedVisitId
                  ? `Documentos de la consulta seleccionada (${
                      visits.find((v) => v.id === selectedVisitId)
                        ?.professional_name
                    })`
                  : "Todos mis documentos clínicos"}
              </h2>

              {filteredForms.length === 0 ? (
                <p className="text-slateBlue/70 text-center py-4">
                  {selectedVisitId
                    ? "No hay documentos disponibles para esta consulta"
                    : "No hay documentos clínicos disponibles"}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Documento
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Fecha
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Estado
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredForms.map((form) => (
                        <tr key={form.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slateBlue">
                              {form.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slateBlue/70">
                              {formatDate(form.date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Completado
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-softCoral hover:text-softCoral/80">
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientPortalPage;
