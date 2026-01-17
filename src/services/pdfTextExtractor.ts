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

/**
 * Extracts text content from a PDF file
 */
export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
    console.log(`[PDFExtractor] Starting extraction from: ${file.name}`);

    try {
        // ✅ Correct for pdfjs-dist 5.x in Vite: import the package entry
        const pdfjsLib: any = await import("pdfjs-dist");

        // ✅ Worker (bundled by Vite)
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                "pdfjs-dist/build/pdf.worker.min.mjs",
                import.meta.url
            ).toString();
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
