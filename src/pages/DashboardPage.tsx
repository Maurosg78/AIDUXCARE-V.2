import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { AssistantProfileCard } from '../components/assistant-profile/AssistantProfileCard';
import { 
  FileText, 
  ChevronRight,
  Stethoscope,
  TestTube,
  Settings
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AiDuxCare Professional</h1>
              <p className="text-sm text-gray-500">Sistema de Documentación Clínica</p>
            </div>
            <div className="text-sm text-gray-600">
              mauricio@aiduxcare.com
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Assistant Profile Card - arriba del grid */}
        <AssistantProfileCard />

        <h2 className="text-lg font-semibold text-gray-900 mb-6">Flujos de Trabajo</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Flujo Principal */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200" 
                onClick={() => navigate('/professional-workflow')}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-blue-600" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Flujo Profesional
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Workflow completo: anamnesis, evaluación física y generación SOAP
            </p>
            <Button variant="primary" size="sm" className="w-full">
              Iniciar
            </Button>
          </Card>

          {/* Debug */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-50">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Debug Audio
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Herramientas de desarrollo
            </p>
            <Button variant="outline" size="sm" className="w-full" disabled>
              Solo desarrollo
            </Button>
          </Card>

          {/* Test */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer opacity-50">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <TestTube className="w-6 h-6 text-gray-600" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Test Workflow
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Pruebas del sistema
            </p>
            <Button variant="outline" size="sm" className="w-full" disabled>
              Solo desarrollo
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
