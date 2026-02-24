/**
 * Patient Search Bar — WO-COMMAND-CENTER-PATIENT-SEARCH-RESTORE-V1
 *
 * Visible search bar in Command Center. Search patient → select → navigate to Patient History.
 * Uses usePatientsList + client-side filter (case-insensitive) — PatientService.searchPatients
 * uses Firestore prefix search which is case-sensitive and returns no results for "nova" vs "Nova".
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { usePatientsList } from '../hooks/usePatientsList';

export const PatientSearchBar: React.FC = () => {
  const navigate = useNavigate();
  const { patients: allPatients, loading } = usePatientsList();
  const [query, setQuery] = React.useState('');
  const [showResults, setShowResults] = React.useState(false);

  const filteredPatients = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return allPatients.filter((p) => {
      const fullName = (p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim()).toLowerCase();
      const email = (p.email || '').toLowerCase();
      const firstName = (p.firstName || '').toLowerCase();
      const lastName = (p.lastName || '').toLowerCase();
      return fullName.includes(q) || email.includes(q) || firstName.includes(q) || lastName.includes(q);
    });
  }, [allPatients, query]);

  const handleSelect = (patient: { id: string }) => {
    navigate(`/patients/${patient.id}/history`);
    setQuery('');
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search patient by name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary-blue focus:border-primary-blue/50 font-apple text-slate-900 placeholder:text-slate-400"
          aria-label="Search patient"
        />
      </div>
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-sm text-slate-500">Loading patients...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">
              {query.trim() ? 'No patients found — try a different search' : 'Type to search patients'}
            </div>
          ) : (
            <ul className="py-2">
              {filteredPatients.map((patient) => (
                <li key={patient.id} className="px-2">
                  <button
                    type="button"
                    onClick={() => handleSelect(patient)}
                    className="w-full px-4 py-3 min-h-[56px] rounded-lg text-left hover:bg-slate-50 active:bg-slate-100 font-apple text-slate-900 flex flex-col justify-center"
                  >
                    <span className="block text-sm font-medium leading-snug">
                      {patient.fullName || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown'}
                    </span>
                    {patient.email && (
                      <span className="block text-xs text-slate-500 mt-0.5 leading-tight">{patient.email}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
