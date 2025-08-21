import React from 'react';

interface NotesPageProps {
  id?: string;
}

export const NotesPage: React.FC<NotesPageProps> = ({ id }) => {
  if (id) {
    // Vista de detalle de nota
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Detalle de Nota Clínica
        </h1>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">ID de la nota: {id}</p>
          <p className="text-gray-600 mt-4">
            Esta es la vista de detalle de una nota clínica específica.
          </p>
        </div>
      </div>
    );
  }

  // Vista de lista de notas
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Notas Clínicas
      </h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">
          Lista de todas las notas clínicas del sistema.
        </p>
        <div className="mt-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Nueva Nota
          </button>
        </div>
      </div>
    </div>
  );
};

// Exportaciones específicas para el router
export const NotesListPage: React.FC = () => <NotesPage />;
export const NoteDetailPage: React.FC<{ id: string }> = ({ id }) => <NotesPage id={id} />;

export default NotesPage;
