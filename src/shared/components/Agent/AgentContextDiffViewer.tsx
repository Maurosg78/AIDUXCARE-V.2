import React from 'react';

interface Props {
  diffs: {
    id: string;
    title: string;
    original: string;
    updated: string;
  }[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

const AgentContextDiffViewer: React.FC<Props> = ({ diffs, onAccept, onReject }) => {
  return (
    <div className="space-y-4">
      {diffs.map((diff) => (
        <div
          key={diff.id}
          className="border rounded-xl p-4 shadow-sm bg-white"
          role="group"
          aria-labelledby={`diff-${diff.id}`}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 id={`diff-${diff.id}`} className="text-lg font-semibold">
              {diff.title}
            </h3>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-green-100 hover:bg-green-200 rounded-md text-green-800"
                onClick={() => onAccept(diff.id)}
              >
                Aceptar
              </button>
              <button
                className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-md text-red-800"
                onClick={() => onReject(diff.id)}
              >
                Rechazar
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold">Original</p>
              <div className="bg-gray-50 p-2 rounded-md whitespace-pre-wrap border">
                {diff.original}
              </div>
            </div>
            <div>
              <p className="font-semibold">Modificado</p>
              <div className="bg-blue-50 p-2 rounded-md whitespace-pre-wrap border border-blue-300">
                {diff.updated}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgentContextDiffViewer;
