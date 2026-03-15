import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, HelpCircle, FileText, Shield, MessageCircle, Globe } from 'lucide-react';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';

type FAQCategory = 'general' | 'privacy' | 'technical' | 'support';

/** FAQ entries: index into i18n keys faq.q0..q8, faq.a0..a8 */
const faqEntries: { category: FAQCategory; index: number }[] = [
  { category: 'general', index: 0 },
  { category: 'general', index: 1 },
  { category: 'general', index: 2 },
  { category: 'privacy', index: 3 },
  { category: 'privacy', index: 4 },
  { category: 'technical', index: 5 },
  { category: 'technical', index: 6 },
  { category: 'support', index: 7 },
  { category: 'support', index: 8 },
];

const categoryIcons = {
  general: HelpCircle,
  privacy: Shield,
  technical: FileText,
  support: MessageCircle
};

const categoryKeys: Record<FAQCategory, string> = {
  general: 'faq.general',
  privacy: 'faq.privacy',
  technical: 'faq.technical',
  support: 'faq.support',
};

export default function FAQPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = React.useState<'all' | FAQCategory>('all');

  const filteredEntries = selectedCategory === 'all'
    ? faqEntries
    : faqEntries.filter((e) => e.category === selectedCategory);

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
            {t('shell.nav.backToCommandCenter')}
          </button>
          <div className="flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-primary-blue" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-light font-apple text-gray-900">
                {t('faq.title')}
              </h1>
              <p className="mt-2 text-gray-600 font-apple text-[15px]">
                {t('faq.subtitle')}
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
            {t('faq.all')}
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
                {t(categoryKeys[category])}
              </button>
            );
          })}
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500 font-apple text-[15px]">{t('faq.noFound')}</p>
            </div>
          ) : (
            filteredEntries.map((entry, index) => (
              <div
                key={`${entry.category}-${entry.index}`}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {React.createElement(categoryIcons[entry.category], {
                      className: 'w-5 h-5 text-primary-blue'
                    })}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2 font-apple">
                      {t(`faq.q${entry.index}`)}
                    </h3>
                    <p className="text-gray-700 whitespace-pre-line font-apple text-[15px] leading-relaxed">
                      {t(`faq.a${entry.index}`)}
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
              <h3 className="text-lg font-medium mb-2 font-apple">{t('faq.stillHaveQuestions')}</h3>
              <p className="text-white/90 font-apple text-[15px] mb-4">
                {t('faq.supportContact')}
              </p>
              <button
                onClick={() => navigate('/command-center')}
                className="bg-white text-primary-blue px-4 py-2 rounded-lg hover:bg-gray-100 font-apple text-[15px] font-medium"
              >
                {t('shell.nav.goToCommandCenter')}
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

