import React from 'react';
import { AlertTriangle, Activity, Pill, User, Target, BookOpen } from 'lucide-react';

interface ClinicalResultsViewProps {
  results: any;
}

export const ClinicalResultsView: React.FC<ClinicalResultsViewProps> = ({ results }) => {
  if (!results) return null;

  return (
    <div className="space-y-4 p-4">
      {/* Header con info básica */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
        <h2 className="text-xl font-bold text-blue-900 mb-2">Resumen Clínico</h2>
        <p className="text-gray-700">{results.motivo_consulta}</p>
        {results.edad && (
          <div className="mt-2 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Edad: {results.edad}</span>
          </div>
        )}
      </div>

      {/* Síntomas Principales - Sección destacada */}
      {results.sintomas_principales && (
        <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
          <h3 className="font-semibold text-purple-900 mb-3">Síntomas Principales</h3>
          
          {results.sintomas_principales.dolor && (
            <div className="mb-3 p-3 bg-purple-50 rounded">
              <div className="font-medium text-purple-800 mb-2">Dolor:</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">Ubicación:</span> {results.sintomas_principales.dolor.ubicacion || 'No especificado'}</div>
                <div><span className="font-medium">Intensidad:</span> {results.sintomas_principales.dolor.intensidad || 'No especificado'}</div>
                <div><span className="font-medium">Patrón:</span> {results.sintomas_principales.dolor.patron || 'No especificado'}</div>
              </div>
            </div>
          )}
          
          {results.sintomas_principales.funcionalidad && (
            <div className="p-3 bg-purple-50 rounded">
              <span className="font-medium text-purple-800">Limitación funcional:</span>
              <p className="text-sm mt-1">{results.sintomas_principales.funcionalidad}</p>
            </div>
          )}
        </div>
      )}

      {/* Red Flags - Solo si existen */}
      {results.red_flags && results.red_flags.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Banderas Rojas</h3>
          </div>
          <ul className="space-y-1">
            {results.red_flags.map((flag: string, i: number) => (
              <li key={i} className="text-red-700 flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Medicación Actual */}
      {results.medicacion_actual && results.medicacion_actual.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Medicación Actual</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {results.medicacion_actual.map((med: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {med}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Evaluaciones Sugeridas */}
      {results.evaluaciones_sugeridas && results.evaluaciones_sugeridas.length > 0 && (
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Evaluaciones Recomendadas</h3>
          </div>
          <div className="space-y-2">
            {results.evaluaciones_sugeridas.map((test: any, i: number) => (
              <div key={i} className="bg-white p-3 rounded border border-green-200">
                <div className="font-medium text-green-800">{test.test}</div>
                <div className="text-sm text-gray-600 mt-1">{test.justificacion}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagnósticos Probables */}
      {results.diagnosticos_probables && results.diagnosticos_probables.length > 0 && (
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-900">Diagnósticos Probables</h3>
          </div>
          <ol className="space-y-1">
            {results.diagnosticos_probables.map((dx: string, i: number) => (
              <li key={i} className="text-gray-700">
                {i + 1}. {dx}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Plan de Tratamiento */}
      {results.plan_tratamiento && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Plan de Tratamiento</h3>
          </div>
          
          <div className="space-y-3">
            {results.plan_tratamiento.inmediato?.length > 0 && (
              <div>
                <h4 className="font-medium text-green-800 mb-1">Acciones Inmediatas:</h4>
                <ul className="list-disc list-inside text-gray-700 text-sm">
                  {results.plan_tratamiento.inmediato.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {results.plan_tratamiento.corto_plazo?.length > 0 && (
              <div>
                <h4 className="font-medium text-green-800 mb-1">Objetivos a Corto Plazo (2-4 semanas):</h4>
                <ul className="list-disc list-inside text-gray-700 text-sm">
                  {results.plan_tratamiento.corto_plazo.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {results.plan_tratamiento.educacion?.length > 0 && (
              <div>
                <h4 className="font-medium text-green-800 mb-1">Educación al Paciente:</h4>
                <ul className="list-disc list-inside text-gray-700 text-sm">
                  {results.plan_tratamiento.educacion.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalResultsView;
