/**
 * MIC: SESSION PAGE - AIDUXCARE V.2
 * Página de sesión activa para el workflow principal
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalNavigation from '@/components/GlobalNavigation';

const SessionPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="apple-emr page-with-nav">
      <GlobalNavigation />
      
      <div className="session-container">
        {/* Header */}
        <div className="session-header">
          <div className="header-content">
            <h1 className="form-title">Sesión Activa</h1>
            <p className="form-subtitle">Workflow principal de AiDuxCare</p>
          </div>
          <button
            onClick={() => navigate("/patients")}
            className="header-action"
          >
            <span className="action-icon">NOTES:</span>
            <span>Lista de Pacientes</span>
          </button>
        </div>

        {/* Content */}
        <div className="session-content">
          <div className="empty-state">
            <div className="empty-icon">MIC:</div>
            <h3 className="empty-title">Sesión de Grabación</h3>
            <p className="empty-description">
              Esta funcionalidad estará disponible próximamente.<br/>
              Aquí podrás grabar y analizar sesiones de fisioterapia.
            </p>
            <div className="empty-actions">
              <button 
                onClick={() => navigate("/patient/new")}
                className="action-primary"
              >
                <span className="action-icon">USER:</span>
                <span>Crear Paciente</span>
              </button>
              <button 
                onClick={() => navigate("/")}
                className="action-secondary"
              >
                <span className="action-icon">HOME:</span>
                <span>Volver al Inicio</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionPage; 