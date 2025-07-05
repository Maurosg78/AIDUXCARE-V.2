import React from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Simula un login exitoso guardando un flag en sessionStorage
    sessionStorage.setItem('isAuthenticated', 'true');
    // Redirige al workspace principal
    navigate('/');
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Página de Login de AiDuxCare</h1>
      <p>Esta es una página de login simulada.</p>
      <button onClick={handleLogin} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
        Simular Login Exitoso
      </button>
    </div>
  );
};

export default LoginPage;
