// @ts-nocheck
import React from "react";
/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';

import { GeolocationData } from '../../services/geolocationService';

import logger from '@/shared/utils/logger';

interface GeolocationPermissionProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationDetected: (location: GeolocationData) => void;
  onManualSelection: () => void;
}

export const GeolocationPermission: React.FC<GeolocationPermissionProps> = ({
  isOpen,
  onClose,
  onLocationDetected,
  onManualSelection
}) => {
  const [permissionStatus, setPermissionStatus] = useState<'requesting' | 'granted' | 'denied' | 'error'>('requesting');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Debug: Log cuando cambie isOpen
  useEffect(() => {
    logger.info('GeolocationPermission - isOpen cambió a:', isOpen);
    if (isOpen) {
      logger.info('GeolocationPermission - Activando geolocalización automáticamente');
      requestGeolocationPermission();
    }
  }, [isOpen]);

  const requestGeolocationPermission = async () => {
    try {
      setPermissionStatus('requesting');
      setErrorMessage('');

      // Check if browser supports geolocation
      if (!navigator.geolocation) {
        setPermissionStatus('error');
        setErrorMessage('Your browser does not support geolocation');
        return;
      }

      // Check permissions using Permissions API if available
      if ('permissions' in navigator) {
        try {
          const permission = await (navigator as Navigator & { permissions?: Permissions }).permissions?.query({ 
            name: 'geolocation' as PermissionName 
          });
          
          if (permission?.state === 'denied') {
            setPermissionStatus('denied');
            setErrorMessage('Geolocation permission denied. Please enable it in your browser settings.');
            return;
          }
        } catch (error) {
          logger.info('Could not verify permission status:', error);
        }
      }

      // Request location
      navigator.geolocation.getCurrentPosition(
        async () => {
          try {
            // Usar el servicio de geolocalización para obtener datos completos
            const geolocationService = (await import('../../services/geolocationService')).geolocationService;
            const locationData = await geolocationService.detectLocation();
            
            if (locationData) {
              setPermissionStatus('granted');
              onLocationDetected(locationData);
              onClose();
            } else {
              setPermissionStatus('error');
              setErrorMessage('Could not obtain complete location information');
            }
          } catch (error) {
            logger.error('Error obtaining location data:', error);
            setPermissionStatus('error');
            setErrorMessage('Error processing location information');
          }
        },
        (error) => {
          logger.error('Error de geolocalización:', error);
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setPermissionStatus('denied');
              setErrorMessage('Geolocation permission denied. Please enable it in your browser settings.');
              break;
            case error.POSITION_UNAVAILABLE:
              setPermissionStatus('error');
              setErrorMessage('Location information is not available at this time.');
              break;
            case error.TIMEOUT:
              setPermissionStatus('error');
              setErrorMessage('Timeout waiting for location.');
              break;
            default:
              setPermissionStatus('error');
              setErrorMessage('Unknown error obtaining location.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } catch (error) {
      logger.error('Error requesting permissions:', error);
      setPermissionStatus('error');
      setErrorMessage('Error requesting geolocation permissions');
    }
  };

  const handleManualSelection = () => {
    onManualSelection();
    onClose();
  };

  const handleRetry = () => {
    requestGeolocationPermission();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Location Permission</h2>
        
        {permissionStatus === 'requesting' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Requesting location permission...</p>
          </div>
        )}

        {permissionStatus === 'granted' && (
          <div className="text-center py-8">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <p className="text-gray-600">Location detected successfully!</p>
          </div>
        )}

        {permissionStatus === 'denied' && (
          <div className="py-4">
            <div className="text-red-600 text-6xl mb-4 text-center">⚠</div>
            <p className="text-gray-700 mb-4">{errorMessage}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>To enable geolocation:</strong>
                <br />1. Click the lock icon in the address bar
                <br />2. Change &quot;Location&quot; to &quot;Allow&quot;
                <br />3. Reload the page
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRetry}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
              <button
                onClick={handleManualSelection}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Manual Selection
              </button>
            </div>
          </div>
        )}

        {permissionStatus === 'error' && (
          <div className="py-4">
            <div className="text-red-600 text-6xl mb-4 text-center">❌</div>
            <p className="text-gray-700 mb-4">{errorMessage}</p>
            <div className="flex space-x-3">
              <button
                onClick={handleRetry}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
              <button
                onClick={handleManualSelection}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Manual Selection
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
