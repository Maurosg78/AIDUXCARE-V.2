import React from 'react';
import { X, FileText, AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';
import type { ClinicalAttachment } from '../services/clinicalAttachmentService';
import { safeLogger } from '../utils/safeLogger';

interface ClinicalAttachmentCardProps {
  attachment: ClinicalAttachment;
  onDelete?: () => void;
  isRemoving?: boolean;
  onToggleReviewedToday?: () => void;
  reviewedTodayLabel?: string;
  extractedTextLabel?: string;
  extractedContentPreviewLabel?: string;
  extractionFailedLabel?: string;
  extractionFallbackLabel?: string;
  processingFileLabel?: string;
  extractingPdfLabel?: string;
  analyzingImageLabel?: string;
  readingFileLabel?: string;
  viewDownloadLabel?: string;
}

export function ClinicalAttachmentCard({ 
  attachment, 
  onDelete,
  isRemoving = false,
  onToggleReviewedToday,
  reviewedTodayLabel = 'Reviewed today',
  extractedTextLabel = 'Texto extraído',
  extractedContentPreviewLabel = 'Vista previa del contenido extraído',
  extractionFailedLabel = 'No se pudo extraer texto',
  extractionFallbackLabel = 'El archivo se subió, pero su contenido no pudo analizarse automáticamente',
  processingFileLabel = 'Procesando archivo...',
  extractingPdfLabel = 'Extrayendo texto del PDF',
  analyzingImageLabel = 'Analizando contenido de la imagen',
  readingFileLabel = 'Leyendo contenido del archivo',
  viewDownloadLabel = 'Ver o descargar',
}: ClinicalAttachmentCardProps) {
  // WO-PDF-STUCK-001: instrumental logs (temporary)
  if (attachment.processingComplete !== true && !attachment.extractedText && !attachment.error) {
    const attachmentExtension = attachment.name.split('.').pop() ?? 'unknown';
    const attachmentSizeBytes = attachment.size;
    safeLogger.fileProcessed(attachmentExtension, attachmentSizeBytes, 'attachment_upload_triggered');
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const isVisualReferenceOnly = attachment.clinicalContextStatus === 'visual_reference_only';
  const hasSuspectedPatientMismatch = attachment.patientIdentityStatus === 'suspected_mismatch';

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 text-sm truncate font-apple">
              {attachment.name}
            </p>
            <p className="text-xs text-slate-500 font-apple font-light">
              {formatSize(attachment.size)}
              {attachment.pageCount && ` • ${attachment.pageCount} page${attachment.pageCount > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            disabled={isRemoving}
            className="text-slate-400 hover:text-red-600 text-sm p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Extraction Status */}
      {attachment.extractedText && (
        <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-xs font-medium text-green-800 font-apple">
              {extractedTextLabel}: {attachment.extractedText.length.toLocaleString()} caracteres
            </p>
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-green-700 hover:text-green-900 font-apple font-light">
              {extractedContentPreviewLabel}
            </summary>
            <pre className="mt-2 text-xs text-slate-700 bg-white p-2 rounded border border-green-200 max-h-40 overflow-y-auto whitespace-pre-wrap font-mono font-apple">
              {attachment.extractedText.substring(0, 500)}
              {attachment.extractedText.length > 500 && '\n\n... (truncated)'}
            </pre>
          </details>
        </div>
      )}

      {hasSuspectedPatientMismatch && (
        <div className="mt-3 p-3 bg-amber-50 rounded-md border border-amber-300">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-amber-800 font-apple">
                Este documento parece pertenecer a otro paciente o no coincide con el paciente activo. Confirma manualmente antes de usarlo en el análisis clínico.
              </p>
              {onToggleReviewedToday && (
                <button
                  type="button"
                  onClick={onToggleReviewedToday}
                  className="mt-2 rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
                >
                  Confirmar que corresponde al paciente
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isVisualReferenceOnly && (
        <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-800 font-apple">
                Referencia visual guardada
              </p>
              {attachment.error && (
                <p className="text-xs text-blue-700 mt-1 font-apple font-light">
                  {attachment.error}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {attachment.error && !isVisualReferenceOnly && (
        <div className="mt-3 p-3 bg-yellow-50 rounded-md border border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-yellow-800 font-apple">
                ⚠️ {extractionFailedLabel}
              </p>
              <p className="text-xs text-yellow-700 mt-1 font-apple font-light">
                {attachment.error}
              </p>
              <p className="text-xs text-yellow-600 mt-1 font-apple font-light">
                {extractionFallbackLabel}
              </p>
            </div>
          </div>
        </div>
      )}

      {attachment.processingComplete !== true && !attachment.extractedText && !attachment.error && (
        <>
          {console.log("[AttachmentCard] Setting status = processing")}
          <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-800 font-apple">
                {processingFileLabel}
              </p>
              <p className="text-xs text-blue-700 mt-0.5 font-apple font-light">
                {attachment.contentType?.includes('pdf') 
                  ? extractingPdfLabel
                  : attachment.contentType?.startsWith('image/')
                  ? analyzingImageLabel
                  : readingFileLabel}
              </p>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Download Link */}
      <div className="mt-3 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a
            href={attachment.downloadURL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-blue hover:text-primary-blue-hover font-apple font-medium inline-flex items-center gap-1"
          >
            {viewDownloadLabel} →
          </a>
          {onToggleReviewedToday && !hasSuspectedPatientMismatch && (
            <label className="inline-flex items-center gap-2 text-xs text-slate-600 font-apple font-light cursor-pointer">
              <input
                type="checkbox"
                checked={attachment.reviewedToday === true}
                onChange={onToggleReviewedToday}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span>{reviewedTodayLabel}</span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
