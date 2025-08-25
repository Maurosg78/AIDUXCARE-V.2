import React from 'react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>🎉 ¡Bienvenido al Dashboard de AiDuxCare!</h1>
      <p>Login exitoso para: mauricio@aiduxcare.com</p>
      
      <div style={{ marginTop: '2rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div style={{ padding: '1.5rem', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '2px solid #E2E8F0' }}>
          <h2>🎤 Pipeline Audio → SOAP</h2>
          <p>Workflow completo de grabación, transcripción y generación SOAP</p>
          <Link to="/professional-workflow">
            <button style={{ padding: '1rem 2rem', fontSize: '1.1rem', backgroundColor: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', marginTop: '1rem' }}>
              ▶️ Professional Workflow
            </button>
          </Link>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: '#FEF2F2', borderRadius: '12px', border: '2px solid #FCA5A5' }}>
          <h2>🔧 Debug Audio</h2>
          <p>Página de debugging para el pipeline de audio</p>
          <Link to="/debug-audio">
            <button style={{ padding: '1rem 2rem', fontSize: '1.1rem', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', marginTop: '1rem' }}>
              🔍 Debug Audio
            </button>
          </Link>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: '#F0FDF4', borderRadius: '12px', border: '2px solid #BBF7D0' }}>
          <h2>🧪 Test Workflow</h2>
          <p>Testing completo del workflow</p>
          <Link to="/test-workflow">
            <button style={{ padding: '1rem 2rem', fontSize: '1.1rem', backgroundColor: '#16A34A', color: 'white', border: 'none', borderRadius: '8px', marginTop: '1rem' }}>
              🧪 Test Full Workflow
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
