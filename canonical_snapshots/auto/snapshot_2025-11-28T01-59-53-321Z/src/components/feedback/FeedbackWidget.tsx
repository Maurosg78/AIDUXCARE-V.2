import React, { useState } from 'react';
import { FeedbackModal } from './FeedbackModal';

/**
 * FeedbackWidget
 * 
 * Floating button always visible for users to report feedback during beta testing.
 * Critical for 1-month physiotherapist testing program.
 */
export const FeedbackWidget: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 min-w-[48px] min-h-[48px] shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group"
        aria-label="Report feedback"
        title="Report problem or suggestion"
      >
        {/* Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
        
        {/* Text (visible on hover) */}
        <span className="hidden md:inline-block text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Feedback
        </span>
      </button>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

