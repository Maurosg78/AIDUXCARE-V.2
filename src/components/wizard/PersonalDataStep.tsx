import React, { useCallback } from 'react';

import LocationAwarenessModal from './LocationAwarenessModal';

export type PersonalFormData = {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  gender?: string;
  country?: string;
  province?: string;
  city?: string;
  password?: string;
  confirmPassword?: string;
};

type Props = {
  data: PersonalFormData;
  errors?: Record<string, string>;
  onFieldChange: (field: keyof PersonalFormData, value: string) => void;
  onLocationDetected?: (loc: { country?: string; province?: string; city?: string }) => void;
};

export const PersonalDataStep: React.FC<Props> = ({
  data,
  errors,
  onFieldChange,
  onLocationDetected,
}) => {
  const handleField = useCallback(
    (field: keyof PersonalFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onFieldChange(field, e.target.value),
    [onFieldChange]
  );

  const handleManualCountrySelection = (code: string) => {
    onFieldChange('country', code);
    if (onLocationDetected) onLocationDetected({ country: code });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Nombre</label>
          <input
            value={data.firstName ?? ''}
            onChange={handleField('firstName')}
            className="w-full border rounded px-2 py-1"
          />
          {errors?.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Apellidos</label>
          <input
            value={data.lastName ?? ''}
            onChange={handleField('lastName')}
            className="w-full border rounded px-2 py-1"
          />
          {errors?.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Email</label>
          <input
            type="email"
            value={data.email ?? ''}
            onChange={handleField('email')}
            className="w-full border rounded px-2 py-1"
          />
          {errors?.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Teléfono</label>
          <div className="flex gap-2">
            <input
              value={data.phoneCountryCode ?? '+34'}
              onChange={handleField('phoneCountryCode')}
              className="w-24 border rounded px-2 py-1"
              placeholder="+34"
            />
            <input
              value={data.phone ?? ''}
              onChange={handleField('phone')}
              className="flex-1 border rounded px-2 py-1"
            />
          </div>
          {(errors?.phoneCountryCode || errors?.phone) && (
            <p className="text-xs text-red-600 mt-1">
              {errors?.phoneCountryCode ?? errors?.phone}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">País (ISO-2)</label>
          <input
            value={data.country ?? ''}
            onChange={handleField('country')}
            className="w-full border rounded px-2 py-1"
            placeholder="es"
          />
          {errors?.country && <p className="text-xs text-red-600 mt-1">{errors.country}</p>}
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Provincia</label>
          <input
            value={data.province ?? ''}
            onChange={handleField('province')}
            className="w-full border rounded px-2 py-1"
          />
          {errors?.province && <p className="text-xs text-red-600 mt-1">{errors.province}</p>}
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Ciudad</label>
          <input
            value={data.city ?? ''}
            onChange={handleField('city')}
            className="w-full border rounded px-2 py-1"
          />
          {errors?.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
        </div>
      </div>

      {/* Modal (placeholder) - se renderiza cerrado por defecto */}
      <LocationAwarenessModal
        isOpen={false}
        onClose={() => {}}
        onLocationSelected={handleManualCountrySelection}
        onUseCurrentLocation={() => {}}
      />
    </div>
  );
};

export default PersonalDataStep;
