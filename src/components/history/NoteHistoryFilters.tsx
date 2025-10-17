import React from 'react';
import { PatientHistoryFilters } from '@/hooks/usePatientHistory';
import { Search } from 'lucide-react';

interface Props {
  filters: PatientHistoryFilters;
  onFiltersChange: (filters: PatientHistoryFilters) => void;
  totalNotes: number;
  filteredCount: number;
}

export const NoteHistoryFilters: React.FC<Props> = ({ 
  filters, 
  onFiltersChange, 
  totalNotes, 
  filteredCount 
}) => {
  return (
    <div className="bg-white border-b border-gray-200 p-4 space-y-4">
      {/* Status Filter */}
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium">Status:</label>
        <select 
          value={filters.status || 'all'}
          onChange={(e) => onFiltersChange({ 
            ...filters, 
            status: e.target.value as PatientHistoryFilters['status']
          })}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="signed">Signed</option>
        </select>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search in notes..."
          value={filters.searchQuery || ''}
          onChange={(e) => onFiltersChange({ 
            ...filters, 
            searchQuery: e.target.value 
          })}
          className="border rounded px-3 py-1 text-sm flex-1"
        />
      </div>

      {/* Results count */}
      <div className="text-xs text-gray-500">
        Showing {filteredCount} of {totalNotes} notes
      </div>
    </div>
  );
};
