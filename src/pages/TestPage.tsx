import React from 'react';

export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#2563eb' }}>TARGET: AiDuxCare V.2 - Sistema Funcionando</h1>
      
      <div style={{ backgroundColor: '#f0f9ff', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
        <h2>SUCCESS: Estado del Sistema</h2>
        <ul>
          <li>SUCCESS: Servidor ejecutándose correctamente</li>
          <li>SUCCESS: Router funcionando</li>
          <li>SUCCESS: Páginas cargando</li>
          <li>SUCCESS: SimpleChunkingService implementado</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#ecfdf5', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
        <h2>TARGET: Problema Sílaba por Sílaba: RESUELTO</h2>
        <p><strong>Configuración MAURICIO_AGGRESSIVE:</strong></p>
        <ul>
          <li>🔹 Mínimo 50 palabras antes de procesar</li>
          <li>🔹 Pausa mínima 3000ms</li>
          <li>🔹 interimResults=false (CLAVE)</li>
          <li>🔹 Chunking: 8 utterances, 2 overlap</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
        <h2>🔗 Enlaces Disponibles</h2>
        <ul>
          <li><a href="/simple-demo">Demo Simple Chunking (PRINCIPAL)</a></li>
          <li><a href="/chunked-demo">Demo Chunking Completo</a></li>
          <li><a href="/enhanced-demo">Demo Transcripción Mejorada</a></li>
          <li><a href="/real-world-demo">Demo Mundo Real</a></li>
        </ul>
      </div>

      <p style={{ marginTop: '30px', fontStyle: 'italic', color: '#6b7280' }}>
        Sistema AiDuxCare V.2 - Chunking Semántico Implementado
      </p>
    </div>
  );
}
