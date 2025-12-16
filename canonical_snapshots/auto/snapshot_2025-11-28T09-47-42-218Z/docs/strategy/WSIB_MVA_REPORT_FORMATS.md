# 📋 WSIB & MVA REPORT FORMATS - Ontario Requirements

**Status:** ✅ **RESEARCH COMPLETE**  
**Date:** November 19, 2025  
**Market:** Ontario, Canada  
**Purpose:** Define report formats for premium token-based reports

---

## 🎯 OVERVIEW

This document defines the specific formats and required fields for **WSIB (Workplace Safety and Insurance Board)** and **MVA (Motor Vehicle Accident)** reports that physiotherapists must complete in Ontario. These are **premium reports** that consume additional tokens due to their complexity and regulatory requirements.

---

## 🏥 WSIB REPORTS (Workplace Safety and Insurance Board)

### **Primary Forms Required:**

#### **1. Form 8: Health Professional's Report**

**Purpose:** Initial assessment and treatment plan for workplace injury

**Required Fields:**
- **Patient Information:**
  - Worker name, date of birth, WSIB claim number
  - Employer information
  - Date of injury/accident
  - Date of first assessment

- **Injury Details:**
  - Mechanism of injury
  - Body parts affected
  - Initial diagnosis
  - Pre-existing conditions

- **Clinical Assessment:**
  - Subjective findings (patient-reported symptoms)
  - Objective findings (physical examination)
  - Range of motion measurements
  - Strength testing results
  - Functional limitations
  - Pain assessment (location, intensity, quality)

- **Treatment Plan:**
  - Proposed treatment interventions
  - Frequency and duration of treatment
  - Expected outcomes
  - Return-to-work prognosis
  - Estimated treatment duration

- **Functional Abilities:**
  - Current functional capacity
  - Work restrictions
  - Modified duties recommendations
  - Lifting/carrying capacity
  - Standing/walking tolerance

---

#### **2. Form 26: Health Professional's Progress Report**

**Purpose:** Ongoing progress updates and treatment modifications

**Required Fields:**
- **Progress Since Last Report:**
  - Changes in symptoms
  - Functional improvements
  - Treatment response
  - Compliance with treatment plan

- **Current Status:**
  - Updated objective findings
  - Current functional abilities
  - Work capacity assessment
  - Modified duties status

- **Treatment Modifications:**
  - Changes to treatment plan
  - New interventions added
  - Frequency adjustments
  - Discharge planning

- **Return-to-Work Status:**
  - Current work restrictions
  - Modified duties recommendations
  - Full return-to-work timeline
  - Permanent impairment assessment (if applicable)

---

#### **3. Functional Abilities Form (FAF)**

**Purpose:** Detailed functional capacity evaluation

**Required Fields:**
- **Physical Demands Analysis:**
  - Lifting capacity (light, medium, heavy)
  - Carrying capacity
  - Pushing/pulling capacity
  - Standing tolerance
  - Walking tolerance
  - Sitting tolerance
  - Bending/stooping capacity
  - Climbing capacity
  - Reaching overhead capacity

- **Work Restrictions:**
  - Hours per day
  - Days per week
  - Specific activity restrictions
  - Environmental restrictions (temperature, noise, etc.)

- **Functional Limitations:**
  - Activities of daily living (ADL) limitations
  - Work-related activity limitations
  - Recreational activity limitations

---

## 🚗 MVA REPORTS (Motor Vehicle Accident)

### **Primary Forms Required:**

#### **1. OCF-18: Treatment and Assessment Plan**

**Purpose:** Treatment plan for accident benefits claim

**Required Fields:**
- **Patient Information:**
  - Name, date of birth, policy number
  - Date of accident
  - Date of assessment
  - Insurance company information

- **Accident Details:**
  - Date, time, location of accident
  - Mechanism of injury (collision type, impact direction)
  - Initial symptoms
  - Emergency department visit (if applicable)

- **Clinical Assessment:**
  - **Subjective:**
    - Chief complaint
    - Pain description (location, intensity, quality, radiation)
    - Functional limitations
    - Impact on activities of daily living
    - Sleep disturbances
    - Work impact
  
  - **Objective:**
    - Posture assessment
    - Range of motion (cervical, thoracic, lumbar, extremities)
    - Muscle strength testing
    - Neurological examination
    - Special tests (if applicable)
    - Palpation findings
    - Functional movement assessment

- **Diagnosis:**
  - Primary diagnosis
  - Secondary diagnoses
  - Diagnostic imaging findings (if available)
  - Prognosis

- **Treatment Plan:**
  - **Proposed Interventions:**
    - Manual therapy techniques
    - Exercise prescription
    - Modalities (if applicable)
    - Education/advice
  
  - **Treatment Schedule:**
    - Frequency (sessions per week)
    - Duration (minutes per session)
    - Total number of sessions
    - Expected duration of treatment plan
  
  - **Goals:**
    - Short-term goals (2-4 weeks)
    - Long-term goals (8-12 weeks)
    - Functional goals
    - Return-to-work goals

- **Cost Estimate:**
  - Cost per session
  - Total treatment cost
  - Equipment/supplies (if applicable)

---

#### **2. OCF-23: Assessment of Attendant Care Needs**

**Purpose:** Assessment of care needs (if applicable)

**Required Fields:**
- **Care Needs Assessment:**
  - Activities requiring assistance
  - Level of assistance required
  - Frequency of care needs
  - Duration of care needs
  - Cost of attendant care

---

#### **3. OCF-21: Application for Determination of Catastrophic Impairment**

**Purpose:** For severe injuries (if applicable)

**Required Fields:**
- **Catastrophic Impairment Criteria:**
  - Specific impairment criteria assessment
  - Functional impact evaluation
  - Medical evidence supporting catastrophic designation

---

## 📊 COMPARISON: SOAP Normal vs Premium Reports

### **SOAP Normal (Base Plan):**
- Standard SOAP format (Subjective, Objective, Assessment, Plan)
- Copy-paste ready for EMR
- General clinical documentation
- **Token Cost:** Standard (based on visit type)

### **WSIB Report (Premium):**
- **Form 8** (initial) or **Form 26** (progress) format
- **FAF** (Functional Abilities Form) integration
- Regulatory compliance requirements
- Return-to-work assessment
- Modified duties recommendations
- **Token Cost:** Higher (premium report)

### **MVA Report (Premium):**
- **OCF-18** format (Treatment and Assessment Plan)
- Insurance-specific requirements
- Detailed accident mechanism documentation
- Cost estimates and treatment justification
- Functional impact assessment
- **Token Cost:** Higher (premium report)

---

## 🎯 KEY DIFFERENCES FROM STANDARD SOAP

### **WSIB Reports Require:**
1. **Workplace Context:**
   - Employer information
   - Job demands analysis
   - Work restrictions
   - Modified duties recommendations

2. **Functional Capacity:**
   - Detailed FAF (Functional Abilities Form)
   - Physical demands analysis
   - Return-to-work timeline
   - Permanent impairment assessment

3. **Regulatory Compliance:**
   - WSIB-specific form fields
   - Mandatory reporting timelines
   - Specific terminology requirements

### **MVA Reports Require:**
1. **Accident Details:**
   - Detailed accident mechanism
   - Collision type and impact direction
   - Initial symptoms and emergency care

2. **Insurance Requirements:**
   - Policy number and insurance company
   - Cost estimates and treatment justification
   - OCF form format compliance

3. **Legal Considerations:**
   - Detailed documentation for potential legal proceedings
   - Objective findings emphasis
   - Functional impact documentation

---

## 💡 IMPLEMENTATION REQUIREMENTS

### **Data Collection Points:**

**From SOAP Normal:**
- Subjective findings
- Objective findings
- Assessment
- Plan

**Additional for WSIB:**
- Employer information
- Job demands analysis
- Functional abilities evaluation
- Work restrictions
- Modified duties recommendations

**Additional for MVA:**
- Accident details (date, time, location, mechanism)
- Insurance information
- Cost estimates
- OCF form-specific fields

### **Template Structure:**

**WSIB Form 8 Template:**
```
1. Patient/Worker Information
2. Employer Information
3. Injury Details
4. Clinical Assessment (from SOAP)
5. Functional Abilities Evaluation (FAF)
6. Treatment Plan
7. Return-to-Work Assessment
8. Prognosis
```

**MVA OCF-18 Template:**
```
1. Patient/Policy Information
2. Accident Details
3. Clinical Assessment (from SOAP)
4. Diagnosis
5. Treatment Plan (detailed)
6. Cost Estimate
7. Goals and Expected Outcomes
```

---

## 📋 CPO REPORT (College of Physiotherapists of Ontario)

### **Purpose:**
Professional accountability and compliance reporting

### **Required Fields:**
- **Professional Information:**
  - Physiotherapist name and registration number
  - Clinic information
  - Date of assessment

- **Clinical Documentation:**
  - Standard SOAP format
  - Evidence-based practice documentation
  - Professional accountability measures
  - Consent documentation

- **Compliance:**
  - CPO Standards compliance
  - Documentation standards adherence
  - Professional boundaries maintained

---

## 🚀 NEXT STEPS

1. **Template Development:**
   - Create WSIB Form 8 template
   - Create WSIB Form 26 template
   - Create MVA OCF-18 template
   - Create CPO report template

2. **Data Mapping:**
   - Map SOAP data to WSIB fields
   - Map SOAP data to MVA fields
   - Identify additional data collection points

3. **UI Implementation:**
   - Report type selector in Workflow
   - Additional fields for WSIB/MVA
   - Template preview before generation

4. **Validation:**
   - Ensure all required fields populated
   - Regulatory compliance check
   - Format validation

---

**Document Owner:** Product Team  
**Review Frequency:** Quarterly  
**Next Review:** February 2026  
**Status:** ✅ **RESEARCH COMPLETE - READY FOR IMPLEMENTATION**

