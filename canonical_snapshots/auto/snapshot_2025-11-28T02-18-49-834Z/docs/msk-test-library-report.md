# MSK Test Library Report

**Generated:** 2025-11-14T20:49:44.921Z
**Total Tests:** 37

## Summary by Segment

| Segment | Total Tests | With Fields | Without Fields |
|---------|-------------|-------------|----------------|
| Shoulder | 7 | 5 | 2 |
| Cervical | 7 | 5 | 2 |
| Lumbar | 3 | 3 | 0 |
| Knee | 6 | 6 | 0 |
| Ankle | 5 | 4 | 1 |
| Hip | 3 | 3 | 0 |
| Thoracic | 1 | 1 | 0 |
| Wrist/Hand | 5 | 5 | 0 |

## Detailed Tests by Segment

### Shoulder (7 tests)

#### 1. Empty Can Test

- **ID:** `empty-can`
- **Segment:** Shoulder
- **Description:** Assesses supraspinatus involvement and possible tendinopathy.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 3
- **Fields:**
  - `pain_present`: Pain present during test? [yes_no]
  - `weakness_present`: Weakness observed against resistance? [yes_no]
  - `pain_description`: Pain description [text]
- **Normal Template:** Empty Can: no pain or weakness against resistance.
- **Sensitivity:** Moderate
- **Specificity:** Moderate

#### 2. Neer Impingement Sign

- **ID:** `shoulder-neer-impingement`
- **Segment:** Shoulder
- **Description:** Passive forward elevation of the shoulder in internal rotation to assess for subacromial pain provocation.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `side_tested`: Side tested [text]
  - `pain_reproduced`: Pain reproduced in forward elevation [yes_no]
  - `pain_location`: Pain location [text]
  - `pain_intensity`: Pain intensity (0–10) at end range [score_0_10]
- **Normal Template:** Neer impingement sign performed with full passive forward elevation and no reproduction of the patient's typical subacromial or lateral shoulder pain.
- **Sensitivity:** High
- **Specificity:** Low

#### 3. Hawkins–Kennedy Test

- **ID:** `shoulder-hawkins-kennedy`
- **Segment:** Shoulder
- **Description:** Passive forward flexion to 90° with forced internal rotation to assess for subacromial pain provocation.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `side_tested`: Side tested [text]
  - `pain_reproduced`: Pain reproduced with internal rotation [yes_no]
  - `pain_location`: Pain location [text]
  - `comparison_to_other_side`: Comparison to contralateral side [text]
- **Normal Template:** Hawkins–Kennedy test negative bilaterally: no reproduction of the patient's typical shoulder pain and no marked difference between sides.
- **Sensitivity:** Moderate
- **Specificity:** Moderate

#### 4. Drop Arm Test

- **ID:** `drop_arm_shoulder`
- **Segment:** Shoulder
- **Description:** Assesses rotator cuff integrity, especially supraspinatus, during eccentric arm descent.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `side_tested`: Shoulder tested [text]
  - `control_of_descent`: Control of descent [text]
  - `pain_present`: Pain during descent? [yes_no]
  - `pain_location`: Pain location [text]
- **Normal Template:** Drop Arm: controlled descent without significant pain or sudden loss of control.
- **Sensitivity:** Moderate
- **Specificity:** High

#### 5. Apprehension / Relocation Test

- **ID:** `apprehension_relocation_shoulder`
- **Segment:** Shoulder
- **Description:** Assesses apprehension or anterior shoulder instability in abduction and external rotation.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `side_tested`: Shoulder tested [text]
  - `apprehension_present`: Apprehension or fear of dislocation? [yes_no]
  - `pain_vs_apprehension`: Pain vs apprehension [text]
  - `relocation_effect`: Response to relocation maneuver [text]
- **Normal Template:** Apprehension/Relocation: no apprehension or perceived instability in abduction and external rotation.
- **Sensitivity:** High
- **Specificity:** Moderate

#### 6. External Rotation Lag Sign

- **ID:** `external-rotation-lag`
- **Segment:** Shoulder
- **Description:** Assesses the ability to maintain external rotation in an elevated position.
- **Has Specific Fields:** ❌ No (legacy)
- **Normal Template:** Maintains externally rotated position without lag or drop, symmetric to the opposite shoulder.

#### 7. O'Brien Test

- **ID:** `o'brien`
- **Segment:** Shoulder
- **Description:** Resisted shoulder flexion with pronation/supination to check labral sensitivity.
- **Has Specific Fields:** ❌ No (legacy)
- **Normal Template:** Compression/rotation resisted without reproduction of deep shoulder or AC joint pain.

### Cervical (7 tests)

#### 1. Cervical Active Rotation

- **ID:** `cervical-rotation-active`
- **Segment:** Cervical
- **Description:** Assesses cervical rotation range of motion.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 3
- **Fields:**
  - `right_angle`: Right cervical rotation (deg) [angle_bilateral]
  - `left_angle`: Left cervical rotation (deg) [angle_bilateral]
  - `pain_description`: Pain or associated symptoms description [text]
- **Normal Template:** Cervical active rotation: 0–80° bilaterally without pain or neurological symptoms.
- **Sensitivity:** Moderate
- **Specificity:** Moderate

#### 2. Spurling Test

- **ID:** `spurling_cervical`
- **Segment:** Cervical
- **Description:** Cervical compression in extension and rotation to reproduce radicular pain.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `side_tested`: Side of lateral flexion/rotation [text]
  - `radicular_pain_present`: Radicular pain reproduced? [yes_no]
  - `pain_distribution`: Pain/paresthesia distribution [text]
  - `local_neck_pain`: Local neck pain only without radiation? [yes_no]
- **Normal Template:** Spurling: no reproduction of radicular symptoms; may have mild local cervical discomfort without radiation.
- **Sensitivity:** Moderate
- **Specificity:** High

#### 3. ULNTT / ULTT A (median)

- **ID:** `ultt_a_cervical`
- **Segment:** Cervical
- **Description:** Neural tension test for median nerve with differentiation through cervical movements.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `side_tested`: Upper limb tested [text]
  - `symptom_reproduction`: Patient's typical symptoms reproduced? [yes_no]
  - `symptom_description`: Symptom description [text]
  - `cervical_sensitization_response`: Response to contralateral/ipsilateral cervical lateral flexion [text]
- **Normal Template:** ULNTT A: mild neural tension without reproduction of typical symptoms and symmetric bilateral response.
- **Sensitivity:** High
- **Specificity:** Moderate

#### 4. Cervical Flexion-Rotation Test (CFRT)

- **ID:** `cfrt_cervical`
- **Segment:** Cervical
- **Description:** Assesses C1–C2 contribution to cervical rotation in maximum flexion position.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `side_tested`: Side compared (right vs left) [text]
  - `rotation_right_deg`: Approximate right rotation [text]
  - `rotation_left_deg`: Approximate left rotation [text]
  - `headache_reproduction`: Patient's typical headache reproduced? [yes_no]
- **Normal Template:** CFRT: cervical rotation in flexion relatively symmetric without clear reproduction of typical headache.
- **Sensitivity:** High
- **Specificity:** High

#### 5. Cervical Distraction Test

- **ID:** `cervical_distraction`
- **Segment:** Cervical
- **Description:** Manual traction applied to cervical spine to assess relief of radicular symptoms and nerve root compression.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 5
- **Fields:**
  - `symptom_relief`: Radicular symptoms relieved with traction? [yes_no]
  - `pain_reduction`: Pain reduction (if applicable) [text]
  - `traction_force`: Traction force applied [text]
  - `adverse_response`: Adverse response (dizziness, nausea)? [yes_no]
  - `comparison_baseline`: Comparison to baseline symptoms [text]
- **Normal Template:** Cervical distraction test: gentle manual traction provides comfortable relief of radicular symptoms without adverse response or dizziness.
- **Sensitivity:** Moderate
- **Specificity:** Moderate

#### 6. Spurling Test

- **ID:** `spurling`
- **Segment:** Cervical
- **Description:** Extension with axial load assessing nerve root provocation.
- **Has Specific Fields:** ❌ No (legacy)
- **Normal Template:** Cervical extension with axial load negative for radicular reproduction; patient remains comfortable.

#### 7. Upper Limb Tension Test (Median Nerve)

- **ID:** `ultt-median`
- **Segment:** Cervical
- **Description:** Sequential nerve tension sequence for median nerve sensitivity.
- **Has Specific Fields:** ❌ No (legacy)
- **Normal Template:** Median nerve tension sequence completed bilaterally without reproduction of distal neural symptoms.

### Lumbar (3 tests)

#### 1. Straight Leg Raise (SLR)

- **ID:** `straight-leg-raise`
- **Segment:** Lumbar
- **Description:** Assesses possible L4–S1 radicular irritation with passive leg elevation.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `right_angle`: Right leg angle achieved (deg) [angle_bilateral]
  - `left_angle`: Left leg angle achieved (deg) [angle_bilateral]
  - `radicular_pain`: Radicular pain reproduced? [yes_no]
  - `pain_description`: Pain description [text]
- **Normal Template:** SLR: 0–70° bilaterally without radicular pain or radiation.
- **Sensitivity:** High
- **Specificity:** Moderate

#### 2. Slump Test

- **ID:** `slump_lumbar`
- **Segment:** Lumbar
- **Description:** Neurodynamic test in seated position for radicular irritation and neural tension in lower limbs.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `side_tested`: Side tested (right/left/bilateral) [text]
  - `symptom_reproduction`: Patient's typical symptoms reproduced? [yes_no]
  - `symptom_description`: Symptom description [text]
  - `structural_vs_neural`: Response to cervical release (structural/neural differentiation) [text]
- **Normal Template:** Slump Test: no radicular symptoms or paresthesias reproduced with complete sequence.
- **Sensitivity:** High
- **Specificity:** Moderate

#### 3. Prone Instability Test

- **ID:** `prone_instability_lumbar`
- **Segment:** Lumbar
- **Description:** Assesses contribution of lumbar segmental instability to pain in extension.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 3
- **Fields:**
  - `pain_prone_feet_supported`: Pain with PA pressure in prone with feet on floor [yes_no]
  - `pain_prone_feet_lifted`: Pain with feet elevated and extensor activation [yes_no]
  - `pain_change_description`: Pain change between both positions [text]
- **Normal Template:** Prone Instability Test: no significant pain difference between positions; negative for segmental instability.
- **Sensitivity:** Moderate
- **Specificity:** Moderate

### Knee (6 tests)

#### 1. Lachman Test

- **ID:** `knee-lachman`
- **Segment:** Knee
- **Description:** Anterior translation test of the tibia relative to the femur at ~20–30° flexion to assess anterior cruciate ligament integrity.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `side_tested`: Side tested [text]
  - `anterior_translation_side`: Anterior translation (tested vs contralateral side) [text]
  - `end_feel_quality`: End-feel quality [text]
  - `patient_symptoms`: Symptom response [text]
- **Normal Template:** Lachman test with symmetric anterior translation compared to the contralateral knee and a firm ligamentous end feel, without reproduction of instability symptoms.
- **Sensitivity:** High
- **Specificity:** Moderate

#### 2. McMurray Test

- **ID:** `knee-mcmurray`
- **Segment:** Knee
- **Description:** Combination of knee flexion, extension and rotation to assess for meniscal click and symptom reproduction.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `side_tested`: Side tested [text]
  - `click_or_clunk_present`: Mechanical click/clunk reproduced [yes_no]
  - `pain_reproduced`: Pain reproduced during maneuver [yes_no]
  - `symptom_description`: Symptom description [text]
- **Normal Template:** McMurray test performed without mechanical click or clunk and without reproduction of the patient's usual joint line pain or locking.
- **Sensitivity:** Moderate
- **Specificity:** Moderate

#### 3. Patellofemoral Grind Test (Clarke's)

- **ID:** `knee-patellofemoral-grind`
- **Segment:** Knee
- **Description:** Assessment of patellofemoral joint symptoms by applying gentle pressure to the patella during quadriceps contraction.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `side_tested`: Side tested [text]
  - `pain_reproduced`: Anterior knee pain reproduced [yes_no]
  - `pain_location`: Pain location [text]
  - `crepitus_noted`: Crepitus noted during test [yes_no]
- **Normal Template:** Patellofemoral grind test performed without reproduction of significant anterior knee pain and without marked crepitus.
- **Sensitivity:** Moderate
- **Specificity:** Low

#### 4. Valgus Stress Test (MCL)

- **ID:** `valgus_stress_knee`
- **Segment:** Knee
- **Description:** Assesses medial collateral ligament integrity at 0° and 30° of flexion.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `side_tested`: Knee tested [text]
  - `pain_medial`: Medial pain during test? [yes_no]
  - `laxity_30deg`: Laxity at 30° flexion [text]
  - `laxity_0deg`: Laxity in extension (0°) [text]
- **Normal Template:** Valgus stress: no relevant medial pain or increased laxity compared to contralateral side.
- **Sensitivity:** Moderate
- **Specificity:** Moderate

#### 5. Varus Stress Test (LCL)

- **ID:** `varus_stress_knee`
- **Segment:** Knee
- **Description:** Assesses lateral collateral ligament integrity at 0° and 30° of flexion.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `side_tested`: Knee tested [text]
  - `pain_lateral`: Lateral pain during test? [yes_no]
  - `laxity_30deg`: Laxity at 30° flexion [text]
  - `laxity_0deg`: Laxity in extension (0°) [text]
- **Normal Template:** Varus stress: no significant lateral pain or increased laxity relative to contralateral side.
- **Sensitivity:** Low
- **Specificity:** Moderate

#### 6. Thessaly Test

- **ID:** `thessaly_knee`
- **Segment:** Knee
- **Description:** Weight-bearing rotation test at 5° and 20° knee flexion to assess meniscal involvement and internal knee structure sensitivity.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 6
- **Fields:**
  - `side_tested`: Knee tested [text]
  - `pain_5deg`: Pain at 5° flexion during rotation? [yes_no]
  - `pain_20deg`: Pain at 20° flexion during rotation? [yes_no]
  - `clicking_or_locking`: Mechanical clicking or locking sensation? [yes_no]
  - `instability_sensation`: Sensation of giving way or instability? [yes_no]
  - `symptom_description`: Symptom description [text]
- **Normal Template:** Thessaly test: weight-bearing rotation at 5° and 20° knee flexion tolerated without pain, clicking, locking, or instability.
- **Sensitivity:** Moderate
- **Specificity:** Moderate

### Ankle (5 tests)

#### 1. Anterior Drawer Test (Ankle)

- **ID:** `ankle-anterior-drawer`
- **Segment:** Ankle
- **Description:** Anterior translation test of the talus relative to the tibia to assess anterior talofibular ligament integrity.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `side_tested`: Side tested [text]
  - `translation_relative`: Anterior translation compared to contralateral side [text]
  - `end_feel_quality`: End-feel quality [text]
  - `symptom_response`: Symptom response [text]
- **Normal Template:** Ankle anterior drawer test with symmetric translation compared to the opposite side, firm ligamentous end feel and no reproduction of instability symptoms.
- **Sensitivity:** Moderate
- **Specificity:** Moderate

#### 2. Thompson Test

- **ID:** `ankle-thompson`
- **Segment:** Ankle
- **Description:** Calf squeeze test to assess plantarflexion response, used to screen for Achilles tendon rupture.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 3
- **Fields:**
  - `side_tested`: Side tested [text]
  - `plantarflexion_present`: Active plantarflexion observed on calf squeeze [yes_no]
  - `comparison_to_other_side`: Comparison to contralateral side [text]
- **Normal Template:** Thompson test negative: visible and symmetrical plantarflexion response on calf squeeze compared to the contralateral side.
- **Sensitivity:** High
- **Specificity:** High

#### 3. Talar Tilt Test

- **ID:** `talar_tilt_ankle`
- **Segment:** Ankle
- **Description:** Assesses lateral ankle ligament integrity through varus/valgus talar tilt.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `side_tested`: Ankle tested [text]
  - `laxity_varus`: Laxity in varus [text]
  - `laxity_valgus`: Laxity in valgus (deltoid) [text]
  - `pain_location`: Pain location during test [text]
- **Normal Template:** Talar tilt: mobility comparable to contralateral side without significant pain or clear increased laxity.
- **Sensitivity:** Moderate
- **Specificity:** Moderate

#### 4. Windlass Test

- **ID:** `windlass_ankle`
- **Segment:** Ankle
- **Description:** Assesses plantar fascia integrity by dorsiflexing the first metatarsophalangeal joint while maintaining ankle position.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 5
- **Fields:**
  - `side_tested`: Side tested [text]
  - `pain_reproduced`: Plantar heel or arch pain reproduced? [yes_no]
  - `pain_location`: Pain location [text]
  - `pain_intensity`: Pain intensity (0-10) (score) [score_0_10]
  - `comparison_side`: Comparison to contralateral side [text]
- **Normal Template:** Windlass test: passive first MTP dorsiflexion performed without reproduction of plantar heel or arch pain, symmetric to contralateral side.
- **Sensitivity:** High
- **Specificity:** Moderate

#### 5. Talar Tilt Test

- **ID:** `talar-tilt`
- **Segment:** Ankle
- **Description:** Inversion stress assessing lateral ankle ligament response.
- **Has Specific Fields:** ❌ No (legacy)
- **Normal Template:** Inversion stress symmetrical bilaterally without lateral ankle pain or laxity.

### Hip (3 tests)

#### 1. FABER Test (Patrick's)

- **ID:** `hip-faber`
- **Segment:** Hip
- **Description:** Flexion, abduction and external rotation of the hip to assess for hip or sacroiliac joint-related pain.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `side_tested`: Side tested [text]
  - `knee_height_relative`: Knee height relative to contralateral side [text]
  - `pain_reproduced`: Pain reproduced [yes_no]
  - `pain_region`: Region of pain [text]
- **Normal Template:** FABER test with knee height comparable to the opposite side and no reproduction of the patient's usual hip or SI joint pain.
- **Sensitivity:** Moderate
- **Specificity:** Low

#### 2. FADIR Test

- **ID:** `hip-fadir`
- **Segment:** Hip
- **Description:** Flexion, adduction and internal rotation maneuver used to provoke anterior hip/groin symptoms.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 3
- **Fields:**
  - `side_tested`: Side tested [text]
  - `pain_reproduced`: Anterior hip/groin pain reproduced [yes_no]
  - `pain_description`: Symptom description [text]
- **Normal Template:** FADIR test performed to available range without reproduction of the patient's usual anterior hip or groin pain.
- **Sensitivity:** Moderate
- **Specificity:** Moderate

#### 3. Trendelenburg Sign

- **ID:** `hip-trendelenburg`
- **Segment:** Hip
- **Description:** Single-leg stance test to observe pelvic drop and assess hip abductor function.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 3
- **Fields:**
  - `stance_side`: Stance side [text]
  - `pelvic_drop_present`: Contralateral pelvic drop observed [yes_no]
  - `compensation_observed`: Compensations observed [text]
- **Normal Template:** Trendelenburg sign negative: single-leg stance maintained without contralateral pelvic drop and without significant trunk compensation.
- **Sensitivity:** Moderate
- **Specificity:** Moderate

### Thoracic (1 test)

#### 1. PA Spring Test (thoracic)

- **ID:** `thoracic_pa_spring`
- **Segment:** Thoracic
- **Description:** Segmental posteroanterior pressure on thoracic spine to assess mobility and local sensitivity.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 3
- **Fields:**
  - `segments_evaluated`: Segments evaluated [text]
  - `hypomobile_segments`: Hypomobile and painful segments [text]
  - `hypermobile_segments`: Hypermobile segments (if any) [text]
- **Normal Template:** Thoracic PA: symmetric segmental mobility without significant pain or evident hypermobility.
- **Sensitivity:** Low
- **Specificity:** Low

### Wrist/Hand (5 tests)

#### 1. Phalen's Test

- **ID:** `phalen_wrist`
- **Segment:** Wrist/Hand
- **Description:** Wrist flexion test to assess median nerve compression (carpal tunnel syndrome).
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 5
- **Fields:**
  - `side_tested`: Side tested [text]
  - `symptom_reproduction`: Patient's typical symptoms reproduced? [yes_no]
  - `time_to_symptoms`: Time to symptom onset (seconds) [text]
  - `symptom_distribution`: Symptom distribution [text]
  - `comparison_side`: Comparison to contralateral side [text]
- **Normal Template:** Phalen's test: maintained wrist flexion for 60 seconds without reproduction of median nerve symptoms, symmetric bilateral response.
- **Sensitivity:** High
- **Specificity:** Moderate

#### 2. Finkelstein's Test

- **ID:** `finkelstein_wrist`
- **Segment:** Wrist/Hand
- **Description:** Assesses for De Quervain's tenosynovitis by ulnar deviation with thumb in fist.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 4
- **Fields:**
  - `pain_reproduced`: Pain reproduced during test? [yes_no]
  - `pain_location`: Pain location [text]
  - `pain_intensity`: Pain intensity (0-10) (score) [score_0_10]
  - `test_notes`: Additional notes [text]
- **Normal Template:** Finkelstein's test: negative for pain reproduction at radial styloid or first dorsal compartment.
- **Sensitivity:** Moderate
- **Specificity:** Moderate

#### 3. Ulnar Collateral Ligament (UCL) Stress Test

- **ID:** `ucl_stress_wrist`
- **Segment:** Wrist/Hand
- **Description:** Assesses the integrity of the ulnar collateral ligament of the wrist with radial deviation stress.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 5
- **Fields:**
  - `pain_reproduced`: Pain reproduced during stress? [yes_no]
  - `laxity_present`: Laxity or instability detected? [yes_no]
  - `comparison_side`: Comparison to contralateral side [text]
  - `pain_location`: Pain location [text]
  - `test_notes`: Additional notes [text]
- **Normal Template:** UCL stress test: negative for pain and laxity, stable compared to contralateral side.
- **Sensitivity:** Moderate
- **Specificity:** Moderate

#### 4. Grip Strength Testing

- **ID:** `grip_strength_wrist`
- **Segment:** Wrist/Hand
- **Description:** Establishes baseline grip strength and identifies deficits using dynamometer.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 5
- **Fields:**
  - `right_grip_kg`: Right grip strength (kg) (kg) [angle_bilateral]
  - `left_grip_kg`: Left grip strength (kg) (kg) [angle_bilateral]
  - `deficit_percentage`: Deficit percentage (if applicable) [text]
  - `pain_during_grip`: Pain during grip testing? [yes_no]
  - `test_notes`: Additional notes [text]
- **Normal Template:** Grip strength: within normal limits bilaterally, symmetric (typically <10% difference between sides).
- **Sensitivity:** Moderate
- **Specificity:** Moderate

#### 5. Wrist Range of Motion Assessment

- **ID:** `wrist_rom_wrist`
- **Segment:** Wrist/Hand
- **Description:** Quantifies active and passive wrist movements: flexion, extension, radial deviation, ulnar deviation.
- **Has Specific Fields:** ✅ Yes
- **Field Count:** 11
- **Fields:**
  - `flexion_right`: Right wrist flexion (°) (deg) [angle_bilateral]
  - `flexion_left`: Left wrist flexion (°) (deg) [angle_bilateral]
  - `extension_right`: Right wrist extension (°) (deg) [angle_bilateral]
  - `extension_left`: Left wrist extension (°) (deg) [angle_bilateral]
  - `radial_deviation_right`: Right radial deviation (°) (deg) [angle_bilateral]
  - `radial_deviation_left`: Left radial deviation (°) (deg) [angle_bilateral]
  - `ulnar_deviation_right`: Right ulnar deviation (°) (deg) [angle_bilateral]
  - `ulnar_deviation_left`: Left ulnar deviation (°) (deg) [angle_bilateral]
  - `pain_during_movement`: Pain during any movement? [yes_no]
  - `pain_location`: Pain location (if present) [text]
  - `test_notes`: Additional notes [text]
- **Normal Template:** Wrist ROM: Flexion 0-80°, Extension 0-70°, Radial deviation 0-20°, Ulnar deviation 0-30° bilaterally without pain.
- **Sensitivity:** High
- **Specificity:** Moderate

## Suggested Missing Tests (Non-Diagnostic)

These tests are commonly used in physiotherapy practice and could enhance the library:

### High Priority

| Test Name | Segment | Description | Reason |
|-----------|---------|-------------|--------|
| Cervical Distraction Test | Cervical | Manual traction to assess relief of radicular symptoms. | Important test for cervical radiculopathy, complements Spurling test. |
| Prone Knee Bend (PKB) | Lumbar | Neurodynamic test for femoral nerve tension. | Complements SLR for L2-L4 nerve root assessment. |
| Pivot Shift Test | Knee | Dynamic test for anterolateral rotatory instability. | Gold standard for ACL injury, complements Lachman test. |
| Squeeze Test | Ankle | Compression of tibia and fibula to assess syndesmosis integrity. | Important for high ankle sprain assessment. |
| External Rotation Test | Ankle | External rotation stress to assess syndesmosis and deltoid ligament. | Complements squeeze test for syndesmosis assessment. |
| Thomas Test | Hip | Assesses hip flexor tightness and hip extension range. | Fundamental test for hip flexor assessment. |
| Phalen's Test | Wrist/Hand | Wrist flexion to assess median nerve compression (carpal tunnel). | Essential test for carpal tunnel syndrome assessment. |
| Tinel's Sign (Wrist) | Wrist/Hand | Percussion over median nerve to assess for carpal tunnel syndrome. | Complements Phalen's test for carpal tunnel assessment. |
| Thoracic Rotation ROM | Thoracic | Active and passive thoracic rotation range of motion assessment. | Fundamental mobility assessment for thoracic spine. |

### Medium Priority

| Test Name | Segment | Description | Reason |
|-----------|---------|-------------|--------|
| Yergason Test | Shoulder | Assesses biceps tendon involvement with resisted supination and elbow flexion. | Common test for biceps tendinopathy, complements existing shoulder tests. |
| Speed's Test | Shoulder | Resisted forward flexion with elbow extended to assess biceps tendon. | Alternative biceps test, useful for comparison. |
| Cervical Flexion Test | Cervical | Active cervical flexion to assess upper cervical involvement. | Useful for cervicogenic headache assessment. |
| Quadrant Test | Lumbar | Combined extension, rotation, and lateral flexion to assess facet joint involvement. | Useful for mechanical low back pain assessment. |
| Apley Compression Test | Knee | Meniscal assessment with compression and rotation. | Complements McMurray test for meniscal assessment. |
| Thessaly Test | Knee | Weight-bearing rotation test for meniscal involvement. | Functional test for meniscal assessment. |
| Ober's Test | Hip | Assesses IT band tightness and hip abductor flexibility. | Common test for lateral hip pain. |
| Watson Test | Wrist/Hand | Scaphoid shift test for scapholunate instability. | Important for wrist instability assessment. |
| Thoracic Extension ROM | Thoracic | Active and passive thoracic extension range of motion assessment. | Important for postural assessment. |

### Low Priority

| Test Name | Segment | Description | Reason |
|-----------|---------|-------------|--------|
| Scapular Assistance Test | Shoulder | Manual assistance to scapula during arm elevation to assess scapular contribution. | Useful for scapular dyskinesia assessment. |

## Prioritization for Next Iterations

### Phase 1 (Immediate - High Priority)

Focus on completing essential tests for common conditions:

1. **Cervical:** Cervical Distraction Test (complements Spurling)
2. **Lumbar:** Prone Knee Bend (complements SLR for L2-L4)
3. **Knee:** Pivot Shift Test (gold standard for ACL)
4. **Ankle:** Squeeze Test + External Rotation Test (syndesmosis)
5. **Hip:** Thomas Test (fundamental hip flexor assessment)
6. **Wrist:** Phalen's Test + Tinel's Sign (carpal tunnel)
7. **Thoracic:** Thoracic Rotation ROM (fundamental mobility)

### Phase 2 (Short-term - Medium Priority)

Expand coverage for less common but important conditions:

1. **Shoulder:** Yergason, Speed's Test (biceps assessment)
2. **Cervical:** Cervical Flexion Test (headache assessment)
3. **Lumbar:** Quadrant Test (facet joint assessment)
4. **Knee:** Apley Compression, Thessaly (meniscal assessment)
5. **Hip:** Ober's Test (IT band assessment)
6. **Wrist:** Watson Test (instability assessment)
7. **Thoracic:** Thoracic Extension ROM (postural assessment)

### Phase 3 (Long-term - Low Priority)

Specialized tests for specific conditions:

1. **Shoulder:** Scapular Assistance Test (scapular dyskinesia)
2. Additional specialized tests as clinical needs arise

## Library Statistics

- **Total Tests:** 37
- **Tests with Specific Fields:** 32 (86%)
- **Legacy Tests (without fields):** 5 (14%)
- **Total Field Definitions:** 135
- **Average Fields per Test (with fields):** 4.2
