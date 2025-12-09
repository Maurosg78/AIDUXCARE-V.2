/**
 * Cloud Function: Process Imaging Report
 * ✅ WO-IR-02: Extract text from PDF and generate clinical summary
 * Compliance: PHIPA/PIPEDA - No PHI in logs
 * 
 * Note: JavaScript version for Firebase Functions compatibility
 */

const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const pdf = require('pdf-parse'); // ✅ v1.1.1 - direct function export
const { VertexAI } = require('@google-cloud/vertexai');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    storageBucket: 'aiduxcare-v2-uat-dev.firebasestorage.app',
  });
}

const db = admin.firestore();
// Ignora campos undefined al escribir en Firestore (previene errores de INVALID_ARGUMENT)
db.settings({ ignoreUndefinedProperties: true });
const storage = admin.storage();

const PROJECT = 'aiduxcare-v2-uat-dev';
const LOCATION = 'northamerica-northeast1';

/**
 * ✅ WO-IR-02: Extract text from PDF stored in Firebase Storage
 * Uses pdf-parse v1.1.1 which exports a direct function
 * Pattern validated in diagnose-pdf-extraction.js
 */
async function extractPDFText(storagePath) {
  try {
    console.log('[processImagingReport] Starting PDF extraction:', {
      storagePath: storagePath.substring(0, 80) + '...',
    });
    
    const bucket = storage.bucket(); // Uses default bucket: aiduxcare-v2-uat-dev.firebasestorage.app
    const file = bucket.file(storagePath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      console.error('[processImagingReport] PDF file does not exist in Storage:', {
        storagePath: storagePath.substring(0, 80) + '...',
      });
      return null;
    }

    console.log('[processImagingReport] PDF file exists, downloading...');
    
    // Download PDF into buffer
    const [pdfBuffer] = await file.download();
    console.log('[processImagingReport] PDF downloaded, buffer size:', pdfBuffer.length, 'bytes');

    // ✅ WO-IR-02: Use pdf-parse v1.1.1 direct function call (validated pattern)
    console.log('[processImagingReport] Parsing PDF buffer...');
    const pdfData = await pdf(pdfBuffer);
    
    if (!pdfData || typeof pdfData.text !== 'string') {
      console.error('[processImagingReport] pdfData.text is not a string:', {
        type: typeof pdfData?.text,
        pdfDataKeys: Object.keys(pdfData || {}),
      });
      return null;
    }

    const text = pdfData.text?.trim() || '';
    console.log('[processImagingReport] Text extracted, length:', text.length);

    // ✅ WO-IR-02: Mínimo de caracteres para considerarlo "texto real" (200 chars)
    if (text.length < 200) {
      console.warn('[processImagingReport] Text too short (<200 chars), likely scanned PDF:', {
        textLength: text.length,
        // Never log text preview (PHI)
      });
      return null;
    }

    console.log('[processImagingReport] PDF extraction successful, text length:', text.length);
    return text;
  } catch (error) {
    console.error('[processImagingReport] PDF extraction failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      storagePath: storagePath.substring(0, 50) + '...',
    });
    return null;
  }
}

/**
 * ✅ WO-IR-02: Normalize extracted text
 * Collapses excessive newlines, removes page numbers, normalizes whitespace
 */
function normalizePDFText(text, maxLength = 1500) {
  let normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')               // colapsar saltos excesivos
    .replace(/Page \d+ of \d+/gi, '')        // quitar footer de página
    .replace(/\s{2,}/g, ' ')                 // espacios múltiples
    .trim();

  if (normalized.length > maxLength) {
    normalized = normalized.substring(0, maxLength - 3) + '...';
  }

  return normalized;
}

/**
 * ✅ WO-IR-02: Infer body region from text (heurística mínima para demo)
 * MVP for demo: detect lumbar, cervical, knee, shoulder
 */
function inferBodyRegion(text) {
  if (!text) return null;

  const lower = text.toLowerCase();

  if (lower.includes('lumbar spine') || lower.includes('l4') || lower.includes('l5')) return 'Lumbar spine';
  if (lower.includes('cervical spine') || lower.includes('c3') || lower.includes('c4')) return 'Cervical spine';
  if (lower.includes('knee')) return 'Knee';
  if (lower.includes('shoulder')) return 'Shoulder';

  return null; // Return null instead of 'unspecified' for cleaner data
}

/**
 * ✅ WO-IMAGING-EXTRACTION-V1: Infer side from text
 */
function inferSide(text) {
  const t = text.toLowerCase();

  if (t.includes('bilateral')) return 'bilateral';
  if (t.includes('right')) return 'right';
  if (t.includes('left')) return 'left';
  return 'unspecified';
}

/**
 * ✅ WO-IMAGING-EXTRACTION-V1: Infer study year from text
 */
function inferStudyYear(text) {
  const match = text.match(/\b(20[0-3]\d|19[8-9]\d)\b/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * ✅ WO-IR-02: Infer modality from text (fallback if not provided)
 * MVP for demo: basic detection of MRI, CT, XR
 */
function inferModality(text, providedModality) {
  if (providedModality) {
    return providedModality;
  }

  if (!text) return null;

  const lower = text.toLowerCase();
  
  if (lower.includes('mri')) return 'MRI';
  if (lower.includes('ct ') || lower.includes('computed tomography')) return 'CT';
  if (lower.includes('x-ray') || lower.includes('radiograph')) return 'XR';
  
  return null; // Return null instead of 'unspecified' for cleaner data
}

/**
 * ✅ WO-IMAGING-EXTRACTION-V1: Generate clinical summary using Vertex AI
 * Returns concise, EMR-ready summary (max 4 sentences, ≤900 chars)
 */
async function generateSummary(reportText) {
  const prompt = `You are a clinical imaging summarizer for Canadian physiotherapists (CPO/CAPR). 
Input is an imaging report (MRI/CT/X-ray). 
Output a concise, EMR-ready summary (max 4 sentences, ≤700 characters) focusing on:
- spinal level(s) or joint(s) involved
- side (left/right/bilateral)
- nerve root or structure contact/impingement
- severity (mild/moderate/severe)

Do NOT add diagnosis labels not present in the report. 
Do NOT give treatment advice. 
Use en-CA.

Report text:
${reportText.substring(0, 800)}

Summary:`;

  try {
    // Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: PROJECT,
      location: LOCATION,
    });

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.3,
      },
    });

    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.warn('[processImagingReport] Vertex AI returned empty summary');
      return null;
    }

    let summary = text.trim();
    
    // Remove JSON wrapping if present
    if (summary.startsWith('{') || summary.startsWith('[')) {
      try {
        const parsed = JSON.parse(summary);
        summary = typeof parsed === 'string' ? parsed : parsed.summary || summary;
      } catch {
        // Not JSON, use as-is
      }
    }

    // Hard limit
    if (summary.length > 900) {
      summary = summary.substring(0, 900 - 3) + '...';
    }

    return summary;
  } catch (error) {
    console.error('[processImagingReport] Summarization failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      // Never log reportText (PHI)
    });
    return null;
  }
}

/**
 * ✅ WO-IR-02: Cloud Function
 * HTTP onCall function for processing imaging reports
 * Extracts text, generates summary, infers metadata
 */
exports.processImagingReport = functions
  .region(LOCATION)
  .https.onCall(async (data, context) => {
    // ✅ WO-IMAGING-EXTRACTION-V1: Allow testing in emulator mode without authentication
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.FIRESTORE_EMULATOR_HOST;
    const userId = context.auth ? context.auth.uid : (data.userId || 'test-user-emulator');

    if (!isEmulator && !context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { patientId, episodeId, fileStoragePath, modality, bodyRegion } = data;

    // Validate required fields
    if (!patientId || !fileStoragePath) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields: patientId, fileStoragePath'
      );
    }

    console.log('[processImagingReport] Starting processing:', {
      patientId: patientId.substring(0, 10) + '...', // Truncate for logs
      episodeId: episodeId || 'none',
      storagePath: fileStoragePath.substring(0, 80) + '...',
      modality: modality || 'unknown',
      // Never log full patientId or storagePath (PHI)
    });

    try {
      // Step 1: Extract text from PDF
      const rawText = await extractPDFText(fileStoragePath);
      const extractedTextLength = rawText ? rawText.length : 0;
      
      console.log('[processImagingReport] PDF extraction completed:', {
        extractedTextLength,
        hasText: rawText !== null,
      });
      
      // Step 2: Normalize text if extracted
      const normalizedText = rawText ? normalizePDFText(rawText, 1500) : null;
      const normalizedTextLength = normalizedText ? normalizedText.length : 0;
      
      // Step 3: Generate summary if text exists
      let aiSummary = null;
      if (normalizedText) {
        aiSummary = await generateSummary(normalizedText);
        const summaryLength = aiSummary ? aiSummary.length : 0;
        
        console.log('[processImagingReport] Summary generation completed:', {
          summaryLength,
          hasSummary: aiSummary !== null,
        });
      } else {
        console.log('[processImagingReport] No text extracted, skipping summarization');
      }
      
      // Step 4: Infer additional fields from text
      // ✅ WO-IR-02: Use inferred metadata if text exists, otherwise use provided values
      let inferredModality = null;
      let inferredBodyRegion = null;
      
      if (normalizedText) {
        inferredModality = inferModality(normalizedText, modality);
        inferredBodyRegion = inferBodyRegion(normalizedText);
      } else {
        inferredModality = modality || null;
        inferredBodyRegion = bodyRegion || null;
      }
      
      const inferredSide = normalizedText ? inferSide(normalizedText) : null;
      const inferredStudyYear = normalizedText ? inferStudyYear(normalizedText) : null;
      
      console.log('[processImagingReport] Inferred fields:', {
        modality: inferredModality || 'null',
        bodyRegion: inferredBodyRegion || 'null',
        side: inferredSide || 'null',
        studyYear: inferredStudyYear || 'null',
      });
      
      // Step 5: Create ImagingReport document
      const reportId = db.collection('imaging_reports').doc().id;
      
      // ✅ WO-IMAGING-EXTRACTION-V1: Build document with all fields
      const report = {
        id: reportId,
        patientId,
        episodeId: episodeId || null,
        storagePath: fileStoragePath,
        source: 'upload',
        language: 'en',
        createdAt: new Date().toISOString(),
        createdBy: userId,
        isScanned: rawText === null, // ✅ Flag for scanned PDFs
        modality: inferredModality,
        bodyRegion: inferredBodyRegion,
        side: inferredSide,
        studyYear: inferredStudyYear,
      };
      
      // Only include optional fields if they have values
      if (normalizedText) {
        report.rawText = normalizedText;
      }
      if (aiSummary) {
        report.aiSummary = aiSummary;
      }
      
      // ✅ WO-IMAGING-EXTRACTION-V1: Remove any undefined fields (Firestore doesn't accept undefined)
      Object.keys(report).forEach((key) => {
        if (report[key] === undefined) {
          delete report[key];
        }
      });
      
      // Step 6: Save to Firestore
      const docRef = db.collection('imaging_reports').doc(reportId);
      
      console.log('[processImagingReport] Writing imaging_reports doc:', {
        reportId,
        hasRawText: !!normalizedText,
        hasAiSummary: !!aiSummary,
        rawTextLength: normalizedText ? normalizedText.length : 0,
        aiSummaryLength: aiSummary ? aiSummary.length : 0,
        isScanned: report.isScanned,
        modality: report.modality,
        bodyRegion: report.bodyRegion,
      });
      
      await docRef.set(report, { merge: false });
      
      console.log('[processImagingReport] Saved imaging report:', {
        reportId,
        hasRawText: !!normalizedText,
        hasAiSummary: !!aiSummary,
      });
      
      return {
        success: true,
        report: {
          id: reportId,
          patientId,
          episodeId: episodeId || null,
          storagePath: fileStoragePath,
          rawText: normalizedText || null,
          aiSummary: aiSummary || null,
          isScanned: report.isScanned,
          modality: report.modality,
          bodyRegion: report.bodyRegion,
          side: report.side,
          studyYear: report.studyYear,
        },
      };
    } catch (error) {
      console.error('[processImagingReport] Processing failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        // Never log patientId, storagePath, or text content (PHI)
      });
      
      throw new functions.https.HttpsError(
        'internal',
        'Failed to process imaging report',
        { originalError: error.message }
      );
    }
  });
