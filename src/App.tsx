import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MVPCorePage } from './pages/MVPCorePage';
import { ProfessionalWorkflowPage } from './pages/ProfessionalWorkflowPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Ruta por defecto redirige al MVP Core */}
          <Route path="/" element={<Navigate to="/mvp-core" replace />} />
          
          {/* Página MVP Core - Flujo principal */}
          <Route path="/mvp-core" element={<MVPCorePage />} />
          
          {/* Página Professional Workflow - Interfaz completa */}
          <Route path="/professional" element={<ProfessionalWorkflowPage />} />
          
          {/* Catch all - redirige a MVP */}
          <Route path="*" element={<Navigate to="/mvp-core" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 