/**
 * PDF Text Extractor Service
 *
 * Extracts text content from PDF files using pdfjs-dist library.
 * Used for processing clinical attachments (MRI reports, lab results, etc.)
 *
 * WO-PDF-001: Phase 1 - PDF Processing Implementation
 */

import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

export interface PDFExtractionResult {
    text: string;
    pageCount: number;
    metadata?: {
        title?: string;
        author?: string;
        subject?: string;
        keywords?: string;
        creationDate?: string;
    };
    error?: string;
}

export const SCANNED_PDF_ERROR = "No text could be extracted. PDF may be scanned (image-based) or password-protected.";

/**
 * Renders PDF pages as base64 PNG strings for OCR fallback.
 * Only available in browser context (requires document/canvas).
 */
export async function renderPDFPagesAsBase64(file: File, maxPages = 5): Promise<string[]> {
    if (typeof document === 'undefined') return [];

    const pdfjsModule = await import('pdfjs-dist');
    const pdfjsLib: any = pdfjsModule;
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

    const fileBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
    const pdf = await loadingTask.promise;

    const pagesToProcess = Math.min(pdf.numPages, maxPages);
    const pages: string[] = [];

    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for better OCR quality

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d')!;

        await page.render({ canvasContext: context, viewport }).promise;

        const base64 = canvas.toDataURL('image/png').split(',')[1];
        pages.push(base64);

        // Release pdfjs page resources after rendering
        page.cleanup();
        canvas.width = 0;
        canvas.height = 0;
    }

    return pages;
}

/**
 * Validates if a file is a PDF
 */
export function isValidPDF(file: File): boolean {
    const byMime = file.type === "application/pdf";
    const byName = file.name.toLowerCase().endsWith(".pdf");
    const isPdf = byMime || byName;
    return isPdf;
}

/**
 * Extracts text content from a PDF file
 */
export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
    const fileLabel = file.name;
    console.log("[PDFExtractor] START", fileLabel);
    console.log(`[PDFExtractor] Starting extraction from: ${fileLabel}`);

    try {
        const pdfjsModule = await import("pdfjs-dist");
        const pdfjsLib: any = pdfjsModule;
        const workerUrlForLib = pdfWorkerSrc;
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrlForLib;

        const fileBuffer = await file.arrayBuffer();

        console.log("[PDF] workerSrc =", pdfjsLib.GlobalWorkerOptions.workerSrc);
        console.log("[PDFExtractor] Before getDocument");

        const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
        const pdf = await loadingTask.promise;

        console.log("[PDFExtractor] Document loaded");
        console.log(`[PDFExtractor] PDF loaded: ${pdf.numPages} pages`);

        const textParts: string[] = [];
        const maxPages = 50;
        const totalPages = pdf.numPages;
        const pagesToProcess = Math.min(totalPages, maxPages);

        for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            const items = textContent.items || [];
            const pageText = items
                .map((item: any) => item?.str ?? "")
                .join(" ")
                .trim();

            if (pageText) {
                textParts.push(pageText);
            }
        }

        if (totalPages > maxPages) {
            const note = `\n[NOTE: PDF has ${totalPages} pages, only first ${maxPages} processed]`;
            textParts.push(note);
        }

        const extractedText = textParts.join("\n\n");
        const trimmedText = extractedText.trim();
        const hasText = trimmedText.length > 0;

        if (!hasText) {
            return {
                text: "",
                pageCount: totalPages,
                error: SCANNED_PDF_ERROR,
            };
        }

        console.log(`[PDFExtractor] ✅ Extracted ${extractedText.length} characters from ${totalPages} pages`);
        console.log("[PDFExtractor] Extraction finished");

        return {
            text: extractedText,
            pageCount: totalPages,
        };
    } catch (error) {
        console.error("[PDFExtractor] ERROR", error);
        console.error("[PDFExtractor] Error extracting PDF:", error);
        const message = error instanceof Error ? error.message : String(error);

        return {
            text: "",
            pageCount: 0,
            error: `PDF extraction failed: ${message}`,
        };
    }
}
