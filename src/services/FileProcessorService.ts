import { extractTextFromPDF, isValidPDF } from './pdfTextExtractor';

export interface ProcessedFile {
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedText?: string;
  pageCount?: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: string;
  };
  error?: string;
  downloadURL: string;
}

// WO-IMAGE-OCR-001: Gemini Vision OCR configuration
const getEnv = (): Record<string, string> => {
  // Guarded access for SSR / non-browser contexts
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env as unknown as Record<string, string>;
  }
  return {};
};

const env = getEnv();

// Use same proxy function as the rest of the app (vertexAIProxy)
const VERTEX_PROXY_URL =
  env.VITE_VERTEX_PROXY_URL ||
  'https://northamerica-northeast1-aiduxcare-v2-uat-dev.cloudfunctions.net/vertexAIProxy';

// Reuse assistant model configuration (defaults to Gemini 2.5 Flash)
const GEMINI_OCR_MODEL = env.VITE_AIDUX_ASSISTANT_MODEL || 'gemini-2.5-flash';

// Prompt tailored for strict OCR behaviour (no summarization/commentary)
const IMAGE_OCR_PROMPT =
  'You are a medical document OCR system. Extract ALL text from this medical image exactly as written. ' +
  'Include all findings, measurements, diagnoses, and clinical data. Return only the extracted text, no commentary.';

export class FileProcessorService {
  /**
   * Procesa un archivo y extrae información relevante
   * @param file - Archivo a procesar
   * @param downloadURL - URL de descarga del archivo en Firebase Storage
   * @returns Información estructurada del archivo procesado
   */
  static async processFile(
    file: File,
    downloadURL: string = ''
  ): Promise<ProcessedFile> {
    const baseResult: ProcessedFile = {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      downloadURL,
    };

    console.log("[FileProcessor] START", file.name, file.type);
    console.log(`[FileProcessor] Processing: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    // Procesar PDFs
    console.log("[FileProcessor] Checking PDF branch", file.type);
    if (isValidPDF(file)) {
      try {
        console.log("[FileProcessor] Entering PDF branch");
        console.log(`[FileProcessor] 📄 Extracting text from PDF: ${file.name}`);
        
        const pdfResult = await extractTextFromPDF(file);
        console.log("[FileProcessor] PDF extraction resolved");
        
        if (pdfResult.error) {
          console.error(`[FileProcessor] PDF extraction error:`, pdfResult.error);
          return {
            ...baseResult,
            error: pdfResult.error,
          };
        }
        
        // Limitar texto extraído para prevenir prompts muy largos
        const MAX_TEXT_LENGTH = 15000; // ~15k caracteres (balance entre detalle y costo)
        let processedText = pdfResult.text;
        
        if (processedText.length > MAX_TEXT_LENGTH) {
          processedText = processedText.substring(0, MAX_TEXT_LENGTH);
          processedText += `\n\n[NOTE: Text truncated. Original length: ${pdfResult.text.length} characters]`;
          console.warn(`[FileProcessor] Text truncated: ${pdfResult.text.length} → ${MAX_TEXT_LENGTH} chars`);
        }
      
        console.log(
          `[FileProcessor] ✅ Extracted ${processedText.length} characters from ${pdfResult.pageCount} pages`
        );
        
        return {
          ...baseResult,
          extractedText: processedText,
          pageCount: pdfResult.pageCount,
          metadata: pdfResult.metadata,
        };
      } catch (error) {
        console.error("[FileProcessor] ERROR", error);
        console.error(`[FileProcessor] Error processing PDF:`, error);
        return {
        ...baseResult,
          error: error instanceof Error ? error.message : 'PDF processing failed',
        };
      }
    }

    // Procesar imágenes con OCR vía Gemini Vision
    if (file.type.startsWith('image/')) {
      console.log(`[FileProcessor] 📷 Image uploaded: ${file.name}`);
      try {
        const ocrText = await FileProcessorService.extractImageTextWithGemini(file);

        // Limitar texto extraído para prevenir prompts muy largos (mismo límite que PDFs)
        const MAX_TEXT_LENGTH = 15000;
        let processedText = ocrText;

        if (processedText.length > MAX_TEXT_LENGTH) {
          const originalLength = processedText.length;
          processedText = processedText.substring(0, MAX_TEXT_LENGTH);
          processedText += `\n\n[NOTE: Image OCR text truncated. Original length: ${originalLength} characters]`;
          console.warn(
            `[FileProcessor] Image OCR text truncated: ${originalLength} → ${MAX_TEXT_LENGTH} chars`,
          );
        }

        return {
          ...baseResult,
          extractedText: processedText,
        };
      } catch (error) {
        console.error('[FileProcessor] Image OCR failed', error);
        return {
          ...baseResult,
          error:
            error instanceof Error
              ? `Image OCR failed: ${error.message}`
              : 'Image OCR failed due to an unknown error',
        };
      }
    }

    // Procesar archivos de texto
    if (file.type.includes('text') || file.name.endsWith('.txt')) {
      try {
        const text = await file.text();
        console.log(`[FileProcessor] 📝 Text file processed: ${file.name}`);
        return {
          ...baseResult,
          extractedText: text,
        };
      } catch (error) {
        console.error(`[FileProcessor] Error reading text file:`, error);
        return {
          ...baseResult,
          error: 'Failed to read text file',
        };
      }
    }

    // Otros tipos de archivo (sin procesamiento específico)
    console.log(`[FileProcessor] 📎 File uploaded without text extraction: ${file.name}`);
    return baseResult;
  }

  /**
   * Valida si un archivo puede ser procesado
   */
  static canProcess(file: File): boolean {
    return (
      isValidPDF(file) ||
      file.type.startsWith('image/') ||
      file.type.includes('text/')
    );
  }

  /**
   * Obtiene tipo de procesamiento para un archivo
   */
  static getProcessingType(file: File): 'pdf' | 'image' | 'text' | 'other' {
    if (isValidPDF(file)) return 'pdf';
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.includes('text/')) return 'text';
    return 'other';
  }

  /**
   * WO-IMAGE-OCR-001: Call Vertex AI (Gemini) via vertexAIProxy to perform OCR on medical images.
   * Sends the image as base64 and uses a strict OCR prompt to obtain raw extracted text.
   */
  private static async extractImageTextWithGemini(file: File): Promise<string> {
    // Convert image file to base64 for transport
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');

    const payload = {
      action: 'image-ocr' as const,
      model: GEMINI_OCR_MODEL,
      prompt: IMAGE_OCR_PROMPT,
      image: {
        mimeType: file.type || 'image/*',
        data: base64Data,
      },
    };

    const response = await fetch(VERTEX_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`vertexAIProxy image-ocr HTTP ${response.status}: ${text}`);
    }

    const data: any = await response.json();
    const extracted = FileProcessorService.extractTextFieldFromVertexResponse(data);

    if (!extracted || !extracted.trim()) {
      throw new Error('Empty OCR result from Gemini Vision');
    }

    return extracted.trim();
  }

  /**
   * Helper para normalizar respuestas de Gemini / Vertex AI, reusando el patrón de vertex-ai-service-firebase.
   */
  private static extractTextFieldFromVertexResponse(data: any): string | null {
    if (!data) return null;
    if (typeof data === 'string') return data;
    if (typeof data.text === 'string') return data.text;
    if (typeof data.summary === 'string') return data.summary;
    if (typeof data.summaryText === 'string') return data.summaryText;
    if (typeof data.answer === 'string') return data.answer;
    if (typeof data.answerText === 'string') return data.answerText;
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    return null;
  }
}
