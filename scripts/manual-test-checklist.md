# PDF Processing Manual Test Checklist

## Test Case: Matt Proctor MRI Report

### Setup (2 min)
- [ ] Dev server running: `pnpm dev`
- [ ] Browser DevTools open (Cmd+Option+J)
- [ ] Network tab monitoring requests
- [ ] Console tab for logs

### Upload PDF (3 min)
1. [ ] Navigate to workflow page
2. [ ] Click "Upload Clinical Document" or similar
3. [ ] Select test PDF file
4. [ ] Verify upload progress indicator shows
5. [ ] Wait for upload completion

**Expected Console Logs:**
```
[ClinicalAttachment] Starting upload: matt-proctor-mri.pdf
[FileProcessor] 📄 Extracting text from PDF: matt-proctor-mri.pdf
[PDFExtractor] Starting extraction for: matt-proctor-mri.pdf
[PDFExtractor] PDF loaded: 1 pages
[PDFExtractor] Page 1/1 processed: XXX chars
[PDFExtractor] ✅ Extraction complete: XXX total characters
[FileProcessor] ✅ Extracted XXX characters from 1 pages
[ClinicalAttachment] ✅ File processed successfully
[ClinicalAttachment] ✅ Upload complete
```

### Verify Extraction (2 min)
- [ ] Check console logs show extracted character count
- [ ] No error messages in console
- [ ] PDF appears in attachments list in UI
- [ ] File name displayed correctly
- [ ] File size shown
- [ ] Extracted text preview visible (if implemented)

### Generate SOAP Note (5 min)
1. [ ] Add patient transcript (symptoms: "Low back pain radiating to left leg")
2. [ ] Select relevant physical tests
3. [ ] Click "Analyze" or "Generate SOAP"
4. [ ] Wait for AI processing

**Expected Console Logs:**
```
[NiagaraProcessor] Including 1 attachments in prompt
  - matt-proctor-mri.pdf: XXX chars
[VertexAI] Prompt length: XXXX characters
```

### Validate AI Analysis (10 min)
**CRITICAL: Verify AI detected these 5 findings:**

- [ ] **Finding 1:** Severe central canal stenosis at L4-L5
- [ ] **Finding 2:** Posterior disc extrusion
- [ ] **Finding 3:** Thecal sac compression
- [ ] **Finding 4:** Foraminal stenosis
- [ ] **Finding 5:** Mass effect on nerve roots

**Additional Checks:**
- [ ] AI mentions need for neurosurgical referral
- [ ] AI flags as urgent/critical findings
- [ ] AI correlates MRI findings with patient symptoms
- [ ] AI notes contraindications if any

**Score: ___/5 findings detected**

### Error Handling Tests (5 min)
1. [ ] Try uploading non-PDF file → Should show error
2. [ ] Try uploading file >25MB → Should show size error
3. [ ] Try uploading corrupted PDF → Should handle gracefully

### Performance Checks (3 min)
- [ ] PDF extraction completes <10 seconds
- [ ] SOAP generation completes <30 seconds
- [ ] No memory leaks (check DevTools Memory)
- [ ] No network errors

---

## Success Criteria
- ✅ All 5 critical findings detected
- ✅ No console errors
- ✅ Upload/extract <10s
- ✅ SOAP generation <30s
- ✅ Error handling works

**PASS/FAIL:** ________

**Notes:**

