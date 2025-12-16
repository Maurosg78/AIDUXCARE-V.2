# UAT Session Script

**Testing Sprint - Day 4**  
**Duration:** 20 minutes per participant  
**Purpose:** Guide UAT facilitator through session

---

## 📋 Pre-Session Setup (5 minutes before)

### Checklist

- [ ] Test environment ready (clean database, sample patients loaded)
- [ ] Participant account created and tested
- [ ] Screen recording started
- [ ] Consent form ready
- [ ] Feedback questionnaire ready
- [ ] Timer ready
- [ ] Note-taking materials ready

---

## 🎬 Session Script

### **PART 1: Introduction (2 minutes)**

**Facilitator Script:**

> "Thank you for participating in today's User Acceptance Testing session. My name is [Name], and I'm here to observe and help if needed.
>
> **What we're doing today:**
> - We're testing our new clinical documentation system
> - You'll complete a series of tasks that simulate real clinical workflows
> - We're testing the system, not you - there are no wrong answers
> - Please think aloud as you work through the tasks
>
> **What to expect:**
> - The session will take about 20 minutes
> - I'll be observing and taking notes, but I won't interfere unless you need help
> - Feel free to ask questions if you get stuck
> - At the end, we'll have a quick feedback session
>
> **Consent:**
> - We'll be recording the session for analysis purposes
> - Your participation is voluntary and confidential
> - Do you consent to participate and be recorded?
>
> **Any questions before we begin?**"

**Wait for consent and questions.**

---

### **PART 2: Task Execution (15 minutes)**

**Facilitator Script:**

> "Great! Let's begin. I'll give you a series of tasks to complete. Take your time, and remember to think aloud.
>
> **Task 1: Login**
> - Please log in to the system using the credentials provided
> - [Provide test credentials on paper]
> - Once you're logged in, let me know what you see"

**Observer Notes:**
- [ ] Time to login: _____ seconds
- [ ] Any confusion? ________________
- [ ] First impressions: _______________

---

> **Task 2: Navigate to Command Center**
> - After logging in, you should see the Command Center
> - What do you think this page is for?
> - What would you do next?

**Observer Notes:**
- [ ] Time to understand: _____ seconds
- [ ] Clarity of interface: _______________
- [ ] User's interpretation: _______________

---

> **Task 3: Select a Patient**
> - Please select a patient from the list
> - [Point to patient list if needed]
> - Once selected, what happens?

**Observer Notes:**
- [ ] Time to select: _____ seconds
- [ ] Ease of selection: _______________
- [ ] Any confusion? ________________

---

> **Task 4: Start a Clinical Session**
> - Now that you've selected a patient, start a new clinical session
> - Choose 'Initial Assessment' as the session type
> - What do you see on the next page?

**Observer Notes:**
- [ ] Time to start session: _____ seconds
- [ ] Navigation clarity: _______________
- [ ] User's reaction: _______________

---

> **Task 5: Record or Paste Clinical Notes**
> - You can either record audio or paste a transcript
> - For this test, please paste this sample transcript:
>   [Provide sample transcript on paper]
> - Once pasted, what would you do next?

**Observer Notes:**
- [ ] Time to paste: _____ seconds
- [ ] Interface clarity: _______________
- [ ] User's understanding: _______________

---

> **Task 6: Generate SOAP Note**
> - Now generate a SOAP note from the transcript
> - Click the 'Generate SOAP' button
> - Wait for it to generate, then review the result

**Observer Notes:**
- [ ] Generation time: _____ seconds
- [ ] User's reaction: _______________
- [ ] Quality assessment: _______________

---

> **Task 7: Review SOAP Note**
> - Please review the generated SOAP note
> - Does it look accurate?
> - Would you use this in your practice?
> - What would you change?

**Observer Notes:**
- [ ] Review time: _____ seconds
- [ ] User's feedback: _______________
- [ ] Quality concerns: _______________

---

> **Task 8: Generate WSIB Form**
> - Now generate a WSIB Form 8 from this SOAP note
> - Find the option to generate WSIB forms
> - Generate and review the form

**Observer Notes:**
- [ ] Time to generate: _____ seconds
- [ ] Navigation clarity: _______________
- [ ] Form quality: _______________

---

> **Task 9: Download PDF**
> - Download the WSIB form as a PDF
> - Open it and review it
> - Does it look professional?

**Observer Notes:**
- [ ] Download time: _____ seconds
- [ ] PDF quality: _______________
- [ ] User's reaction: _______________

---

> **Task 10: Generate Certificate**
> - Finally, generate a return-to-work certificate
> - Complete the certificate form
> - Download it as PDF

**Observer Notes:**
- [ ] Time to complete: _____ seconds
- [ ] Ease of use: _______________
- [ ] Final impressions: _______________

---

### **PART 3: Feedback Collection (3 minutes)**

**Facilitator Script:**

> "Excellent work! You've completed all the tasks. Now I'd like to get your feedback.
>
> **Quick Questions:**
> 1. On a scale of 1-10, how satisfied are you with this system? (1 = very dissatisfied, 10 = very satisfied)
> 2. On a scale of 1-10, how easy was it to use? (1 = very difficult, 10 = very easy)
> 3. Would you recommend this system to a colleague? (Yes/No)
> 4. What did you like most?
> 5. What did you like least?
> 6. What would you change?
> 7. Any other comments or suggestions?
>
> Thank you so much for your time and feedback! Your input is invaluable."

**Collect Feedback Form** (see `UAT_FEEDBACK_FORM.md`)

---

## 📝 Observer Notes Template

### Session Information

- **Participant ID:** _______________
- **Date:** _______________
- **Time:** _______________
- **Participant Profile:** _______________
- **Facilitator:** _______________

### Task Completion Times

| Task | Time (seconds) | Completed? | Notes |
|------|----------------|------------|-------|
| 1. Login | _____ | ☐ | |
| 2. Navigate Command Center | _____ | ☐ | |
| 3. Select Patient | _____ | ☐ | |
| 4. Start Session | _____ | ☐ | |
| 5. Paste Transcript | _____ | ☐ | |
| 6. Generate SOAP | _____ | ☐ | |
| 7. Review SOAP | _____ | ☐ | |
| 8. Generate WSIB Form | _____ | ☐ | |
| 9. Download PDF | _____ | ☐ | |
| 10. Generate Certificate | _____ | ☐ | |

**Total Time:** _____ minutes

### Critical Observations

**Confusion Points:**
1. _______________
2. _______________
3. _______________

**Positive Reactions:**
1. _______________
2. _______________
3. _______________

**Issues Encountered:**
1. _______________
2. _______________
3. _______________

**User Quotes:**
- "_______________"
- "_______________"
- "_______________"

---

## 🚨 Emergency Protocol

**If participant gets stuck:**
1. Wait 30 seconds before intervening
2. Ask: "What are you trying to do?"
3. Provide minimal guidance (don't solve for them)
4. Note the issue for later analysis

**If technical issue occurs:**
1. Note the exact error
2. Try to recover if possible
3. If not recoverable, skip to next task
4. Document issue for Day 5 fixes

**If participant wants to stop:**
1. Respect their decision
2. Collect feedback on what they completed
3. Thank them for their time
4. Document partial completion

---

**End of Session Script**

