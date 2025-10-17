import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClinicalNote } from '@/types/notes';
import { usePatientHistory } from '@/hooks/usePatientHistory';
import { NoteHistoryList } from '@/components/history/NoteHistoryList';
import { NoteHistoryFilters } from '@/components/history/NoteHistoryFilters';
import { NoteDetailView } from '@/components/history/NoteDetailView';
import Button from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';

export const PatientHistoryPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  
  const { 
    notes, 
    allNotes, 
    filters, 
    setFilters, 
    loading, 
    error 
  } = usePatientHistory(patientId || '');

  if (!patientId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Patient ID not provided</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error.message}</p>
          <Button onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Patient History</h1>
            <p className="text-sm text-gray-500">
              {allNotes.length > 0 ? `${allNotes.length} notes found` : 'Loading...'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Left Panel - List */}
        <div className="w-1/2 flex flex-col">
          <NoteHistoryFilters
            filters={filters}
            onFiltersChange={setFilters}
            totalNotes={allNotes.length}
            filteredCount={notes.length}
          />
          <div className="flex-1 overflow-y-auto">
            <NoteHistoryList
              notes={notes}
              onSelectNote={setSelectedNote}
              selectedNoteId={selectedNote?.id}
              loading={loading}
            />
          </div>
        </div>

        {/* Right Panel - Detail */}
        <div className="w-1/2">
          {selectedNote ? (
            <NoteDetailView 
              note={selectedNote} 
              onClose={() => setSelectedNote(null)} 
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>Select a note to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientHistoryPage;
