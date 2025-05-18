import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import PatientListPage from '../PatientListPage';
import { patientDataSourceSupabase } from '../../../core/dataSources/patientDataSourceSupabase';

// Mock de useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn()
  };
});

// Mock del data source
vi.mock('../../../core/dataSources/patientDataSourceSupabase', () => ({
  patientDataSourceSupabase: {
    getAllPatients: vi.fn()
  }
}));

describe('PatientListPage', () => {
  const mockNavigate = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as Mock).mockReturnValue(mockNavigate);
  });

  it('muestra el loader mientras carga los datos', async () => {
    // Simular carga en progreso
    (patientDataSourceSupabase.getAllPatients as Mock).mockReturnValue(
      new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    render(
      <MemoryRouter>
        <PatientListPage />
      </MemoryRouter>
    );

    // Verificar que el loader esté visible
    expect(screen.getByTestId('patients-loading')).toBeInTheDocument();
  });

  it('muestra un mensaje cuando no hay pacientes', async () => {
    // Configurar mock para devolver un array vacío de pacientes
    (patientDataSourceSupabase.getAllPatients as Mock).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <PatientListPage />
      </MemoryRouter>
    );

    // Esperar a que desaparezca el loader y aparezca el estado vacío
    await waitFor(() => {
      expect(screen.queryByTestId('patients-loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('patients-empty')).toBeInTheDocument();
    });

    // Verificar el mensaje de estado vacío
    expect(screen.getByText('Aún no hay pacientes registrados')).toBeInTheDocument();
  });

  it('muestra la lista de pacientes cuando hay datos', async () => {
    // Mock de pacientes
    const mockPatients = [
      { 
        id: 'patient-1', 
        name: 'Juan Pérez', 
        full_name: 'Juan Manuel Pérez López',
        date_of_birth: '1980-05-15'
      },
      { 
        id: 'patient-2', 
        name: 'María García', 
        full_name: 'María García Sánchez',
        date_of_birth: '1992-10-23'
      }
    ];

    // Configurar mock para devolver pacientes
    (patientDataSourceSupabase.getAllPatients as Mock).mockResolvedValue(mockPatients);

    render(
      <MemoryRouter>
        <PatientListPage />
      </MemoryRouter>
    );

    // Esperar a que desaparezca el loader y aparezca la lista
    await waitFor(() => {
      expect(screen.queryByTestId('patients-loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('patients-list')).toBeInTheDocument();
    });

    // Verificar que se muestran los pacientes
    expect(screen.getByText('Juan Manuel Pérez López')).toBeInTheDocument();
    expect(screen.getByText('María García Sánchez')).toBeInTheDocument();
  });

  it('navega a la página de crear visita al hacer clic en el botón', async () => {
    // Mock de pacientes
    const mockPatients = [
      { 
        id: 'patient-1', 
        name: 'Juan Pérez', 
        full_name: 'Juan Manuel Pérez López',
        date_of_birth: '1980-05-15'
      }
    ];

    // Configurar mock para devolver pacientes
    (patientDataSourceSupabase.getAllPatients as Mock).mockResolvedValue(mockPatients);

    render(
      <MemoryRouter>
        <PatientListPage />
      </MemoryRouter>
    );

    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByTestId('patients-list')).toBeInTheDocument();
    });

    // Hacer clic en el botón "Crear visita"
    const createVisitButton = screen.getByTestId('create-visit-patient-1');
    fireEvent.click(createVisitButton);

    // Verificar que se navegó a la ruta correcta
    expect(mockNavigate).toHaveBeenCalledWith('/visits/new?patientId=patient-1');
  });
}); 