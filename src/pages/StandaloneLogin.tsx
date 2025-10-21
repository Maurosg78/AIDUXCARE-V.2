import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const StandaloneLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // Direct navigation - bypass all Firebase
    localStorage.setItem('bypass-user', JSON.stringify({
      uid: 'test-user',
      email: email,
      displayName: 'Test User'
    }));
    navigate('/professional-workflow');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-center">AiduxCare Access</h2>
        </div>
        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter any email"
            className="w-full px-3 py-2 border rounded-md"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            Access System
          </button>
        </div>
      </div>
    </div>
  );
};
