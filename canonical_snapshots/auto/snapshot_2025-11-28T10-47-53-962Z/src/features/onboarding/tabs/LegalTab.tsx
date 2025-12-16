import React from "react";

export function LegalTab({ next, back }: { next?: () => void; back?: () => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Legal Info</h2>
      <p className="text-gray-600">TODO: implement LegalTab according to audit spec</p>
      <div className="flex justify-between mt-6">
        {back && <button onClick={back} className="btn btn-secondary">Back</button>}
        {next && <button onClick={next} className="btn btn-primary">Next</button>}
      </div>
    </div>
  );
}
