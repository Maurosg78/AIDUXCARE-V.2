import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-3xl font-bold mb-4">Welcome to AiduxCare MVP</h1>
      <p className="text-gray-600 mb-6">
        Navigate below to continue to your workflow or consent form.
      </p>
      <div className="flex gap-4">
        <Link
          to="/workflow"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Workflow
        </Link>
        <Link
          to="/patient-consent"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Go to Consent Form
        </Link>
      </div>
    </div>
  );
}
