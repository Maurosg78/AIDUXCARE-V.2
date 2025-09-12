import React, { useState } from 'react';
import { PromptTracker } from '../core/prompts/PromptTracker';

export const SecretMetrics: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // Por ahora, password hardcoded (cambiar en producción)
  const SECRET_PASSWORD = 'aidux2024';
  
  const handleUnlock = () => {
    if (password === SECRET_PASSWORD) {
      setIsUnlocked(true);
      console.log('🔓 Acceso a métricas desbloqueado');
    } else {
      console.log('❌ Password incorrecto');
    }
  };
  
  if (!isUnlocked) {
    return (
      <div className="fixed bottom-4 left-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
          placeholder="🔒"
          className="w-12 h-8 text-xs border rounded opacity-30 hover:opacity-100 transition-opacity"
        />
      </div>
    );
  }
  
  const analyses = PromptTracker.getAllAnalyses();
  const avgScore = analyses.reduce((acc, a) => acc + a.score, 0) / analyses.length || 0;
  
  return (
    <div className="fixed bottom-4 left-4 bg-black text-green-400 p-4 rounded font-mono text-xs max-w-md">
      <div className="mb-2">🔓 MÉTRICAS SECRETAS</div>
      <div>Análisis totales: {analyses.length}</div>
      <div>Score promedio: {Math.round(avgScore)}/100</div>
      <div>Último score: {analyses[analyses.length - 1]?.score || 'N/A'}/100</div>
      <button 
        onClick={() => console.table(analyses)}
        className="mt-2 text-yellow-400 hover:text-yellow-300"
      >
        Ver detalle en consola
      </button>
    </div>
  );
};
