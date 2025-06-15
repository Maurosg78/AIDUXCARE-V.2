import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllTherapists } from '../services/TherapistService';

const AuthenticationPage: React.FC = () => {
  const [mode, setMode] = useState<'select' | 'register'>('select');
  const [availableTherapists, setAvailableTherapists] = useState<any[]>([]);
  const { login, register, error: authError } = useAuth();

  // Cargar perfiles de terapeutas existentes al montar el componente
  useEffect(() => {
    const loadTherapists = async () => {
      try {
        const therapists = await getAllTherapists();
        setAvailableTherapists(therapists);
      } catch (error) {
        console.error('Error al cargar terapeutas:', error);
      }
    };
    
    loadTherapists();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const specialization = formData.get('specialization') as string;
    
    try {
      await register({ name, specialization });
      setMode('select');
    } catch (error) {
      console.error('Error en registro:', error);
    }
  };

  if (mode === 'register') {
    return (
      <div className="auth-container">
        <h1>Crear Nuevo Perfil</h1>
        <form onSubmit={handleRegister}>
          <div data-testid="reg-name-input">
            <label htmlFor="name">Nombre:</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div data-testid="reg-specialization-input">
            <label htmlFor="specialization">Especialización:</label>
            <input type="text" id="specialization" name="specialization" required />
          </div>
          <button type="submit">Registrar</button>
        </form>
        <button onClick={() => setMode('select')}>Seleccionar perfil</button>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h1>Selección de Perfil</h1>
      <div className="therapists-list">
        {availableTherapists.map((therapist) => (
          <div key={therapist.id} className="therapist-card">
            <h2>{therapist.name}</h2>
            <p>Especialización: {therapist.specialization}</p>
            <button onClick={() => login(therapist)}>Seleccionar</button>
          </div>
        ))}
      </div>
      <button onClick={() => setMode('register')}>Crear un perfil nuevo</button>
    </div>
  );
};

export default AuthenticationPage; 