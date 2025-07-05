import React, { useEffect, useState } from "react";
import { getPatients } from "../../../core/dataSources/patientDataSourceSupabase";

export const VisitNewPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const _data = await getPatients();
      } catch (err) {
        console.error("Error al cargar pacientes:", err);
        setError("Error al cargar la lista de pacientes");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  return (
    <div>
      <h1>Nueva Visita</h1>
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {/* Aquí irá el formulario de nueva visita */}
    </div>
  );
};
