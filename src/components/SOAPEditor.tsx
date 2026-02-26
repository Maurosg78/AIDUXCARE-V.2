/**
 * SOAP Editor Component
 * 
 * Provides editable interface for SOAP note sections (S/O/A/P)
 * with Draft/Finalized states and validation.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import React, { useState, useEffect } from 'react';
import { FileText, Save, CheckCircle, AlertCircle, Loader2, RefreshCw, Eye, Copy, Download, Check, X, Share2 } from 'lucide-react';
import type { SOAPNote } from '../types/vertex-ai';
import { AnalyticsService } from '../services/analyticsService';
import { useAuth } from '../hooks/useAuth';

export type SOAPStatus = 'draft' | 'finalized';

export interface SOAPEditorProps {
  soap: SOAPNote | null;
  status: SOAPStatus;
  visitType: 'initial' | 'follow-up';
  isGenerating?: boolean;
  patientId?: string; // Patient ID for scheduling sessions
  sessionId?: string; // Session ID for sharing
  onSave: (soap: SOAPNote, status: SOAPStatus) => void;
  onRegenerate?: () => void;
  onFinalize?: (soap: SOAPNote) => void;
  onUnfinalize?: (soap: SOAPNote) => void;
  onPreview?: (soap: SOAPNote) => void;
  onShare?: () => void; // Callback to open share menu
  /** When provided and status is finalized, shows "Back to Command Center" and save confirmation. */
  onBackToCommandCenter?: () => void;
  className?: string;
  /** Follow-up only: one editable block (no S/O/A/P split). When true, always show single block. */
  singleBlockMode?: boolean;
  // ✅ WORKFLOW OPTIMIZATION: Optimized mode for follow-ups
  isOptimized?: boolean;
  tokenOptimization?: {
    optimizedTokens: number;
    standardTokens: number;
    reduction: number;
    reductionPercent: number;
  };
}

export const SOAPEditor: React.FC<SOAPEditorProps> = ({
  soap,
  status,
  visitType,
  singleBlockMode = false,
  isGenerating = false,
  patientId,
  sessionId,
  onSave,
  onRegenerate,
  onFinalize,
  onUnfinalize,
  onPreview,
  onShare,
  onBackToCommandCenter,
  className = '',
  isOptimized = false,
  tokenOptimization,
}) => {
  // Follow-up: one block only (no Niagara, no 4-section mapping). Cannot show S/O/A/P split.
  const showSingleBlock = singleBlockMode || visitType === 'follow-up';
  const { user } = useAuth();
  const [editedSOAP, setEditedSOAP] = useState<SOAPNote | null>(soap);
  const [hasChanges, setHasChanges] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  // WO-SOAP-FINALIZE-GATE-001
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingFinalized, setIsEditingFinalized] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    setEditedSOAP(soap);
    setHasChanges(false);
  }, [soap]);

  const handleSectionChange = (section: keyof SOAPNote, value: string) => {
    if (!editedSOAP) return;
    
    setEditedSOAP({
      ...editedSOAP,
      [section]: value,
    });
    setHasChanges(true);
  };

  /** Follow-up only: build single-block display from S/O/A/P when followUp not set. */
  const getFollowUpSingleBlockContent = (soap: SOAPNote): string => {
    if (soap.followUp != null && soap.followUp.trim() !== '') return soap.followUp;
    const s = soap.subjective?.trim() || '';
    const o = soap.objective?.trim() || '';
    const a = soap.assessment?.trim() || '';
    const p = soap.plan?.trim() || '';
    const parts: string[] = [];
    if (s) parts.push(`S: Subjective\n${s}`);
    if (o) parts.push(`O: Objective\n${o}`);
    if (a) parts.push(`A: Assessment\n${a}`);
    if (p) parts.push(`P: Plan\n${p}`);
    return parts.join('\n\n');
  };

  /** Follow-up only: update full note (store in followUp). */
  const handleFollowUpSingleBlockChange = (value: string) => {
    if (!editedSOAP) return;
    setEditedSOAP({ ...editedSOAP, followUp: value });
    setHasChanges(true);
  };

  const handleSaveDraft = () => {
    if (!editedSOAP) return;
    onSave(editedSOAP, 'draft');
    setHasChanges(false);
  };

  const handleFinalize = () => {
    if (!editedSOAP) return;

    // WO-SOAP-FINALIZE-GATE-001: collect missing items before allowing finalize
    const isEmpty = (s?: string) =>
      !s || s.trim().length < 10 || s.trim() === 'Not documented.';

    const missing: string[] = [];
    if (isEmpty(editedSOAP.subjective))
      missing.push('Subjective section is empty — add patient-reported symptoms');
    if (isEmpty(editedSOAP.objective))
      missing.push('Objective section is empty — add physical exam findings');
    if (isEmpty(editedSOAP.assessment))
      missing.push('Assessment section is empty — add clinical reasoning');
    if (isEmpty(editedSOAP.plan))
      missing.push('Plan section is empty — generate SOAP or add manually');
    if (
      editedSOAP.plan &&
      !isEmpty(editedSOAP.plan) &&
      !editedSOAP.plan.includes('IN-CLINIC TREATMENT')
    )
      missing.push('Plan is missing IN-CLINIC TREATMENT section — regenerate or edit manually');
    if (requiresReview && !isReviewed)
      missing.push('CPO review checkbox must be confirmed before finalizing');

    if (missing.length > 0) {
      setMissingItems(missing);
      setShowMissingModal(true);
      return;
    }

    // Original flow — unchanged from here
    if (showFinalizeConfirm) {
      const soapToFinalize = {
        ...editedSOAP,
        isReviewed: requiresReview ? true : editedSOAP.isReviewed,
      };
      onFinalize?.(soapToFinalize);
      setShowFinalizeConfirm(false);
    } else {
      setShowFinalizeConfirm(true);
    }
  };

  const handleCancelFinalize = () => {
    setShowFinalizeConfirm(false);
  };

  const handlePreview = () => {
    if (!currentSOAP) return;
    // Always show internal preview modal
    setShowPreview(true);
    // Also call external handler if provided
    if (onPreview) {
      onPreview(currentSOAP);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handleUnfinalize = () => {
    if (!currentSOAP) return;
    setIsEditingFinalized(true);
    setHasChanges(false);
    // Call external handler if provided
    if (onUnfinalize) {
      onUnfinalize(currentSOAP);
    }
  };

  const handleSaveAfterUnfinalize = () => {
    if (!currentSOAP) return;
    // Save as draft when editing finalized note
    handleSaveDraft();
    setIsEditingFinalized(false);
  };

  /**
   * Generate plain text format for EMR export
   * Compatible with most EMR systems (text-only, no formatting)
   */
  const generatePlainTextFormat = (soapNote: SOAPNote): string => {
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = currentDate.toLocaleTimeString('en-CA', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `SOAP NOTE
${'='.repeat(60)}

Date: ${dateStr}
Time: ${timeStr}
Visit Type: ${visitType === 'initial' ? 'Initial Assessment' : 'Follow-up Visit'}

${'─'.repeat(60)}

S: SUBJECTIVE
${'─'.repeat(60)}
${soapNote.subjective || 'No subjective information recorded.'}

${'─'.repeat(60)}

O: OBJECTIVE
${'─'.repeat(60)}
${soapNote.objective || 'No objective findings recorded.'}

${'─'.repeat(60)}

A: ASSESSMENT
${'─'.repeat(60)}
${soapNote.assessment || 'No assessment recorded.'}

${'─'.repeat(60)}

P: PLAN
${'─'.repeat(60)}
${soapNote.plan || 'No treatment plan recorded.'}

${'─'.repeat(60)}

${soapNote.referrals ? `Referrals:\n${soapNote.referrals}\n\n${'─'.repeat(60)}\n` : ''}
${soapNote.precautions ? `Precautions:\n${soapNote.precautions}\n\n${'─'.repeat(60)}\n` : ''}
${soapNote.additionalNotes ? `Additional Notes:\n${soapNote.additionalNotes}\n\n${'─'.repeat(60)}\n` : ''}

Generated by AiDuxCare
Document ID: ${Date.now()}
Status: Finalized

${'='.repeat(60)}`;
  };

  /**
   * Copy SOAP note to clipboard as plain text (follow-up: copy single block when edited)
   */
  const handleCopyToClipboard = async () => {
    if (!currentSOAP) return;

    const textToCopy = showSingleBlock && currentSOAP
      ? (currentSOAP.followUp?.trim() || getFollowUpSingleBlockContent(currentSOAP))
      : generatePlainTextFormat(currentSOAP);
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      
      // ✅ PILOT METRICS: Track copy to clipboard
      try {
        const pilotStartDate = new Date('2024-12-19T00:00:00Z');
        const isPilotUser = new Date() >= pilotStartDate;
        
        if (isPilotUser && user?.uid && patientId) {
          await AnalyticsService.trackEvent('pilot_emr_copy', {
            patientId,
            userId: user.uid,
            action: 'copy_to_clipboard',
            visitType,
            soapStatus: status,
            timestamp: new Date().toISOString(),
            isPilotUser: true
          });
          console.log('✅ [PILOT METRICS] Copy to clipboard tracked');
        }
      } catch (error) {
        console.error('⚠️ [PILOT METRICS] Error tracking copy to clipboard:', error);
        // Non-blocking: don't fail copy if analytics fails
      }
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      
      // ✅ PILOT METRICS: Track copy to clipboard (fallback)
      try {
        const pilotStartDate = new Date('2024-12-19T00:00:00Z');
        const isPilotUser = new Date() >= pilotStartDate;
        
        if (isPilotUser && user?.uid && patientId) {
          await AnalyticsService.trackEvent('pilot_emr_copy', {
            patientId,
            userId: user.uid,
            action: 'copy_to_clipboard_fallback',
            visitType,
            soapStatus: status,
            timestamp: new Date().toISOString(),
            isPilotUser: true
          });
        }
      } catch (error) {
        // Silent fail
      }
    }
  };

  /**
   * Download SOAP note as .txt file
   */
  const handleDownloadAsText = () => {
    if (!currentSOAP) return;

    const plainText = showSingleBlock && currentSOAP
      ? (currentSOAP.followUp?.trim() || getFollowUpSingleBlockContent(currentSOAP))
      : generatePlainTextFormat(currentSOAP);
    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SOAP_Note_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // ✅ PILOT METRICS: Track text file download
    (async () => {
      try {
        const pilotStartDate = new Date('2024-12-19T00:00:00Z');
        const isPilotUser = new Date() >= pilotStartDate;
        
        if (isPilotUser && user?.uid && patientId) {
          await AnalyticsService.trackEvent('pilot_emr_export', {
            patientId,
            userId: user.uid,
            action: 'export_txt',
            visitType,
            soapStatus: status,
            timestamp: new Date().toISOString(),
            isPilotUser: true
          });
          console.log('✅ [PILOT METRICS] Text file export tracked');
        }
      } catch (error) {
        console.error('⚠️ [PILOT METRICS] Error tracking text export:', error);
        // Non-blocking: don't fail export if analytics fails
      }
    })();
  };

  /**
   * Export SOAP note as PDF (using browser print functionality)
   * This is a simple PDF export that works across all browsers
   */
  const handleExportPDF = () => {
    const currentSOAP = editedSOAP || soap;
    if (!currentSOAP) return;
    
    // ✅ PILOT METRICS: Track PDF export
    (async () => {
      try {
        const pilotStartDate = new Date('2024-12-19T00:00:00Z');
        const isPilotUser = new Date() >= pilotStartDate;
        
        if (isPilotUser && user?.uid && patientId) {
          await AnalyticsService.trackEvent('pilot_emr_export', {
            patientId,
            userId: user.uid,
            action: 'export_pdf',
            visitType,
            soapStatus: status,
            timestamp: new Date().toISOString(),
            isPilotUser: true
          });
          console.log('✅ [PILOT METRICS] PDF export tracked');
        }
      } catch (error) {
        console.error('⚠️ [PILOT METRICS] Error tracking PDF export:', error);
        // Non-blocking: don't fail export if analytics fails
      }
    })();
    
    // Create a new window with formatted SOAP note
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to export PDF');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SOAP Note - ${new Date().toLocaleDateString('en-CA')}</title>
          <style>
            @media print {
              @page { margin: 1in; }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #1e293b;
              max-width: 8.5in;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              color: #4f46e5;
              border-bottom: 3px solid #4f46e5;
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            .section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .section-title {
              font-weight: 600;
              font-size: 14px;
              color: #6366f1;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .section-content {
              background: #f8fafc;
              padding: 12px;
              border-left: 4px solid #6366f1;
              white-space: pre-wrap;
              font-size: 12px;
              line-height: 1.7;
            }
            .metadata {
              font-size: 11px;
              color: #64748b;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
            }
          </style>
        </head>
        <body>
          <h1>SOAP Note</h1>
          <div class="metadata">
            <strong>Date:</strong> ${new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}<br>
            <strong>Time:</strong> ${new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}<br>
            <strong>Visit Type:</strong> ${visitType === 'initial' ? 'Initial Assessment' : 'Follow-up Visit'}
          </div>
          
          <div class="section">
            <div class="section-title">S: Subjective</div>
            <div class="section-content">${(currentSOAP.subjective || 'No subjective information recorded.').replace(/\n/g, '<br>')}</div>
          </div>
          
          <div class="section">
            <div class="section-title">O: Objective</div>
            <div class="section-content">${(currentSOAP.objective || 'No objective findings recorded.').replace(/\n/g, '<br>')}</div>
          </div>
          
          <div class="section">
            <div class="section-title">A: Assessment</div>
            <div class="section-content">${(currentSOAP.assessment || 'No assessment recorded.').replace(/\n/g, '<br>')}</div>
          </div>
          
          <div class="section">
            <div class="section-title">P: Plan</div>
            <div class="section-content">${(currentSOAP.plan || 'No treatment plan recorded.').replace(/\n/g, '<br>')}</div>
          </div>
          
          ${currentSOAP.referrals ? `
          <div class="section">
            <div class="section-title">Referrals</div>
            <div class="section-content">${currentSOAP.referrals.replace(/\n/g, '<br>')}</div>
          </div>
          ` : ''}
          
          ${currentSOAP.precautions ? `
          <div class="section">
            <div class="section-title">Precautions</div>
            <div class="section-content">${currentSOAP.precautions.replace(/\n/g, '<br>')}</div>
          </div>
          ` : ''}
          
          ${currentSOAP.additionalNotes ? `
          <div class="section">
            <div class="section-title">Additional Notes</div>
            <div class="section-content">${currentSOAP.additionalNotes.replace(/\n/g, '<br>')}</div>
          </div>
          ` : ''}
          
          <div class="metadata">
            <em>Generated by AiDuxCare - Clinical Documentation Companion</em>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (isGenerating) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-white p-8 shadow-sm ${className}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent mb-4" />
          <p className="text-[15px] font-light text-slate-700 font-apple">Generating SOAP note with AiduxCare AI...</p>
          <p className="text-[12px] text-slate-500 mt-2 font-apple font-light">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (!soap && !editedSOAP) {
    return (
      <div className={`rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center ${className}`}>
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-sm text-slate-600 mb-2">No SOAP note generated yet</p>
        <p className="text-xs text-slate-500">Complete the analysis and physical evaluation tabs, then generate a SOAP note</p>
      </div>
    );
  }

  const currentSOAP = editedSOAP || soap;
  const isReadOnly = status === 'finalized' && !showFinalizeConfirm && !isEditingFinalized;
  
  // ✅ DÍA 2: Review state tracking
  const requiresReview = currentSOAP?.requiresReview || false;
  const isReviewed = currentSOAP?.isReviewed || false;
  
  // ✅ DÍA 2: Handler para marcar como reviewed
  const handleMarkAsReviewed = () => {
    if (!currentSOAP) return;
    setEditedSOAP({
      ...currentSOAP,
      isReviewed: true,
    });
    setHasChanges(true);
  };

  // ✅ WO-PHASE3-CRITICAL-FIXES: Calculate SOAP completeness
  const calculateCompleteness = (soap: SOAPNote): {
    overall: number;
    sections: Partial<Record<keyof SOAPNote, number>>;
  } => {
    const sections = {
      subjective: Math.min((soap.subjective?.length || 0) / 200, 1), // Target 200 chars
      objective: Math.min((soap.objective?.length || 0) / 300, 1),   // Target 300 chars
      assessment: Math.min((soap.assessment?.length || 0) / 250, 1), // Target 250 chars
      plan: Math.min((soap.plan?.length || 0) / 400, 1),            // Target 400 chars
    };
    
    const overall = (sections.subjective + sections.objective + sections.assessment + sections.plan) / 4;
    
    return { overall, sections };
  };

  const completeness = currentSOAP ? calculateCompleteness(currentSOAP) : { overall: 0, sections: { subjective: 0, objective: 0, assessment: 0, plan: 0 } };

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {/* ✅ WO-PHASE3-CRITICAL-FIXES: Progress Indicator (initial only; follow-up uses single block) */}
      {currentSOAP && !showSingleBlock && (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-3">
            
            {/* Section indicators */}
            <div className="grid grid-cols-4 gap-2">
              {(['subjective', 'objective', 'assessment', 'plan'] as const).map((section) => {
                const sectionCompleteness = completeness.sections[section];
                const Icon = sectionCompleteness >= 0.8 ? CheckCircle : 
                            sectionCompleteness >= 0.3 ? AlertCircle : 
                            X;
                const iconColor = sectionCompleteness >= 0.8 ? 'text-green-500' :
                                 sectionCompleteness >= 0.3 ? 'text-yellow-500' :
                                 'text-gray-300';
                
                return (
                  <div key={section} className="text-center">
                    <div className="text-xs text-gray-500 uppercase mb-1">
                      {section[0]}
                    </div>
                    <Icon className={`w-5 h-5 mx-auto ${iconColor}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Header: title + status only. Actions moved to bottom so physio reads S/O/A/P first. */}
      <div className="border-b border-slate-200 bg-gray-50 px-6 py-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary-blue/20 to-primary-purple/20">
              <FileText className="w-5 h-5 text-primary-blue" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-medium bg-gradient-to-r from-primary-blue to-primary-purple bg-clip-text text-transparent font-apple">
                  SOAP Note - {visitType === 'initial' ? 'Initial Assessment' : 'Follow-up Visit'}
                </h3>
                {isOptimized && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                    Optimized
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs text-slate-500">
                  Status: <span className={`font-medium ${status === 'finalized' ? 'text-green-600' : 'text-amber-600'}`}>
                    {status === 'finalized' ? 'Finalized' : 'Draft'}
                  </span>
                </p>
                {tokenOptimization && tokenOptimization.reductionPercent > 0 && (
                  <p className="text-xs text-green-600 font-medium">
                    {tokenOptimization.reductionPercent}% token reduction
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ DÍA 2: Review Required Badge - CPO Compliance */}
      {requiresReview && !isReviewed && status === 'draft' && (
        <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900 mb-1">
                  ⚠️ Review Required - CPO Compliance
                </p>
                <p className="text-xs text-yellow-700 leading-relaxed">
                  This SOAP note was AI-generated and <strong>requires your review before finalization</strong>. 
                  Please verify all content, especially clinical assessments and treatment plans, to ensure accuracy 
                  and completeness per CPO TRUST Framework requirements.
                </p>
              </div>
            </div>
            <button
              onClick={handleMarkAsReviewed}
              className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors flex-shrink-0"
            >
              Mark as Reviewed
            </button>
          </div>
        </div>
      )}
      
      {/* ✅ DÍA 2: Review Completed Indicator */}
      {requiresReview && isReviewed && status === 'draft' && (
        <div className="px-6 py-3 bg-green-50 border-b border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-xs text-green-800">
              <strong>✓ Reviewed:</strong> This SOAP note has been reviewed and is ready for finalization.
              {currentSOAP?.reviewed?.reviewedAt && (
                <span className="ml-2 text-green-700">
                  Reviewed on {new Date(currentSOAP.reviewed.reviewedAt).toLocaleString('en-CA')}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* SOAP Sections: single editable block for follow-up (no Niagara, no 4-section mapping), four sections for initial */}
      <div className="p-6 space-y-6" data-follow-up-single-block={showSingleBlock ? 'true' : undefined}>
        {showSingleBlock ? (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Follow-up SOAP note (editable — copy and paste into your EMR)
            </label>
            <textarea
              value={(() => {
                if (!currentSOAP) return '';
                console.log('[SOAP-DEBUG] currentSOAP keys:', Object.keys(currentSOAP),
                  'followUp length:', currentSOAP.followUp?.length ?? 'undefined',
                  'followUp preview:', currentSOAP.followUp?.substring(0, 80) ?? 'null');
                return getFollowUpSingleBlockContent(currentSOAP);
              })()}
              onChange={(e) => handleFollowUpSingleBlockChange(e.target.value)}
              readOnly={isReadOnly}
              rows={20}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono ${
                isReadOnly ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-purple-200'
              }`}
              placeholder="S: Subjective\n\nO: Objective\n\nA: Assessment\n\nP: Plan"
            />
          </div>
        ) : (
          <>
        {/* Subjective */}
        <div className="border-l-4 border-purple-300 pl-4">
          <label className="block text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            S: Subjective
          </label>
          <textarea
            value={currentSOAP?.subjective || ''}
            onChange={(e) => handleSectionChange('subjective', e.target.value)}
            readOnly={isReadOnly}
            rows={4}
            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 ${
              isReadOnly ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-purple-200'
            }`}
            placeholder="Chief complaint, history of present condition, relevant medical history, medications, functional limitations..."
          />
        </div>

        {/* Objective */}
        <div className="border-l-4 border-blue-300 pl-4">
          <label className="block text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            O: Objective
          </label>
          <textarea
            value={currentSOAP?.objective || ''}
            onChange={(e) => handleSectionChange('objective', e.target.value)}
            readOnly={isReadOnly}
            rows={4}
            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 ${
              isReadOnly ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-purple-200'
            }`}
            placeholder="Physical examination findings, test results, measurements, observations..."
          />
        </div>

        {/* Assessment */}
        <div className="border-l-4 border-purple-400 pl-4">
          <label className="block text-sm font-semibold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            A: Assessment
          </label>
          <textarea
            value={currentSOAP?.assessment || ''}
            onChange={(e) => handleSectionChange('assessment', e.target.value)}
            readOnly={isReadOnly}
            rows={4}
            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 ${
              isReadOnly ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-purple-200'
            }`}
            placeholder="Clinical reasoning, pattern identification, differential considerations (non-diagnostic language)..."
          />
        </div>

        {/* Plan */}
        <div className="border-l-4 border-blue-400 pl-4">
          <label className="block text-sm font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            P: Plan
          </label>
          <textarea
            value={currentSOAP?.plan || ''}
            onChange={(e) => handleSectionChange('plan', e.target.value)}
            readOnly={isReadOnly}
            rows={6}
            className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 ${
              isReadOnly ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-purple-200'
            }`}
            placeholder="Treatment plan, goals, interventions, frequency, duration, follow-up schedule...

Available modalities:
- TENS (Transcutaneous Electrical Nerve Stimulation)
- US (Ultrasound therapy)
- Tecar therapy (Capacitive/Resistive diathermy)
- Infrared light therapy
- Shockwave therapy (Extracorporeal Shock Wave Therapy)

Include specific parameters, duration, and frequency for each modality used."
          />
          {!isReadOnly && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800 font-medium mb-2">💡 Treatment Modalities Available (click to add):</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'TENS', full: 'TENS (Transcutaneous Electrical Nerve Stimulation)' },
                  { label: 'US', full: 'US (Ultrasound therapy)' },
                  { label: 'Tecar', full: 'Tecar therapy (Capacitive/Resistive diathermy)' },
                  { label: 'Infrared', full: 'Infrared light therapy' },
                  { label: 'Shockwave', full: 'Shockwave therapy (Extracorporeal Shock Wave Therapy)' },
                ].map((modality) => {
                  const isAlreadyAdded = currentSOAP?.plan?.includes(modality.full) || false;
                  return (
                    <button
                      key={modality.label}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!currentSOAP) return;
                        const currentPlan = currentSOAP.plan || '';
                        // WO-MODALITY-CLINIC-001: insert under IN-CLINIC TREATMENT header
                        if (!isAlreadyAdded) {
                          const modalityLine = `- ${modality.full}`;
                          let updatedPlan: string;
                          const inClinicMatch = currentPlan.match(/IN-CLINIC TREATMENT[:\s]*/i);
                          if (inClinicMatch && inClinicMatch.index !== undefined) {
                            const headerEnd = currentPlan.indexOf('\n', inClinicMatch.index);
                            if (headerEnd !== -1) {
                              updatedPlan =
                                currentPlan.slice(0, headerEnd + 1) +
                                modalityLine + '\n' +
                                currentPlan.slice(headerEnd + 1);
                            } else {
                              updatedPlan = currentPlan + '\n' + modalityLine;
                            }
                          } else {
                            updatedPlan = currentPlan.trim()
                              ? `IN-CLINIC TREATMENT:\n${modalityLine}\n\n${currentPlan}`
                              : `IN-CLINIC TREATMENT:\n${modalityLine}`;
                          }
                          handleSectionChange('plan', updatedPlan);
                        }
                      }}
                      disabled={isAlreadyAdded}
                      className={`text-left px-2 py-1.5 rounded border transition cursor-pointer ${
                        isAlreadyAdded
                          ? 'bg-blue-200 border-blue-400 text-blue-800 cursor-not-allowed opacity-60'
                          : 'hover:bg-blue-100 border-transparent hover:border-blue-300 text-blue-700 active:bg-blue-200'
                      }`}
                      title={isAlreadyAdded ? 'Already added to plan' : `Click to add ${modality.label} to treatment plan`}
                    >
                      • {modality.full}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
        </div>
          </>
        )}

        {/* Optional sections (initial only; follow-up uses single block) */}
        {!showSingleBlock && (currentSOAP?.additionalNotes || currentSOAP?.followUp || currentSOAP?.precautions || currentSOAP?.referrals) && (
          <div className="pt-4 border-t border-slate-200 space-y-4">
            {currentSOAP.additionalNotes && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Additional Notes
                </label>
                <textarea
                  value={currentSOAP.additionalNotes}
                  onChange={(e) => handleSectionChange('additionalNotes', e.target.value)}
                  readOnly={isReadOnly}
                  rows={2}
                  className={`w-full rounded-lg border px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                    isReadOnly ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-200'
                  }`}
                />
              </div>
            )}
            {currentSOAP.followUp && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Follow-up
                </label>
                <textarea
                  value={currentSOAP.followUp}
                  onChange={(e) => handleSectionChange('followUp', e.target.value)}
                  readOnly={isReadOnly}
                  rows={2}
                  className={`w-full rounded-lg border px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                    isReadOnly ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-200'
                  }`}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panel de acciones al final: asegura que el fisio ha leído S/O/A/P antes de cerrar */}
      <div className="border-t border-slate-200 px-6 py-5 bg-slate-50/80 rounded-b-2xl">
        {/* Disclaimer / Export Info */}
        <div className={`mb-4 px-4 py-3 rounded-lg ${status === 'finalized' ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          {status === 'finalized' ? (
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-green-800 mb-1">
                  <strong>Session finalized.</strong> Your patient&apos;s data has been saved correctly.
                </p>
                <p className="text-xs text-green-700 mb-2">
                  This SOAP is ready for export. Use &quot;Copy to Clipboard&quot; or &quot;Download .txt&quot; for your EMR.
                </p>
                <p className="text-[10px] text-green-600">
                  EMR: the text is compatible with most systems. Paste (Ctrl+V / Cmd+V) in the note field.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                <strong>AI-Assisted Documentation:</strong> Review and edit all content before finalizing. The clinician is responsible for the accuracy and completeness of this note.
              </p>
            </div>
          )}
        </div>

        <h4 className="text-sm font-semibold text-slate-800 mb-3">Actions</h4>
        <div className="flex flex-wrap items-center gap-3">
          {status === 'draft' && (
            <>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </button>
              )}
              <button
                onClick={handleSaveDraft}
                disabled={!hasChanges}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Save className="w-3.5 h-3.5" />
                Save Draft
              </button>
              <button
                onClick={handlePreview}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                Vista previa
              </button>
              {onFinalize && (
                <button
                  onClick={handleFinalize}
                  className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-lg bg-gradient-success hover:bg-gradient-success-hover text-white text-[15px] font-medium shadow-sm transition font-apple"
                >
                  <CheckCircle className="w-4 h-4" />
                  Finalize & Save
                </button>
              )}
            </>
          )}
          {status === 'finalized' && currentSOAP && (
            <>
              {!isEditingFinalized ? (
                <>
                  <button
                    onClick={handleUnfinalize}
                    className="inline-flex items-center gap-2 px-4 py-2.5 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors min-w-[120px] justify-center"
                    title="Unfinalize to edit this note"
                  >
                    <FileText className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleCopyToClipboard}
                    className="inline-flex items-center gap-2 px-4 py-2.5 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors min-w-[160px] justify-center"
                    title="Copy to clipboard for pasting into your EMR"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadAsText}
                    className="inline-flex items-center gap-2 px-4 py-2.5 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors min-w-[160px] justify-center"
                    title="Download as text file"
                  >
                    <Download className="w-4 h-4" />
                    Download .txt
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="inline-flex items-center gap-2 px-4 py-2.5 h-10 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors justify-center"
                    title="Export PDF"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                  {onBackToCommandCenter && (
                    <button
                      onClick={onBackToCommandCenter}
                      className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-lg bg-gradient-to-r from-primary-blue to-primary-purple text-white text-[15px] font-medium shadow-sm hover:opacity-95 transition font-apple"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Back to Command Center
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={handleSaveAfterUnfinalize}
                    disabled={!hasChanges}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingFinalized(false);
                      setEditedSOAP(soap);
                      setHasChanges(false);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel Edit
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && currentSOAP && (
        <div 
          className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close if clicking on backdrop
            if (e.target === e.currentTarget) {
              handleClosePreview();
            }
          }}
        >
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-4">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">SOAP Note Preview</h3>
              <button
                onClick={handleClosePreview}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                aria-label="Close preview"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-xs text-amber-800">
                  <strong>Preview Mode:</strong> This is how your SOAP note will appear once finalized. Review all sections carefully before accepting.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="border-l-4 border-purple-300 pl-4">
                  <h4 className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">S: Subjective</h4>
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap border border-purple-100">
                    {currentSOAP.subjective || 'No content'}
                  </div>
                </div>
                
                <div className="border-l-4 border-blue-300 pl-4">
                  <h4 className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">O: Objective</h4>
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap border border-blue-100">
                    {currentSOAP.objective || 'No content'}
                  </div>
                </div>
                
                <div className="border-l-4 border-purple-400 pl-4">
                  <h4 className="text-sm font-semibold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">A: Assessment</h4>
                  <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap border border-purple-200">
                    {currentSOAP.assessment || 'No content'}
                  </div>
                </div>
                
                <div className="border-l-4 border-blue-400 pl-4">
                  <h4 className="text-sm font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">P: Plan</h4>
                  <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap border border-blue-200">
                    {currentSOAP.plan || 'No content'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={handleClosePreview}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Back to Edit
              </button>
              {onFinalize && (
                <button
                  onClick={() => {
                    handleClosePreview();
                    handleFinalize();
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-primary text-white text-sm font-medium hover:bg-gradient-primary-hover transition"
                >
                  Accept & Finalize
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Finalize Confirmation Modal */}
      {showFinalizeConfirm && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Finalize SOAP Note?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Once finalized, this SOAP note will be saved and marked as complete. You can still edit it, but it will require "unfinalizing" first.
            </p>
            
            {/* ✅ DÍA 2: CPO Review Checkbox - HTML5 required */}
            {requiresReview && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="reviewed-checkbox-finalize"
                    checked={isReviewed}
                    onChange={(e) => {
                      if (currentSOAP) {
                        setEditedSOAP({
                          ...currentSOAP,
                          isReviewed: e.target.checked,
                        });
                      }
                    }}
                    required={requiresReview}
                    className="mt-1 h-4 w-4 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500"
                  />
                  <span className="text-sm text-yellow-900">
                    I have reviewed and verified this SOAP note (CPO requirement)
                  </span>
                </label>
                {!isReviewed && (
                  <p className="text-xs text-yellow-700 mt-2 ml-6">
                    This checkbox is required before finalizing AI-generated SOAP notes.
                  </p>
                )}
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelFinalize}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalize}
                disabled={requiresReview && !isReviewed}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  requiresReview && !isReviewed
                    ? 'bg-gray-400 text-white cursor-not-allowed opacity-50'
                    : 'bg-gradient-primary text-white hover:bg-gradient-primary-hover'
                }`}
              >
                Finalize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WO-SOAP-FINALIZE-GATE-001: missing requirements modal */}
      {showMissingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Cannot finalize yet
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Please complete the following before finalizing:
            </p>
            <ul className="space-y-2 mb-6">
              {missingItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-bold">
                    !
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowMissingModal(false)}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              Back to editing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

