import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import SemanticMemoryViewer from '../../shared/components/MCP/SemanticMemoryViewer';
import { track } from '../../services/UsageAnalyticsService';

interface DashboardSemanticMemoryPanelProps {
  userId: string;
  lastVisitedPatientId?: string;
}

/**
 * Panel lateral para visualizar la memoria semántica en el Dashboard
 */
const DashboardSemanticMemoryPanel: React.FC<DashboardSemanticMemoryPanelProps> = ({
  userId,
  lastVisitedPatientId
}) => {
  // Estado para controlar la apertura/cierre del panel
  const [isOpen, setIsOpen] = useState<boolean>(false);
  // Estado para el umbral de relevancia
  const [relevanceThreshold, setRelevanceThreshold] = useState<number>(0.3);
  // Estado para el contador de bloques cargados
  const [blocksCount, setBlocksCount] = useState<number>(0);

  // Función para abrir el panel
  const openPanel = () => {
    setIsOpen(true);
    // Registrar evento de apertura del panel
    track(
      'suggestion_explanation_viewed', // Usamos este tipo para rastrear las vistas del panel
      userId,
      'dashboard',
      1,
      {
        event_name: 'semantic_memory_panel_opened',
        timestamp: new Date().toISOString(),
        patient_id: lastVisitedPatientId || 'none'
      }
    );
  };

  // Función para cerrar el panel
  const closePanel = () => {
    setIsOpen(false);
  };

  // Actualizar contador de bloques desde el panel
  const handleBlocksLoaded = (count: number) => {
    setBlocksCount(count);
    // Registrar evento de bloques visualizados
    track(
      'suggestion_feedback_viewed', // Usamos este tipo para rastrear las visualizaciones
      userId,
      'dashboard',
      count,
      {
        event_name: 'semantic_memory_viewed',
        blocks_count: count,
        relevance_threshold: relevanceThreshold,
        timestamp: new Date().toISOString()
      }
    );
  };

  return (
    <>
      {/* Botón para abrir el panel */}
      <button
        className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 mb-4"
        onClick={openPanel}
        data-testid="open-semantic-memory-button"
        aria-label="Abrir panel de memoria semántica"
        aria-haspopup="dialog"
      >
        <span className="mr-2" aria-hidden="true">🧠</span>
        Ver Memoria Semántica
      </button>

      {/* Panel lateral (drawer) */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog 
          as="div" 
          className="relative z-10" 
          onClose={closePanel}
          aria-labelledby="semantic-memory-panel-title"
        >
          {/* Overlay */}
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          {/* Panel lateral */}
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                      {/* Encabezado */}
                      <div className="px-4 py-6 sm:px-6 bg-gray-50 border-b">
                        <div className="flex items-start justify-between">
                          <Dialog.Title 
                            id="semantic-memory-panel-title"
                            className="text-xl font-semibold text-gray-900"
                          >
                            Memoria Semántica
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              onClick={closePanel}
                              aria-label="Cerrar panel"
                            >
                              <span className="sr-only">Cerrar panel</span>
                              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Contador de bloques y controles */}
                        <div className="mt-4">
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                              <span data-testid="blocks-counter" aria-live="polite">
                                {blocksCount} bloques cargados
                              </span>
                            </div>
                            <div className="text-sm">
                              <label htmlFor="relevance-threshold" className="text-gray-500 mr-2">
                                Relevancia mínima:
                              </label>
                              <select
                                id="relevance-threshold"
                                value={relevanceThreshold}
                                onChange={(e) => setRelevanceThreshold(parseFloat(e.target.value))}
                                className="border-gray-300 rounded-md text-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                data-testid="relevance-selector"
                                aria-label="Seleccionar umbral de relevancia mínima"
                              >
                                <option value="0.1">10%</option>
                                <option value="0.3">30%</option>
                                <option value="0.5">50%</option>
                                <option value="0.7">70%</option>
                                <option value="0.9">90%</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Leyenda de colores */}
                      <div className="px-4 py-2 border-b">
                        <h4 className="text-sm font-medium text-gray-500 mb-2" id="color-legend">Importancia:</h4>
                        <div className="flex space-x-4" role="list" aria-labelledby="color-legend">
                          <span className="flex items-center" role="listitem">
                            <span className="h-3 w-3 rounded-full bg-red-500 mr-1" aria-hidden="true"></span>
                            <span className="text-xs text-red-600">Alta</span>
                          </span>
                          <span className="flex items-center" role="listitem">
                            <span className="h-3 w-3 rounded-full bg-amber-500 mr-1" aria-hidden="true"></span>
                            <span className="text-xs text-amber-600">Media</span>
                          </span>
                          <span className="flex items-center" role="listitem">
                            <span className="h-3 w-3 rounded-full bg-blue-500 mr-1" aria-hidden="true"></span>
                            <span className="text-xs text-blue-600">Baja</span>
                          </span>
                        </div>
                      </div>
                      
                      {/* Contenido - SemanticMemoryViewer */}
                      <div className="flex-1 overflow-y-auto">
                        {isOpen && (
                          <div className="p-4" data-testid="semantic-memory-content">
                            <SemanticMemoryViewer
                              patientId={lastVisitedPatientId}
                              minRelevance={relevanceThreshold}
                              onBlocksLoaded={handleBlocksLoaded}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};

export default DashboardSemanticMemoryPanel; 