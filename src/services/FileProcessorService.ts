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

export class FileProcessorService {
  /**
   * Procesa un archivo y extrae información relevante
   * @param file - Archivo a procesar
   * @param downloadURL - URL de descarga del archivo en Firebase Storage
   * @returns Información estructurada del archivo procesado
   */
  static async processFile(
    file: File,
    downloadURL: string
  ): Promise<ProcessedFile> {
    const baseResult: ProcessedFile = {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      downloadURL,
    };

    console.log(`[FileProcessor] Processing: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    // Procesar PDFs
    if (isValidPDF(file)) {
      try {
        console.log(`[FileProcessor] 📄 Extracting text from PDF: ${file.name}`);
        
        const pdfResult = await extractTextFromPDF(file);
        
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
        console.error(`[FileProcessor] Error processing PDF:`, error);
        return {
        ...baseResult,
          error: error instanceof Error ? error.message : 'PDF processing failed',
        };
      }
    }

    // Procesar imágenes (placeholder por ahora)
    if (file.type.startsWith('image/')) {
      console.log(`[FileProcessor] 📷 Image uploaded: ${file.name}`);
      return {
        ...baseResult,
        extractedText: `[Image: ${file.name}]\nDescribe relevant visual findings when reviewing this case.`,
      };
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
}
