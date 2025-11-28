import React from "react";
export default function ConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 text-center w-full max-w-md">
        <h1 className="text-2xl font-bold text-blue-700 mb-4">Email Sent ✅</h1>
        <p className="text-gray-700">
          Thank you. A verification link has been sent to your email.<br />
          Please verify to activate your AiDuxCare account.
        </p>
      </div>
    </div>
  );
}
