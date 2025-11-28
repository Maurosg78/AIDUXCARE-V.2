/**
 * Discharge Transfer Modal - PHIPA Compliant
 * 
 * Modal for marking patient discharge and initiating virtual transfer
 * Changes access permissions, not data location (PHIPA compliant)
 * 
 * ISO 27001 Compliance:
 * - A.8.2.3: Handling of assets (episode lifecycle)
 * - A.12.4.1: Event logging (all transfers logged)
 */

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, ArrowRight, Shield, Clock } from 'lucide-react';
import VirtualTransferService from '../../services/virtualTransferService';
import EpisodeService from '../../services/episodeService';
import type { Episode } from '../../services/episodeService';

export interface DischargeTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  episodeId: string;
  patientTraceNumber: string;
  physiotherapistId: string;
  patientId?: string;
  onTransferComplete?: (result: { success: boolean; newAccessUrl: string }) => void;
}

export const DischargeTransferModal: React.FC<DischargeTransferModalProps> = ({
  isOpen,
  onClose,
  episodeId,
  patientTraceNumber,
  physiotherapistId,
  patientId,
  onTransferComplete,
}) => {
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferConfirmed, setTransferConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen && episodeId) {
      loadEpisode();
    }
  }, [isOpen, episodeId]);

  const loadEpisode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const episodeData = await EpisodeService.getEpisode(episodeId);
      if (episodeData) {
        setEpisode(episodeData);
      } else {
        setError('Episodio no encontrado');
      }
    } catch (err) {
      console.error('[DischargeTransferModal] Error loading episode:', err);
      setError('Error al cargar información del episodio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferConfirmed) {
      setError('Debe confirmar la transferencia antes de continuar');
      return;
    }

    setIsTransferring(true);
    setError(null);

    try {
      const result = await VirtualTransferService.initiateTransfer(
        episodeId,
        physiotherapistId,
        patientId
      );

      if (result.success) {
        if (onTransferComplete) {
          onTransferComplete({
            success: true,
            newAccessUrl: result.newAccessUrl,
          });
        }
        handleClose();
      } else {
        setError('Error al completar la transferencia');
      }
    } catch (err) {
      console.error('[DischargeTransferModal] Error transferring:', err);
      setError(err instanceof Error ? err.message : 'Error al transferir episodio');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleClose = () => {
    setTransferConfirmed(false);
    setError(null);
    setEpisode(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArrowRight className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Alta y Transferencia</h2>
              <p className="text-blue-100 text-sm">
                Número de trazabilidad: {patientTraceNumber}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-blue-800 rounded-full p-2 transition"
            aria-label="Cerrar"
            disabled={isTransferring}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error && !episode ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Transferencia Virtual (PHIPA Compliant)
                    </h3>
                    <p className="text-blue-800 text-sm">
                      Esta transferencia cambia los permisos de acceso, no mueve datos físicamente.
                      Los datos permanecen en servidores canadienses. El paciente estará disponible
                      en el portal principal con historial completo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Episode Info */}
              {episode && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Episodio:</span>
                    <span className="font-medium">{episode.episodeId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Hospital:</span>
                    <span className="font-medium">{episode.hospitalName || episode.hospitalId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Notas creadas:</span>
                    <span className="font-medium">{episode.notes.count || 0}</span>
                  </div>
                  {episode.metadata.ward && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Sala:</span>
                      <span className="font-medium">{episode.metadata.ward}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Transfer Details */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  ¿Qué sucederá con la transferencia?
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        Acceso al portal inpatient se desactivará
                      </div>
                      <div className="text-sm text-gray-600">
                        El paciente ya no será accesible via portal temporal
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        Acceso al portal principal se activará
                      </div>
                      <div className="text-sm text-gray-600">
                        Todas las notas estarán disponibles en el portal outpatient
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        Historial completo preservado
                      </div>
                      <div className="text-sm text-gray-600">
                        Período hospitalario marcado y accesible permanentemente
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">
                        Datos permanecen en servidores canadienses
                      </div>
                      <div className="text-sm text-gray-600">
                        No hay movimiento físico de datos, solo cambio de permisos
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation */}
              <div className="border-t pt-4">
                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={transferConfirmed}
                    onChange={(e) => setTransferConfirmed(e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600"
                    disabled={isTransferring}
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      Confirmo que deseo transferir este episodio al portal principal
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      El paciente {patientTraceNumber} estará disponible en el portal outpatient
                      con historial completo incluyendo el período hospitalario.
                    </div>
                  </div>
                </label>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  disabled={isTransferring}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={!transferConfirmed || isTransferring}
                  className={`px-6 py-2 rounded-lg transition font-medium flex items-center gap-2 ${
                    transferConfirmed && !isTransferring
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isTransferring ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Transferiendo...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      <span>Transferir al Portal Principal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t p-4 rounded-b-lg">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Shield className="w-4 h-4" />
            <span>
              Transferencia virtual PHIPA-compliant. Los datos permanecen en servidores canadienses.
              Solo cambian los permisos de acceso.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DischargeTransferModal;

