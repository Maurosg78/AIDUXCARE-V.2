import React from 'react';

export const DebugRawResponse = ({ data }) => {
  if (!data) return null;
  
  return (
    <div className="mt-8 p-4 bg-yellow-100 border-2 border-yellow-500 rounded">
      <h3 className="font-bold text-red-600 mb-2">🔍 DEBUG - Estructura Real de la IA:</h3>
      <pre className="text-xs overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
      <div className="mt-4 text-sm">
        <p>✅ Total Red Flags: {data.redFlags?.length || 0}</p>
        <p>✅ Total Entities: {data.entities?.length || 0}</p>
        <p>✅ Total Yellow Flags: {data.yellowFlags?.length || 0}</p>
      </div>
    </div>
  );
};
