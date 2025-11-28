/**
 * Admin Dashboard Page
 * 
 * Administrative interface
 * Sprint 2B Expanded - Day 1-2: Navigation & Routing Foundation
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        <p className="text-gray-600 mb-4">This page is under construction.</p>
        <button
          onClick={() => navigate('/command-center')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Return to Command Center
        </button>
      </div>
    </div>
  );
}

