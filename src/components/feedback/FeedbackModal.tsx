import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FeedbackService, FeedbackType, FeedbackSeverity, EnrichedContext } from '../../services/feedbackService';
import { useAuth } from '../../hooks/useAuth';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * FeedbackModal
 * 
 * Modal for users to submit feedback during beta testing.
 * Captures: type, severity, description + auto-context.
 * 🔴 ENHANCED: Now includes enriched context capture and display.
 */
export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [type, setType] = useState<FeedbackType>('bug');
  const [severity, setSeverity] = useState<FeedbackSeverity>('medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [enrichedContext, setEnrichedContext] = useState<EnrichedContext | null>(null);

  // 🔴 NUEVO: Capturar contexto enriquecido cuando modal se abre
  useEffect(() => {
    if (isOpen) {
      const context = FeedbackService.getEnrichedContext();
      setEnrichedContext(context);
      console.log('[FEEDBACK] Captured enriched context:', context);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      setSubmitError(t('feedback.modal.errorDescribe'));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const autoContext = FeedbackService.getAutoContext();
      
      // ✅ FIX: Ensure sessionId is not undefined (Firestore doesn't accept undefined)
      const sessionId = sessionStorage.getItem('sessionId');
      
      await FeedbackService.submitFeedback({
        type,
        severity,
        description: description.trim(),
        userId: user?.uid,
        ...(sessionId && { sessionId }), // Only include if defined
        ...autoContext,
      });

      setSubmitSuccess(true);
      setDescription('');
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitError('Error submitting feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setDescription('');
      setSubmitError(null);
      setSubmitSuccess(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50" onClick={handleClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('feedback.modal.title')}</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white hover:text-gray-200 transition-colors disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={t('feedback.modal.close')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
              ✅ {t('feedback.modal.success')}
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              ❌ {submitError}
            </div>
          )}

          {/* Type Selection */}
          <div>
            <label htmlFor="feedback-type" className="block text-sm font-medium text-gray-700 mb-2">
              {t('feedback.modal.typeLabel')}
            </label>
            <select
              id="feedback-type"
              value={type}
              onChange={(e) => setType(e.target.value as FeedbackType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="bug">🐛 {t('feedback.modal.typeBug')}</option>
              <option value="suggestion">💡 {t('feedback.modal.typeSuggestion')}</option>
              <option value="question">❓ {t('feedback.modal.typeQuestion')}</option>
              <option value="other">📝 {t('feedback.modal.typeOther')}</option>
            </select>
          </div>

          {/* Severity Selection */}
          <div>
            <label htmlFor="feedback-severity" className="block text-sm font-medium text-gray-700 mb-2">
              {t('feedback.modal.severityLabel')}
            </label>
            <select
              id="feedback-severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as FeedbackSeverity)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="low">🟢 {t('feedback.modal.severityLow')}</option>
              <option value="medium">🟡 {t('feedback.modal.severityMedium')}</option>
              <option value="high">🟠 {t('feedback.modal.severityHigh')}</option>
              <option value="critical">🔴 {t('feedback.modal.severityCritical')}</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="feedback-description" className="block text-sm font-medium text-gray-700 mb-2">
              {t('feedback.modal.descriptionLabel')}
            </label>
            <textarea
              id="feedback-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('feedback.modal.descriptionPlaceholder')}
              required
              disabled={isSubmitting}
            />
            <p className="mt-1 text-sm text-gray-500">
              {t('feedback.modal.autoCaptureNote')}
            </p>
          </div>

          {/* 🔴 NUEVO: Mostrar contexto capturado automáticamente */}
          {enrichedContext && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                📍 {t('feedback.modal.contextTitle')}
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-start gap-2">
                  <span className="font-medium">{t('feedback.modal.url')}</span>
                  <span className="text-gray-500 break-all">{window.location.pathname}</span>
                </div>
                {enrichedContext.workflowStep && (
                  <div className="flex items-start gap-2">
                    <span className="font-medium">{t('feedback.modal.workflowStep')}</span>
                    <span className="text-gray-500 capitalize">{enrichedContext.workflowStep}</span>
                  </div>
                )}
                {enrichedContext.patientType && (
                  <div className="flex items-start gap-2">
                    <span className="font-medium">{t('feedback.modal.patientType')}</span>
                    <span className="text-gray-500">
                      {enrichedContext.patientType === 'new_evaluation' ? t('feedback.modal.patientTypeNew') : t('feedback.modal.patientTypeFollowup')}
                    </span>
                  </div>
                )}
                {enrichedContext.isPilotUser && (
                  <div className="flex items-start gap-2">
                    <span className="font-medium">{t('feedback.modal.pilotUser')}</span>
                    <span className="text-gray-500">{t('feedback.modal.yes')}</span>
                  </div>
                )}
                {enrichedContext.userExperienceLevel && (
                  <div className="flex items-start gap-2">
                    <span className="font-medium">{t('feedback.modal.experienceLevel')}</span>
                    <span className="text-gray-500 capitalize">{enrichedContext.userExperienceLevel}</span>
                  </div>
                )}
                {enrichedContext.workflowState && (
                  <div className="mt-2 pt-2 border-t border-gray-300">
                    <div className="font-medium text-gray-700 mb-1">{t('feedback.modal.workflowState')}</div>
                    <div className="space-y-0.5 text-gray-600">
                      {enrichedContext.workflowState.hasTranscript && (
                        <div>✓ {t('feedback.modal.hasTranscript', { count: enrichedContext.workflowState.transcriptLength ?? 0 })}</div>
                      )}
                      {enrichedContext.workflowState.hasAnalysis && <div>✓ {t('feedback.modal.hasAnalysis')}</div>}
                      {enrichedContext.workflowState.testsCompleted !== undefined && enrichedContext.workflowState.testsCompleted > 0 && (
                        <div>✓ {t('feedback.modal.testsCompleted', { count: enrichedContext.workflowState.testsCompleted })}</div>
                      )}
                      {enrichedContext.workflowState.soapGenerated && <div>✓ {t('feedback.modal.soapGenerated')}</div>}
                      {enrichedContext.workflowState.soapFinalized && <div>✓ {t('feedback.modal.soapFinalized')}</div>}
                    </div>
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-gray-300 text-gray-500 italic">
                  {t('feedback.modal.contextFooter')}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-3 min-h-[48px] text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
              {t('feedback.modal.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="px-5 py-3 min-h-[48px] bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('feedback.modal.submitting')}
                </>
              ) : (
                t('feedback.modal.submit')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

