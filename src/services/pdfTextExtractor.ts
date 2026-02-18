/**
 * PDF Text Extractor Service
 *
 * Extracts text content from PDF files using pdfjs-dist library.
 * Used for processing clinical attachments (MRI reports, lab results, etc.)
 *
 * WO-PDF-001: Phase 1 - PDF Processing Implementation
 */

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

/**
 * Validates if a file is a PDF
 */
export function isValidPDF(file: File): boolean {
    return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

const PDF_EXTRACTION_TIMEOUT_MS = 30_000; // 30s max to avoid infinite loading

/**
 * Extracts text content from a PDF file
 * WO-PDF-002: Timeout + CDN worker fallback for production (fixes "PDFs stuck loading")
 */
export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
    console.log(`[PDFExtractor] Starting extraction from: ${file.name}`);

    const extractWithTimeout = async (): Promise<PDFExtractionResult> => {
        const pdfjsLib: any = await import("pdfjs-dist");

        // ✅ WO-PDF-002: Worker for production - Vite ?url (bundled) or CDN fallback
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            try {
                const workerModule = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
                pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
            } catch {
                const version = (pdfjsLib as { version?: string }).version || "5.4.530";
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
            }
        }

        const arrayBuffer = await file.arrayBuffer();

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        console.log(`[PDFExtractor] PDF loaded: ${pdf.numPages} pages`);

        const metadata = await pdf.getMetadata().catch(() => null);
        const metadataObj = metadata?.info
            ? {
                title: metadata.info.Title,
                author: metadata.info.Author,
                subject: metadata.info.Subject,
                keywords: metadata.info.Keywords,
                creationDate: metadata.info.CreationDate,
            }
            : undefined;

        const textParts: string[] = [];
        const maxPages = 50;
        const pagesToProcess = Math.min(pdf.numPages, maxPages);

        for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            const pageText = (textContent.items || [])
                .map((item: any) => item?.str ?? "")
                .join(" ")
                .trim();

            if (pageText) textParts.push(pageText);
        }

        if (pdf.numPages > maxPages) {
            textParts.push(`\n[NOTE: PDF has ${pdf.numPages} pages, only first ${maxPages} processed]`);
        }

        const extractedText = textParts.join("\n\n");

        if (!extractedText.trim()) {
            return {
                text: "",
                pageCount: pdf.numPages,
                metadata: metadataObj,
                error: "No text could be extracted. PDF may be scanned (image-based) or password-protected.",
            };
        }

        console.log(`[PDFExtractor] ✅ Extracted ${extractedText.length} characters from ${pdf.numPages} pages`);

        return {
            text: extractedText,
            pageCount: pdf.numPages,
            metadata: metadataObj,
        };
    };

    try {
        const timeoutPromise = new Promise<PDFExtractionResult>((_, reject) =>
            setTimeout(() => reject(new Error("PDF extraction timed out (30s). File may be too large or complex.")), PDF_EXTRACTION_TIMEOUT_MS)
        );
        return await Promise.race([extractWithTimeout(), timeoutPromise]);
    } catch (error) {
        console.error("[PDFExtractor] Error extracting PDF:", error);
        const message = error instanceof Error ? error.message : String(error);

        return {
            text: "",
            pageCount: 0,
            error: `PDF extraction failed: ${message}`,
        };
    }
}
