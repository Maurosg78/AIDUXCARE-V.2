import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getPatients } from '../../../core/dataSources/patientDataSourceSupabase';
import { visitDataSourceSupabase } from '../../../core/dataSources/visitDataSourceSupabase';
import type { Patient } from '../../../core/domain/patientType';

export const VisitNewPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const data = await getPatients();
        setPatients(data);
      } catch (err) {
        console.error('Error al cargar pacientes:', err);
        setError('Error al cargar la lista de pacientes');
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