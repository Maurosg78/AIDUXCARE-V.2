import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useProfessionalProfile } from '../../../context/ProfessionalProfileContext';
import type { ProfessionalProfile } from '../../../context/ProfessionalProfileContext';

interface EditProfileModalProps {
  profile: ProfessionalProfile | undefined;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ profile, onClose }) => {
  const { updateProfile } = useProfessionalProfile();

  const initialCountry = profile?.practiceCountry ?? profile?.country ?? '';
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [licenseNumber, setLicenseNumber] = useState(profile?.licenseNumber ?? '');
  const [specialty, setSpecialty] = useState(profile?.specialty ?? '');
  const [practiceCountry, setPracticeCountry] = useState(initialCountry);
  const [workplace, setWorkplace] = useState(profile?.workplace ?? '');
  const [experienceYears, setExperienceYears] = useState(profile?.experienceYears ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [licenseCleared, setLicenseCleared] = useState(false);

  const handleCountryChange = (newCountry: string) => {
    const countryChanged = newCountry !== initialCountry;
    setPracticeCountry(newCountry);
    if (countryChanged) {
      setLicenseNumber('');
      setLicenseCleared(true);
    } else {
      setLicenseCleared(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updates: Partial<ProfessionalProfile> = {
      fullName,
      licenseNumber,
      specialty,
      practiceCountry,
      workplace,
      experienceYears,
    };
    await updateProfile(updates);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800 font-apple">Editar perfil profesional</h2>
          <button type="button" onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Nombre completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">País de práctica</label>
            <select
              value={practiceCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="">Seleccionar país</option>
              <option value="ES">España</option>
              <option value="CA">Canadá</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">
              Número de colegiado / licencia
              {licenseCleared && <span className="ml-2 text-amber-600 font-normal">— requerido al cambiar país</span>}
            </label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder={licenseCleared ? 'Introduce el número para el nuevo país' : ''}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 ${licenseCleared ? 'border-amber-400' : 'border-slate-200'}`}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Especialidad</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Centro de trabajo</label>
            <input
              type="text"
              value={workplace}
              onChange={(e) => setWorkplace(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Años de experiencia</label>
            <input
              type="text"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => { void handleSave(); }}
            disabled={isSaving || (licenseCleared && !licenseNumber.trim())}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};
