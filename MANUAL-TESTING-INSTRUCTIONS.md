# 📋 Manual Testing Instructions - PDF Processing

## ⚠️ IMPORTANT: Execute these steps BEFORE committing

This document guides you through manual testing to verify PDF processing works correctly.

---

## Step 1: Create Test PDF (5 min)

### Option A: Online Converter
1. Go to: https://www.text2pdf.com/ or https://www.online-convert.com/
2. Upload `test-data/matt-proctor-mri.txt`
3. Convert to PDF
4. Save as `test-data/matt-proctor-mri.pdf`

### Option B: macOS (TextEdit + Print)
1. Open `test-data/matt-proctor-mri.txt` in TextEdit
2. File → Print
3. Click "PDF" → "Save as PDF"
4. Save as `test-data/matt-proctor-mri.pdf`

### Option C: Use Existing PDF
- If you have any real MRI/lab report PDF, use that instead

---

## Step 2: Start Dev Server (1 min)

```bash
pnpm dev
```

Wait for: `Local: http://localhost:5176/` (or similar port)

---

## Step 3: Open Browser & DevTools (1 min)

1. Open browser to `http://localhost:5176/`
2. Open DevTools:
   - Mac: `Cmd + Option + J`
   - Windows: `F12`
3. Go to **Console** tab
4. Go to **Network** tab (optional, for monitoring)

---

## Step 4: Navigate to Workflow Page (1 min)

1. Navigate to workflow page (usually `/workflow` or main page)
2. Ensure you're on the "Initial Analysis" tab

---

## Step 5: Upload PDF (3 min)

1. Find "Clinical attachments" section
2. Click "Add files" or upload button
3. Select `test-data/matt-proctor-mri.pdf`
4. **Watch console for logs:**

**Expected Console Output:**
```
[ClinicalAttachment] Starting upload: matt-proctor-mri.pdf
[FileProcessor] 📄 Extracting text from PDF: matt-proctor-mri.pdf
[PDFExtractor] Starting extraction for: matt-proctor-mri.pdf
[PDFExtractor] PDF loaded: 1 pages
[PDFExtractor] ✅ Extraction complete: XXX total characters
[FileProcessor] ✅ Extracted XXX characters from 1 pages
[ClinicalAttachment] ✅ File processed successfully
```

5. **Verify UI:**
   - ✅ Green box appears with "Text extracted: XXX characters"
   - ✅ "1 page" displayed
   - ✅ "Preview extracted content" link visible

---

## Step 6: Verify Text Preview (2 min)

1. Click "Preview extracted content" in the green box
2. **Verify:**
   - ✅ First ~500 characters of MRI report visible
   - ✅ Text includes "L4-L5", "canal stenosis", "disc extrusion"
   - ✅ Preview is readable

---

## Step 7: Generate SOAP Note (5 min)

1. **Add patient transcript:**
   ```
   42-year-old male with severe low back pain radiating to left leg, 
   worse with standing. Reports numbness in left foot and weakness 
   in left leg. Symptoms started 6 months ago and have progressively 
   worsened. Pain is 8/10 on VAS scale.
   ```

2. **Select relevant tests:**
   - Straight Leg Raise (SLR)
   - Neurological examination
   - Lumbar range of motion

3. **Click "Analyze" or "Generate SOAP"**

4. **Wait for processing** (may take 20-30 seconds)

5. **Watch console:**
```
[NiagaraProcessor] Including 1 attachments in prompt
  - matt-proctor-mri.pdf: XXX chars
[VertexAI] Processing with attachments...
```

---

## Step 8: Verify AI Detection (10 min) ⭐ CRITICAL

**Open the generated SOAP note** and search for these 5 findings:

### Finding 1: Severe Central Canal Stenosis
**Search for:** "canal stenosis", "central stenosis", "L4-L5 stenosis"
- [ ] ✅ DETECTED / ❌ MISSED
- **Evidence:** [Copy/paste relevant text from SOAP]

### Finding 2: Disc Extrusion
**Search for:** "disc extrusion", "posterior disc", "disc herniation"
- [ ] ✅ DETECTED / ❌ MISSED
- **Evidence:** [Copy/paste relevant text from SOAP]

### Finding 3: Thecal Sac Compression
**Search for:** "thecal sac", "thecal compression", "sac compression"
- [ ] ✅ DETECTED / ❌ MISSED
- **Evidence:** [Copy/paste relevant text from SOAP]

### Finding 4: Foraminal Stenosis
**Search for:** "foraminal stenosis", "foraminal", "bilateral foraminal"
- [ ] ✅ DETECTED / ❌ MISSED
- **Evidence:** [Copy/paste relevant text from SOAP]

### Finding 5: Mass Effect
**Search for:** "mass effect", "nerve root compression", "nerve compression"
- [ ] ✅ DETECTED / ❌ MISSED
- **Evidence:** [Copy/paste relevant text from SOAP]

**SCORE: ___/5**

### Bonus Checks
- [ ] AI mentions "urgent" or "neurosurgical referral"
- [ ] AI correlates MRI findings with symptoms (leg pain)
- [ ] AI flags as red flag or serious finding

---

## Step 9: Document Results (5 min)

1. Open `test-results.md`
2. Fill in all checkboxes
3. Paste console logs
4. Paste SOAP excerpts for each finding
5. Calculate final score

---

## Step 10: Commit (Only if 5/5 detected)

```bash
# Review changes
git status

# Add all changes
git add .

# Commit using the prepared message
git commit -F COMMIT-MESSAGE.md

# Verify
git log -1 --stat
```

---

## 🚨 IF SCORE < 5/5

**DO NOT COMMIT YET**

1. Check console for errors
2. Verify PDF text was actually extracted (check character count)
3. Check if prompt includes "CLINICAL ATTACHMENTS" section
4. Review SOAP note - maybe findings are mentioned differently
5. Try with different patient transcript
6. Report issues with specific logs

---

## ✅ SUCCESS CRITERIA

**PASS = All of these:**
- ✅ 5/5 findings detected
- ✅ No console errors
- ✅ UI shows preview
- ✅ SOAP generation completes
- ✅ AI mentions urgency/referral

**If PASS → Commit and push**  
**If FAIL → Debug and re-test**

---

## 📸 Screenshots to Capture

1. Console logs showing extraction
2. UI showing green success box with preview
3. Generated SOAP note with MRI findings highlighted
4. Score: 5/5 checkmarks

---

**Good luck! Report back with score and evidence.** 🚀
