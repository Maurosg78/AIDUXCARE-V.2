# 📱 **iOS TESTING CHECKLIST**

**Device:** iPhone / iPad  
**Browser:** Safari  
**Date:** November 2025

---

## 🔐 **1. LOGIN**

- [ ] Login form renders correctly
- [ ] Input fields respond to tap
- [ ] Keyboard appears when tapping input
- [ ] Keyboard doesn't cover input fields
- [ ] "Sign in" button is tappable
- [ ] Button has adequate touch target (min 44x44pt)
- [ ] Error messages display correctly
- [ ] Success redirect works
- [ ] Layout doesn't break on rotation

**Safari-Specific:**
- [ ] No input zoom on focus (viewport meta tag)
- [ ] Autocomplete works correctly
- [ ] Password manager integration works

---

## 👤 **2. CREATE PATIENT**

- [ ] Form inputs respond to tap
- [ ] Text inputs work correctly
- [ ] Dropdowns open and close properly
- [ ] Date picker works (if used)
- [ ] Form validation displays correctly
- [ ] Submit button is tappable
- [ ] Success message displays
- [ ] Error handling works

**Safari-Specific:**
- [ ] No input zoom on focus
- [ ] Date picker native UI works
- [ ] Select dropdowns work correctly

---

## 🎤 **3. RECORD AUDIO**

- [ ] Microphone permission requested
- [ ] Permission prompt displays correctly
- [ ] Permission granted → recording starts
- [ ] Permission denied → fallback message shown
- [ ] "Start Recording" button is tappable
- [ ] Recording indicator shows
- [ ] "Stop Recording" button is tappable
- [ ] Recording stops correctly
- [ ] Audio quality is acceptable

**Safari-Specific:**
- [ ] Audio buffer handling works
- [ ] No audio glitches
- [ ] MediaRecorder API works
- [ ] getUserMedia works correctly
- [ ] Audio context doesn't break

---

## 📤 **4. UPLOAD AUDIO**

- [ ] Upload starts automatically after recording
- [ ] Upload progress indicator shows
- [ ] Upload completes successfully
- [ ] Error handling works (network issues)
- [ ] Retry mechanism works
- [ ] User-facing error modal displays

---

## 🔄 **5. PIPELINE COMPLETE**

- [ ] Pipeline starts after upload
- [ ] Progress indicator shows
- [ ] Whisper transcription completes
- [ ] GPT analysis completes
- [ ] SOAP generation completes
- [ ] Total time < 30 seconds
- [ ] Error handling works
- [ ] Retry mechanism works
- [ ] User-facing error modal displays
- [ ] Latency metrics logged

**Safari-Specific:**
- [ ] No timeout issues
- [ ] Network requests complete
- [ ] Fetch API works correctly

---

## 📄 **6. VIEW SOAP**

- [ ] SOAP note renders correctly
- [ ] All sections visible (S, O, A, P)
- [ ] Text is readable
- [ ] Scroll works smoothly
- [ ] Copy button is tappable
- [ ] Copy to clipboard works
- [ ] Copy confirmation shows
- [ ] Layout doesn't break

**Safari-Specific:**
- [ ] Text selection works
- [ ] Copy to clipboard works
- [ ] Scroll momentum works
- [ ] No layout shifts

---

## 💾 **7. SAVE TO CLINICAL VAULT**

- [ ] "Save" button is tappable
- [ ] Save action completes
- [ ] Success message displays
- [ ] Error handling works
- [ ] Note appears in vault

---

## 📋 **8. COPY SOAP**

- [ ] Copy button is tappable
- [ ] Copy to clipboard works
- [ ] Copy confirmation shows
- [ ] Clipboard API works

**Safari-Specific:**
- [ ] Clipboard API works (iOS 13.4+)
- [ ] Fallback for older iOS versions

---

## 📁 **9. ACCESS `/documents`**

- [ ] Page loads correctly
- [ ] List of notes displays
- [ ] Search input works
- [ ] Search results filter correctly
- [ ] Filter dropdowns work
- [ ] Scroll works smoothly
- [ ] Note preview opens
- [ ] Layout doesn't break

**Safari-Specific:**
- [ ] Scroll momentum works
- [ ] No layout shifts
- [ ] Touch interactions work

---

## 👁️ **10. REVIEW NOTE FROM VAULT**

- [ ] Preview modal opens
- [ ] Note content displays correctly
- [ ] Copy button works
- [ ] Close button works
- [ ] Backdrop tap closes modal
- [ ] Modal doesn't break layout

**Safari-Specific:**
- [ ] Modal backdrop works
- [ ] Scroll within modal works
- [ ] No z-index issues

---

## 💬 **11. FEEDBACK WIDGET**

- [ ] Widget button is tappable
- [ ] Widget opens correctly
- [ ] Form inputs work
- [ ] Submit button works
- [ ] Success message shows
- [ ] Close button works
- [ ] Widget doesn't block content

**Safari-Specific:**
- [ ] Widget positioning correct
- [ ] Touch targets adequate
- [ ] No z-index issues

---

## 🎨 **12. LAYOUT & UI**

- [ ] No horizontal scroll
- [ ] No content cut off
- [ ] Text is readable (min 16px)
- [ ] Touch targets adequate (min 44x44pt)
- [ ] Buttons have visual feedback
- [ ] Loading states show
- [ ] Error states show
- [ ] Success states show

**Safari-Specific:**
- [ ] Viewport height correct (100vh fix)
- [ ] Safe area insets respected
- [ ] No notch issues
- [ ] Status bar doesn't overlap

---

## 🔄 **13. ROTATION**

- [ ] Portrait mode works
- [ ] Landscape mode works
- [ ] Layout adapts correctly
- [ ] No content loss
- [ ] No layout breaks

---

## ⚡ **14. PERFORMANCE**

- [ ] Page load < 3 seconds
- [ ] Pipeline < 30 seconds
- [ ] No janky scrolling
- [ ] No memory leaks
- [ ] Battery usage acceptable

---

## 🐛 **15. ERROR HANDLING**

- [ ] Network errors handled
- [ ] Permission errors handled
- [ ] Pipeline errors handled
- [ ] User-facing error modals show
- [ ] Retry options available
- [ ] No silent failures

---

## ✅ **FINAL VERIFICATION**

- [ ] Complete flow works end-to-end
- [ ] All critical bugs fixed
- [ ] All high-priority bugs fixed
- [ ] Pipeline functional
- [ ] Ready for pilot

---

**Status:** ⚠️ **IN PROGRESS**  
**Last Updated:** November 2025

