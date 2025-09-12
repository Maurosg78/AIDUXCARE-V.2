import React from 'react';
import { AlertCircle, Activity, Stethoscope, Calendar } from 'lucide-react';

interface AnalysisResultsDisplayProps {
  results: any;
}

export const AnalysisResultsDisplay: React.FC<AnalysisResultsDisplayProps> = ({ results }) => {
  if (!results) return null;

  return (
    <div className="space-y-4">
      {/* Motivo de Consulta */}
      {results.motivo_consulta && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Motivo de Consulta</h3>
          <p className="text-gray-700">{results.motivo_consulta}</p>
        </div>
      )}

      {/* Hallazgos Clínicos */}
      {results.hallazgos_clinicos?.length > 0 && (
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold">Hallazgos Clínicos</h3>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {results.hallazgos_clinicos.map((item: string, idx: number) => (
              <li key={idx} className="text-gray-700">{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Red Flags */}
      {results.red_flags?.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Red Flags</h3>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {results.red_flags.map((item: string, idx: number) => (
              <li key={idx} className="text-red-700">{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tests Sugeridos */}
      {results.evaluaciones_fisicas_sugeridas?.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">Tests Sugeridos</h3>
          </div>
          <div className="space-y-2">
            {results.evaluaciones_fisicas_sugeridas.map((test: any, idx: number) => (
              <div key={idx} className="bg-white p-2 rounded border border-purple-100">
                <div className="font-medium text-purple-900">{test.test}</div>
                {test.sensibilidad && (
                  <div className="text-sm text-gray-600">
                    S: {test.sensibilidad} · E: {test.especificidad || 'N/D'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan de Tratamiento */}
      {results.plan_tratamiento && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Plan de Tratamiento</h3>
          </div>
          
          {results.plan_tratamiento.inmediato?.length > 0 && (
            <div className="mb-3">
              <h4 className="font-medium text-green-800 mb-1">Inmediato:</h4>
              <ul className="list-disc list-inside text-gray-700">
                {results.plan_tratamiento.inmediato.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {results.plan_tratamiento.seguimiento && (
            <div className="mt-3 p-2 bg-green-100 rounded">
              <span className="font-medium">Seguimiento: </span>
              {results.plan_tratamiento.seguimiento}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisResultsDisplay;
