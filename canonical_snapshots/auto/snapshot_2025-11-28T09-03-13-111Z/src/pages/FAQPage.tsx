import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, FileText, Shield, MessageCircle, Globe } from 'lucide-react';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'privacy' | 'technical' | 'support';
}

const faqData: FAQItem[] = [
  {
    category: 'general',
    question: 'What is AiduxCare?',
    answer: 'AiduxCare is an AI-powered clinical documentation companion for Canadian physiotherapists. It helps you generate SOAP notes from voice recordings, saving time while maintaining CPO compliance standards.'
  },
  {
    category: 'general',
    question: 'How do I create a SOAP note?',
    answer: '1. Select a patient from the Patient List\n2. Click "Start Recording" in the workflow\n3. Speak your clinical notes\n4. Review and edit the generated SOAP note\n5. Save and copy to your EMR'
  },
  {
    category: 'general',
    question: 'Where are my notes stored?',
    answer: 'All notes are stored securely in Canada (northamerica-northeast1 region). You can access them anytime from the Clinical Vault in the Command Center.'
  },
  {
    category: 'privacy',
    question: 'Is my data secure?',
    answer: 'Yes. All data is encrypted in transit and at rest. Clinical data is stored in Canada. AI processing occurs in the United States with explicit patient consent as required by PHIPA.'
  },
  {
    category: 'privacy',
    question: 'What happens to my audio recordings?',
    answer: 'Audio recordings are processed for transcription and SOAP generation, then securely deleted. Only the text-based SOAP notes are retained in your Clinical Vault.'
  },
  {
    category: 'technical',
    question: 'What if the audio upload fails?',
    answer: 'The system automatically retries failed uploads up to 3 times. If upload continues to fail, you\'ll see a clear error message and can try again or use manual entry.'
  },
  {
    category: 'technical',
    question: 'Can I use AiduxCare on mobile devices?',
    answer: 'Yes! AiduxCare is fully responsive and works on iOS Safari (iPhone/iPad) and Android Chrome. Make sure to allow microphone permissions when prompted.'
  },
  {
    category: 'support',
    question: 'How do I report a problem?',
    answer: 'Click the floating "Feedback" button (bottom right) on any page. You can report bugs, request features, or ask questions. We respond within 24-48 hours.'
  },
  {
    category: 'support',
    question: 'Where can I find more help?',
    answer: 'Check the Pilot Welcome Pack for detailed instructions. You can also contact support via the feedback widget or email support@aiduxcare.com'
  }
];

export default function FAQPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = React.useState<'all' | FAQItem['category']>('all');

  const filteredFAQs = selectedCategory === 'all' 
    ? faqData 
    : faqData.filter(faq => faq.category === selectedCategory);

  const categoryIcons = {
    general: HelpCircle,
    privacy: Shield,
    technical: FileText,
    support: MessageCircle
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-ultralight to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/command-center')}
            className="flex items-center gap-2 text-primary-blue hover:text-primary-purple mb-4 font-apple text-[15px] font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Command Center
          </button>
          <div className="flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-primary-blue" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-light font-apple text-gray-900">
                Frequently Asked Questions
              </h1>
              <p className="mt-2 text-gray-600 font-apple text-[15px]">
                Find answers to common questions about AiduxCare
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-apple text-[15px] font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-primary-blue to-primary-purple text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            All
          </button>
          {(['general', 'privacy', 'technical', 'support'] as const).map((category) => {
            const Icon = categoryIcons[category];
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-apple text-[15px] font-medium transition-colors flex items-center gap-2 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-primary-blue to-primary-purple text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            );
          })}
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500 font-apple text-[15px]">No FAQs found in this category.</p>
            </div>
          ) : (
            filteredFAQs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {React.createElement(categoryIcons[faq.category], {
                      className: 'w-5 h-5 text-primary-blue'
                    })}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2 font-apple">
                      {faq.question}
                    </h3>
                    <p className="text-gray-700 whitespace-pre-line font-apple text-[15px] leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Support Contact */}
        <div className="mt-12 bg-gradient-to-r from-primary-blue to-primary-purple rounded-lg p-6 text-white">
          <div className="flex items-start gap-4">
            <MessageCircle className="w-6 h-6 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-medium mb-2 font-apple">Still have questions?</h3>
              <p className="text-white/90 font-apple text-[15px] mb-4">
                Use the feedback widget on any page or contact support@aiduxcare.com
              </p>
              <button
                onClick={() => navigate('/command-center')}
                className="bg-white text-primary-blue px-4 py-2 rounded-lg hover:bg-gray-100 font-apple text-[15px] font-medium"
              >
                Go to Command Center
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Widget */}
      <FeedbackWidget />
    </div>
  );
}

