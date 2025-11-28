/**
 * Inpatient Portal Page
 * 
 * Portal for accessing notes during hospital admission
 * Uses trace number for access
 * 
 * Features:
 * - Trace number authentication
 * - Episode management
 * - Discharge and transfer functionality
 * - Notes access during admission
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Building2, LogOut, ArrowRight, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import EpisodeService from '../services/episodeService';
import VirtualTransferService from '../services/virtualTransferService';
import DischargeTransferModal from '../components/episode/DischargeTransferModal';
import type { Episode } from '../services/episodeService';

const InpatientPortalPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Accept both 'code' and 'trace' parameters for flexibility
  const codeFromUrl = searchParams.get('code') || searchParams.get('trace') || '';
  const [traceNumber, setTraceNumber] = useState(codeFromUrl);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDischargeModal, setShowDischargeModal] = useState(false);

  useEffect(() => {
    if (codeFromUrl) {
      loadEpisode(codeFromUrl);
    }
  }, [codeFromUrl]);

  const loadEpisode = async (trace: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const episodeData = await EpisodeService.getEpisodeByTraceNumber(trace.toUpperCase());
      
      if (!episodeData) {
        setError('Episode not found for this visit code');
        return;
      }

      // Check if episode is still active
      if (episodeData.status !== 'admitted') {
        if (episodeData.status === 'transferred') {
          setError('This patient has been discharged and transferred to the main portal.');
          // Redirect to outpatient portal
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setError('This episode has already been discharged.');
        }
        return;
      }

      // Check access permissions
      if (!episodeData.access.canAccessInpatient) {
        setError('Inpatient portal access not available for this episode.');
        return;
      }

      setEpisode(episodeData);
    } catch (err) {
      console.error('[InpatientPortal] Error loading episode:', err);
      setError('Error loading episode information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccess = async () => {
    if (!traceNumber.trim()) {
      setError('Please enter a visit code');
      return;
    }

    await loadEpisode(traceNumber.trim());
  };

  const handleDischarge = () => {
    if (episode) {
      setShowDischargeModal(true);
    }
  };

  const handleTransferComplete = (result: { success: boolean; newAccessUrl: string }) => {
    if (result.success) {
      setError(null);
      // Show success message
      alert(`Transferencia completada. El paciente estará disponible en el portal principal.`);
      // Redirect to landing page
      navigate('/hospital');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading episode information...</p>
        </div>
      </div>
    );
  }

  if (!episode && !error) {
    // Initial access form
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Hospital Patient Portal
            </h1>
            <p className="text-gray-600">
              Enter visit code to access patient notes
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visit Code
              </label>
              <input
                type="text"
                value={traceNumber}
                onChange={(e) => {
                  setTraceNumber(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="AUX-HSC-001234"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAccess();
                  }
                }}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleAccess}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
            >
              Access Patient Note
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-2 text-gray-600 hover:text-gray-800 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error && !episode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Error
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setEpisode(null);
                setTraceNumber('');
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Episode view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Hospital Patient Portal</h1>
                <p className="text-sm text-gray-600">{episode?.patientTraceNumber}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/hospital')}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Episode Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Episode Information</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Episode:</span>
                  <span className="font-medium">{episode?.episodeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hospital:</span>
                  <span className="font-medium">{episode?.hospitalName || episode?.hospitalId}</span>
                </div>
                {episode?.metadata.ward && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ward:</span>
                    <span className="font-medium">{episode.metadata.ward}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Notes created:</span>
                  <span className="font-medium">{episode?.notes.count || 0}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">Patient in active admission</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-700">
                    {episode?.notes.count || 0} notes available
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/hospital/note?code=${episode?.patientTraceNumber}`)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              <span>View Patient Notes</span>
            </button>

            <button
              onClick={handleDischarge}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              <span>Discharge and Transfer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Discharge Transfer Modal */}
      {episode && (
        <DischargeTransferModal
          isOpen={showDischargeModal}
          onClose={() => setShowDischargeModal(false)}
          episodeId={episode.episodeId}
          patientTraceNumber={episode.patientTraceNumber}
          physiotherapistId={episode.physiotherapistId}
          patientId={episode.patientId}
          onTransferComplete={handleTransferComplete}
        />
      )}
    </div>
  );
};

export default InpatientPortalPage;

