import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { FileProcessorService, ProcessedFile } from './FileProcessorService';

export interface ClinicalAttachment {
  id: string;
  name: string;
  size: number;
  contentType: string | null;
  storagePath: string;
  downloadURL: string;
  uploadedAt: string;
  // PDF processing fields
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
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB per attachment
const ALLOWED_MIME_PREFIXES = ['image/', 'application/pdf', 'text/'];
const ATTACHMENT_ROOT = 'clinical-attachments';

const isMimeAllowed = (mime: string | null) => {
  if (!mime) return true; // allow unknown types but we still enforce size
  return ALLOWED_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
};

export class ClinicalAttachmentService {
  static async upload(file: File, userId: string): Promise<ClinicalAttachment> {
    if (!file) {
      throw new Error('No file provided for upload');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error('Attachment exceeds the 25 MB limit. Compress or split the file.');
    }

    if (!isMimeAllowed(file.type)) {
      throw new Error('Unsupported file type. Allowed: images, PDF, plain/text documents.');
    }

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const attachmentId = crypto.randomUUID();
    const storagePath = `${ATTACHMENT_ROOT}/${userId}/${timestamp}-${attachmentId}-${safeName}`;

    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || 'application/octet-stream',
      customMetadata: {
        originalName: file.name,
        uploadedBy: userId,
        uploadedAt: new Date(timestamp).toISOString(),
      },
    });

    const downloadURL = await getDownloadURL(snapshot.ref);

    // Process file to extract text (PDFs, images, text files)
    let processedFile: ProcessedFile;
    try {
      processedFile = await FileProcessorService.processFile(file, downloadURL);
      console.log(`[ClinicalAttachment] ✅ File processed successfully: ${file.name}`);
    } catch (error) {
      console.error(`[ClinicalAttachment] Error processing file:`, error);
      // Continue with upload even if processing fails
      processedFile = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        downloadURL,
        error: error instanceof Error ? error.message : 'Processing failed',
      };
    }

    return {
      id: attachmentId,
      name: file.name,
      size: file.size,
      contentType: file.type || null,
      storagePath,
      downloadURL,
      uploadedAt: new Date(timestamp).toISOString(),
      // Include processed fields
      extractedText: processedFile.extractedText,
      pageCount: processedFile.pageCount,
      metadata: processedFile.metadata,
      error: processedFile.error,
    };
  }

  static async delete(storagePath: string): Promise<void> {
    if (!storagePath) return;
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  }
}

export default ClinicalAttachmentService;
