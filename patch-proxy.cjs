const fs = require('fs');
const f = process.argv[2] || 'functions/index.js';
let code = fs.readFileSync(f, 'utf8');

const target = `    if (action !== 'analyze') {
      return res.status(400).json({ ok: false, error: 'unsupported_action', action });
    }`;

const replacement = `    // WO-IMAGE-OCR-001: Gemini Vision OCR
    if (action === 'image-ocr') {
      const { image, prompt: ocrPrompt } = req.body || {};
      if (!image || !image.data || !image.mimeType) {
        return res.status(400).json({ ok: false, error: 'missing_image' });
      }
      const cl = await auth.getClient();
      const tk = await cl.getAccessToken();
      const at = tk && tk.token ? tk.token : tk;
      const ocrPayload = {
        contents: [{ role: 'user', parts: [
          { inlineData: { mimeType: image.mimeType, data: image.data } },
          { text: ocrPrompt || 'Extract ALL text from this medical document exactly as written. Return only the extracted text.' }
        ]}],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
      };
      const r2 = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + at, 'Content-Type': 'application/json' },
        body: JSON.stringify(ocrPayload)
      });
      const d2 = await r2.json();
      const extracted = (d2 && d2.candidates && d2.candidates[0] && d2.candidates[0].content && d2.candidates[0].content.parts && d2.candidates[0].content.parts[0] && d2.candidates[0].content.parts[0].text) || '';
      if (!extracted.trim()) return res.status(422).json({ ok: false, error: 'empty_ocr_result' });
      return res.status(200).json({ ok: true, signature: 'vertexAIProxy@v1', action: 'image-ocr', text: extracted });
    }
    if (action !== 'analyze') {
      return res.status(400).json({ ok: false, error: 'unsupported_action', action });
    }`;

if (!code.includes(target)) {
  console.error('TARGET NOT FOUND - check functions/index.js manually');
  process.exit(1);
}

fs.writeFileSync(f, code.replace(target, replacement));
console.log('OK - image-ocr block inserted into ' + f);
