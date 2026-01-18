export type MSKRegion = 'shoulder' | 'cervical' | 'lumbar' | 'knee' | 'ankle' | 'hip' | 'thoracic' | 'wrist';

export type TestFieldKind =
  | 'angle_bilateral'    // e.g. SLR, bilateral rotations
  | 'angle_unilateral'   // e.g. single side
  | 'yes_no'             // e.g. pain reproduced: yes/no
  | 'score_0_10'         // pain scale or other scores
  | 'text';              // qualitative description

export interface TestFieldDefinition {
  id: string;                      // 'right_angle', 'left_angle', 'radicular_pain', etc.
  kind: TestFieldKind;
  label: string;                   // text the physio will see
  unit?: 'deg' | 'cm' | 'score' | 'text' | 'kg'; // Bloque 3A: Agregado 'kg' para tests de fuerza/peso
  normalRange?: { min: number; max: number }; // only if applicable (angles, score)
  notesPlaceholder?: string;       // suggestion of what to note, optional
}

export interface MskTestDefinition {
  id: string;
  name: string;
  region: MSKRegion;
  description: string;
  typicalUse?: string;
  fields?: TestFieldDefinition[];   // NEW (optional for backward compatibility)
  normalTemplate: string;
  sensitivityQualitative?: 'high' | 'moderate' | 'low';
  specificityQualitative?: 'high' | 'moderate' | 'low';
  // Legacy fields (kept for backward compatibility)
  sensitivity?: string;
  specificity?: string;
  defaultNormalNotes?: string;
}

// Legacy interface for backward compatibility
export interface PhysicalTest {
  id: string;
  name: string;
  region: MSKRegion;
  description: string;
  sensitivity?: string;
  specificity?: string;
  defaultNormalNotes?: string;
}

// Extended test definitions with specific fields
export const SLR_LUMBAR: MskTestDefinition = {
  id: 'straight-leg-raise',
  name: 'Straight Leg Raise (SLR)',
  region: 'lumbar',
  description: 'Assesses possible L4–S1 radicular irritation with passive leg elevation.',
  typicalUse: 'Patients with low back pain radiating to lower limb.',
  fields: [
    {
      id: 'right_angle',
      kind: 'angle_bilateral',
      label: 'Right leg angle achieved',
      unit: 'deg',
      normalRange: { min: 0, max: 70 },
      notesPlaceholder: 'Note if lumbar or radicular pain appears.',
    },
    {
      id: 'left_angle',
      kind: 'angle_bilateral',
      label: 'Left leg angle achieved',
      unit: 'deg',
      normalRange: { min: 0, max: 70 },
      notesPlaceholder: 'Note if lumbar or radicular pain appears.',
    },
    {
      id: 'radicular_pain',
      kind: 'yes_no',
      label: 'Radicular pain reproduced?',
    },
    {
      id: 'pain_description',
      kind: 'text',
      label: 'Pain description',
      notesPlaceholder: 'Location, pain type, radiation, etc.',
    },
  ],
  normalTemplate: 'SLR: 0–70° bilaterally without radicular pain or radiation.',
  sensitivityQualitative: 'high',
  specificityQualitative: 'moderate',
  sensitivity: 'High',
  specificity: 'Moderate',
  defaultNormalNotes:
    'SLR within normal limits bilaterally (0–70° hip flexion) without reproduction of radicular pain.',
};

export const CERVICAL_ROTATION: MskTestDefinition = {
  id: 'cervical-rotation-active',
  name: 'Cervical Active Rotation',
  region: 'cervical',
  description: 'Assesses cervical rotation range of motion.',
  typicalUse: 'Mechanical neck pain, global mobility assessment.',
  fields: [
    {
      id: 'right_angle',
      kind: 'angle_bilateral',
      label: 'Right cervical rotation',
      unit: 'deg',
      normalRange: { min: 0, max: 80 },
      notesPlaceholder: 'Note if pain, stiffness, or dizziness appears.',
    },
    {
      id: 'left_angle',
      kind: 'angle_bilateral',
      label: 'Left cervical rotation',
      unit: 'deg',
      normalRange: { min: 0, max: 80 },
      notesPlaceholder: 'Note if pain, stiffness, or dizziness appears.',
    },
    {
      id: 'pain_description',
      kind: 'text',
      label: 'Pain or associated symptoms description',
      notesPlaceholder: 'Location, pain type, radiation, associated symptoms.',
    },
  ],
  normalTemplate: 'Cervical active rotation: 0–80° bilaterally without pain or neurological symptoms.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'moderate',
  sensitivity: 'Moderate',
  specificity: 'Moderate',
  defaultNormalNotes:
    'Cervical rotation active range of motion within normal limits bilaterally (0–80°) without pain or neurological symptoms.',
};

export const EMPTY_CAN_SHOULDER: MskTestDefinition = {
  id: 'empty-can',
  name: 'Empty Can Test',
  region: 'shoulder',
  description: 'Assesses supraspinatus involvement and possible tendinopathy.',
  typicalUse: 'Patients with painful arc of shoulder or suspected supraspinatus tendinopathy.',
  fields: [
    {
      id: 'pain_present',
      kind: 'yes_no',
      label: 'Pain present during test?',
    },
    {
      id: 'weakness_present',
      kind: 'yes_no',
      label: 'Weakness observed against resistance?',
    },
    {
      id: 'pain_description',
      kind: 'text',
      label: 'Pain description',
      notesPlaceholder: 'Location (anterolateral, lateral), intensity, type.',
    },
  ],
  normalTemplate: 'Empty Can: no pain or weakness against resistance.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'moderate',
  sensitivity: 'Moderate',
  specificity: 'Moderate',
  defaultNormalNotes:
    'Resisted abduction in the scapular plane maintained without pain or strength deficit compared to the contralateral side.',
};

// Lumbar - Slump Test (with fields)
export const SLUMP_LUMBAR: MskTestDefinition = {
  id: 'slump_lumbar',
  name: 'Slump Test',
  region: 'lumbar',
  description: 'Neurodynamic test in seated position for radicular irritation and neural tension in lower limbs.',
  typicalUse: 'Patients with low back pain radiating, neuropathic symptoms, or suspected radicular involvement.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Side tested (right/left/bilateral)',
      notesPlaceholder: 'Indicate if one side at a time or both.',
    },
    {
      id: 'symptom_reproduction',
      kind: 'yes_no',
      label: 'Patient\'s typical symptoms reproduced?',
    },
    {
      id: 'symptom_description',
      kind: 'text',
      label: 'Symptom description',
      notesPlaceholder: 'Location, pain type, tingling, numbness, etc.',
    },
    {
      id: 'structural_vs_neural',
      kind: 'text',
      label: 'Response to cervical release (structural/neural differentiation)',
      notesPlaceholder: 'Note if symptoms change when releasing cervical flexion.',
    },
  ],
  normalTemplate: 'Slump Test: no radicular symptoms or paresthesias reproduced with complete sequence.',
  sensitivityQualitative: 'high',
  specificityQualitative: 'moderate',
  sensitivity: 'High',
  specificity: 'Moderate',
  defaultNormalNotes:
    'Seated slump sequence performed without distal neural symptoms or reproduction of the primary complaint.',
};

// Lumbar - Prone Instability Test
export const PRONE_INSTABILITY_LUMBAR: MskTestDefinition = {
  id: 'prone_instability_lumbar',
  name: 'Prone Instability Test',
  region: 'lumbar',
  description: 'Assesses contribution of lumbar segmental instability to pain in extension.',
  typicalUse: 'Patients with mechanical low back pain, especially moderate relief with muscular support.',
  fields: [
    {
      id: 'pain_prone_feet_supported',
      kind: 'yes_no',
      label: 'Pain with PA pressure in prone with feet on floor',
    },
    {
      id: 'pain_prone_feet_lifted',
      kind: 'yes_no',
      label: 'Pain with feet elevated and extensor activation',
    },
    {
      id: 'pain_change_description',
      kind: 'text',
      label: 'Pain change between both positions',
      notesPlaceholder: 'E.g.: pain decreases when elevating feet and activating extensor musculature.',
    },
  ],
  normalTemplate: 'Prone Instability Test: no significant pain difference between positions; negative for segmental instability.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'moderate',
  sensitivity: 'Moderate',
  specificity: 'Moderate',
};

// Hip - FABER Test (Patrick's)
export const FABER_HIP: MskTestDefinition = {
  id: 'hip-faber',
  name: 'FABER Test (Patrick\'s)',
  region: 'hip',
  description: 'Flexion, abduction and external rotation of the hip to assess for hip or sacroiliac joint-related pain.',
  typicalUse: 'Screening for hip or SI joint involvement in groin, buttock or low back pain.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Side tested',
    },
    {
      id: 'knee_height_relative',
      kind: 'text',
      label: 'Knee height relative to contralateral side',
      notesPlaceholder: 'E.g. similar, slightly higher, clearly higher…',
    },
    {
      id: 'pain_reproduced',
      kind: 'yes_no',
      label: 'Pain reproduced',
    },
    {
      id: 'pain_region',
      kind: 'text',
      label: 'Region of pain',
      notesPlaceholder: 'E.g. anterior hip/groin, sacroiliac region, lateral hip…',
    },
  ],
  normalTemplate: 'FABER test with knee height comparable to the opposite side and no reproduction of the patient\'s usual hip or SI joint pain.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'low',
  sensitivity: 'Moderate',
  specificity: 'Low',
};

// Hip - FADIR Test
export const FADIR_HIP: MskTestDefinition = {
  id: 'hip-fadir',
  name: 'FADIR Test',
  region: 'hip',
  description: 'Flexion, adduction and internal rotation maneuver used to provoke anterior hip/groin symptoms.',
  typicalUse: 'Assessment of intra-articular hip pathology or femoroacetabular impingement signs.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Side tested',
    },
    {
      id: 'pain_reproduced',
      kind: 'yes_no',
      label: 'Anterior hip/groin pain reproduced',
    },
    {
      id: 'pain_description',
      kind: 'text',
      label: 'Symptom description',
      notesPlaceholder: 'E.g. sharp anterior hip pain, tightness only, no symptoms…',
    },
  ],
  normalTemplate: 'FADIR test performed to available range without reproduction of the patient\'s usual anterior hip or groin pain.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'moderate',
  sensitivity: 'Moderate',
  specificity: 'Moderate',
};

// Hip - Trendelenburg Sign
export const TRENDELENBURG_HIP: MskTestDefinition = {
  id: 'hip-trendelenburg',
  name: 'Trendelenburg Sign',
  region: 'hip',
  description: 'Single-leg stance test to observe pelvic drop and assess hip abductor function.',
  typicalUse: 'Screening for gluteus medius weakness or hip abductor dysfunction.',
  fields: [
    {
      id: 'stance_side',
      kind: 'text',
      label: 'Stance side',
      notesPlaceholder: 'E.g. right stance, left stance…',
    },
    {
      id: 'pelvic_drop_present',
      kind: 'yes_no',
      label: 'Contralateral pelvic drop observed',
    },
    {
      id: 'compensation_observed',
      kind: 'text',
      label: 'Compensations observed',
      notesPlaceholder: 'E.g. trunk lean over stance leg, increased lateral sway, none…',
    },
  ],
  normalTemplate: 'Trendelenburg sign negative: single-leg stance maintained without contralateral pelvic drop and without significant trunk compensation.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'moderate',
  sensitivity: 'Moderate',
  specificity: 'Moderate',
};

// Knee - Lachman Test
export const LACHMAN_KNEE: MskTestDefinition = {
  id: 'knee-lachman',
  name: 'Lachman Test',
  region: 'knee',
  description: 'Anterior translation test of the tibia relative to the femur at ~20–30° flexion to assess anterior cruciate ligament integrity.',
  typicalUse: 'Assessment of ACL integrity in patients with acute or chronic knee instability.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Side tested',
      notesPlaceholder: 'Right or left',
    },
    {
      id: 'anterior_translation_side',
      kind: 'text',
      label: 'Anterior translation (tested vs contralateral side)',
      notesPlaceholder: 'E.g. symmetric, slightly increased, clearly increased…',
    },
    {
      id: 'end_feel_quality',
      kind: 'text',
      label: 'End-feel quality',
      notesPlaceholder: 'E.g. firm, soft, absent…',
    },
    {
      id: 'patient_symptoms',
      kind: 'text',
      label: 'Symptom response',
      notesPlaceholder: 'E.g. sense of giving way, no symptoms…',
    },
  ],
  normalTemplate: 'Lachman test with symmetric anterior translation compared to the contralateral knee and a firm ligamentous end feel, without reproduction of instability symptoms.',
  sensitivityQualitative: 'high',
  specificityQualitative: 'moderate',
  sensitivity: 'High',
  specificity: 'Moderate',
};

// Knee - McMurray Test
export const MCMURRAY_KNEE: MskTestDefinition = {
  id: 'knee-mcmurray',
  name: 'McMurray Test',
  region: 'knee',
  description: 'Combination of knee flexion, extension and rotation to assess for meniscal click and symptom reproduction.',
  typicalUse: 'Screening for meniscal involvement in patients with knee pain or locking.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Side tested',
    },
    {
      id: 'click_or_clunk_present',
      kind: 'yes_no',
      label: 'Mechanical click/clunk reproduced',
    },
    {
      id: 'pain_reproduced',
      kind: 'yes_no',
      label: 'Pain reproduced during maneuver',
    },
    {
      id: 'symptom_description',
      kind: 'text',
      label: 'Symptom description',
      notesPlaceholder: 'E.g. joint line pain, locking sensation, no symptoms…',
    },
  ],
  normalTemplate: 'McMurray test performed without mechanical click or clunk and without reproduction of the patient\'s usual joint line pain or locking.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'moderate',
  sensitivity: 'Moderate',
  specificity: 'Moderate',
};

// Knee - Patellofemoral Grind Test (Clarke's)
export const PATELLOFEMORAL_GRIND_KNEE: MskTestDefinition = {
  id: 'knee-patellofemoral-grind',
  name: 'Patellofemoral Grind Test (Clarke\'s)',
  region: 'knee',
  description: 'Assessment of patellofemoral joint symptoms by applying gentle pressure to the patella during quadriceps contraction.',
  typicalUse: 'Assessment of patellofemoral pain in anterior knee pain presentations.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Side tested',
    },
    {
      id: 'pain_reproduced',
      kind: 'yes_no',
      label: 'Anterior knee pain reproduced',
    },
    {
      id: 'pain_location',
      kind: 'text',
      label: 'Pain location',
      notesPlaceholder: 'E.g. retro-patellar, peri-patellar…',
    },
    {
      id: 'crepitus_noted',
      kind: 'yes_no',
      label: 'Crepitus noted during test',
    },
  ],
  normalTemplate: 'Patellofemoral grind test performed without reproduction of significant anterior knee pain and without marked crepitus.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'low',
  sensitivity: 'Moderate',
  specificity: 'Low',
};

// Ankle - Anterior Drawer Test
export const ANKLE_ANTERIOR_DRAWER: MskTestDefinition = {
  id: 'ankle-anterior-drawer',
  name: 'Anterior Drawer Test (Ankle)',
  region: 'ankle',
  description: 'Anterior translation test of the talus relative to the tibia to assess anterior talofibular ligament integrity.',
  typicalUse: 'Assessment of lateral ankle ligament integrity following inversion sprain.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Side tested',
    },
    {
      id: 'translation_relative',
      kind: 'text',
      label: 'Anterior translation compared to contralateral side',
      notesPlaceholder: 'E.g. symmetric, slightly increased, clearly increased…',
    },
    {
      id: 'end_feel_quality',
      kind: 'text',
      label: 'End-feel quality',
      notesPlaceholder: 'E.g. firm, soft, absent…',
    },
    {
      id: 'symptom_response',
      kind: 'text',
      label: 'Symptom response',
      notesPlaceholder: 'E.g. sense of giving way, local discomfort, no symptoms…',
    },
  ],
  normalTemplate: 'Ankle anterior drawer test with symmetric translation compared to the opposite side, firm ligamentous end feel and no reproduction of instability symptoms.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'moderate',
  sensitivity: 'Moderate',
  specificity: 'Moderate',
  defaultNormalNotes:
    'Anterior talar translation shows firm ligamentous end point without apprehension.',
};

// Ankle - Thompson Test (Achilles Squeeze)
export const THOMPSON_ANKLE: MskTestDefinition = {
  id: 'ankle-thompson',
  name: 'Thompson Test',
  region: 'ankle',
  description: 'Calf squeeze test to assess plantarflexion response, used to screen for Achilles tendon rupture.',
  typicalUse: 'Initial screening for suspected Achilles tendon rupture or significant tendon injury.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Side tested',
    },
    {
      id: 'plantarflexion_present',
      kind: 'yes_no',
      label: 'Active plantarflexion observed on calf squeeze',
    },
    {
      id: 'comparison_to_other_side',
      kind: 'text',
      label: 'Comparison to contralateral side',
      notesPlaceholder: 'E.g. similar plantarflexion, clearly reduced, absent…',
    },
  ],
  normalTemplate: 'Thompson test negative: visible and symmetrical plantarflexion response on calf squeeze compared to the contralateral side.',
  sensitivityQualitative: 'high',
  specificityQualitative: 'high',
  sensitivity: 'High',
  specificity: 'High',
};

// Shoulder - Neer Impingement Sign
export const NEER_SHOULDER: MskTestDefinition = {
  id: 'shoulder-neer-impingement',
  name: 'Neer Impingement Sign',
  region: 'shoulder',
  description: 'Passive forward elevation of the shoulder in internal rotation to assess for subacromial pain provocation.',
  typicalUse: 'Screening for subacromial pain or impingement in patients with shoulder pain.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Side tested',
      notesPlaceholder: 'Right, left, or bilateral (performed separately)',
    },
    {
      id: 'pain_reproduced',
      kind: 'yes_no',
      label: 'Pain reproduced in forward elevation',
    },
    {
      id: 'pain_location',
      kind: 'text',
      label: 'Pain location',
      notesPlaceholder: 'E.g. anterior shoulder, lateral deltoid region…',
    },
    {
      id: 'pain_intensity',
      kind: 'score_0_10',
      label: 'Pain intensity (0–10) at end range',
    },
  ],
  normalTemplate: 'Neer impingement sign performed with full passive forward elevation and no reproduction of the patient\'s typical subacromial or lateral shoulder pain.',
  sensitivityQualitative: 'high',
  specificityQualitative: 'low',
  sensitivity: 'High',
  specificity: 'Low',
};

// Shoulder - Hawkins-Kennedy Test
export const HAWKINS_KENNEDY_SHOULDER: MskTestDefinition = {
  id: 'shoulder-hawkins-kennedy',
  name: 'Hawkins–Kennedy Test',
  region: 'shoulder',
  description: 'Passive forward flexion to 90° with forced internal rotation to assess for subacromial pain provocation.',
  typicalUse: 'Assessment of subacromial pain syndrome or impingement in patients with shoulder pain.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Side tested',
      notesPlaceholder: 'Right, left, or bilateral (performed separately)',
    },
    {
      id: 'pain_reproduced',
      kind: 'yes_no',
      label: 'Pain reproduced with internal rotation',
    },
    {
      id: 'pain_location',
      kind: 'text',
      label: 'Pain location',
      notesPlaceholder: 'E.g. anterior shoulder, lateral arm…',
    },
    {
      id: 'comparison_to_other_side',
      kind: 'text',
      label: 'Comparison to contralateral side',
      notesPlaceholder: 'E.g. similar, less, more, only symptomatic side positive…',
    },
  ],
  normalTemplate: 'Hawkins–Kennedy test negative bilaterally: no reproduction of the patient\'s typical shoulder pain and no marked difference between sides.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'moderate',
  sensitivity: 'Moderate',
  specificity: 'Moderate',
};

// Shoulder - Drop Arm Test
export const DROP_ARM_SHOULDER: MskTestDefinition = {
  id: 'drop_arm_shoulder',
  name: 'Drop Arm Test',
  region: 'shoulder',
  description: 'Assesses rotator cuff integrity, especially supraspinatus, during eccentric arm descent.',
  typicalUse: 'Suspected significant rotator cuff tear, marked weakness, or inability to control descent.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Shoulder tested',
    },
    {
      id: 'control_of_descent',
      kind: 'text',
      label: 'Control of descent',
      notesPlaceholder: 'Controlled, sudden loss, inability to hold, etc.',
    },
    {
      id: 'pain_present',
      kind: 'yes_no',
      label: 'Pain during descent?',
    },
    {
      id: 'pain_location',
      kind: 'text',
      label: 'Pain location',
      notesPlaceholder: 'Deltoid area, suprascapular, anterolateral, etc.',
    },
  ],
  normalTemplate: 'Drop Arm: controlled descent without significant pain or sudden loss of control.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'high',
  sensitivity: 'Moderate',
  specificity: 'High',
};

// Shoulder - Apprehension / Relocation Test
export const APPREHENSION_RELOCATION_SHOULDER: MskTestDefinition = {
  id: 'apprehension_relocation_shoulder',
  name: 'Apprehension / Relocation Test',
  region: 'shoulder',
  description: 'Assesses apprehension or anterior shoulder instability in abduction and external rotation.',
  typicalUse: 'History of dislocation, sensation of instability or apprehension with overhead movements.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Shoulder tested',
    },
    {
      id: 'apprehension_present',
      kind: 'yes_no',
      label: 'Apprehension or fear of dislocation?',
    },
    {
      id: 'pain_vs_apprehension',
      kind: 'text',
      label: 'Pain vs apprehension',
      notesPlaceholder: 'Describe if pain predominates, sensation of "coming out", or both.',
    },
    {
      id: 'relocation_effect',
      kind: 'text',
      label: 'Response to relocation maneuver',
      notesPlaceholder: 'E.g.: apprehension decreases when applying posterior pressure.',
    },
  ],
  normalTemplate: 'Apprehension/Relocation: no apprehension or perceived instability in abduction and external rotation.',
  sensitivityQualitative: 'high',
  specificityQualitative: 'moderate',
  sensitivity: 'High',
  specificity: 'Moderate',
};

// Cervical - Spurling Test
export const SPURLING_CERVICAL: MskTestDefinition = {
  id: 'spurling_cervical',
  name: 'Spurling Test',
  region: 'cervical',
  description: 'Cervical compression in extension and rotation to reproduce radicular pain.',
  typicalUse: 'Patients with pain radiating to arm, paresthesias, or suspected cervical radiculopathy.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Side of lateral flexion/rotation',
    },
    {
      id: 'radicular_pain_present',
      kind: 'yes_no',
      label: 'Radicular pain reproduced?',
    },
    {
      id: 'pain_distribution',
      kind: 'text',
      label: 'Pain/paresthesia distribution',
      notesPlaceholder: 'Approximate dermatomes, arm or hand area, etc.',
    },
    {
      id: 'local_neck_pain',
      kind: 'yes_no',
      label: 'Local neck pain only without radiation?',
    },
  ],
  normalTemplate: 'Spurling: no reproduction of radicular symptoms; may have mild local cervical discomfort without radiation.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'high',
  sensitivity: 'Moderate',
  specificity: 'High',
};

// Cervical - ULTT A
export const ULTT_A_CERVICAL: MskTestDefinition = {
  id: 'ultt_a_cervical',
  name: 'ULNTT / ULTT A (median)',
  region: 'cervical',
  description: 'Neural tension test for median nerve with differentiation through cervical movements.',
  typicalUse: 'Neuropathic symptoms in upper limb, tingling, paresthesias compatible with median distribution.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Upper limb tested',
    },
    {
      id: 'symptom_reproduction',
      kind: 'yes_no',
      label: 'Patient\'s typical symptoms reproduced?',
    },
    {
      id: 'symptom_description',
      kind: 'text',
      label: 'Symptom description',
      notesPlaceholder: 'Tingling, numbness, burning pain, etc.',
    },
    {
      id: 'cervical_sensitization_response',
      kind: 'text',
      label: 'Response to contralateral/ipsilateral cervical lateral flexion',
      notesPlaceholder: 'E.g.: symptoms increase with contralateral flexion, decrease with ipsilateral.',
    },
  ],
  normalTemplate: 'ULNTT A: mild neural tension without reproduction of typical symptoms and symmetric bilateral response.',
  sensitivityQualitative: 'high',
  specificityQualitative: 'moderate',
  sensitivity: 'High',
  specificity: 'Moderate',
};

// Knee - Valgus Stress Test (MCL)
export const VALGUS_STRESS_KNEE: MskTestDefinition = {
  id: 'valgus_stress_knee',
  name: 'Valgus Stress Test (MCL)',
  region: 'knee',
  description: 'Assesses medial collateral ligament integrity at 0° and 30° of flexion.',
  typicalUse: 'Suspected MCL injury following valgus trauma or medial knee pain.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Knee tested',
    },
    {
      id: 'pain_medial',
      kind: 'yes_no',
      label: 'Medial pain during test?',
    },
    {
      id: 'laxity_30deg',
      kind: 'text',
      label: 'Laxity at 30° flexion',
      notesPlaceholder: 'Similar to healthy side, slightly increased, clearly increased.',
    },
    {
      id: 'laxity_0deg',
      kind: 'text',
      label: 'Laxity in extension (0°)',
      notesPlaceholder: 'Useful to assess associated capsular/cruciate ligament involvement.',
    },
  ],
  normalTemplate: 'Valgus stress: no relevant medial pain or increased laxity compared to contralateral side.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'moderate',
  sensitivity: 'Moderate',
  specificity: 'Moderate',
};

// Knee - Varus Stress Test (LCL)
export const VARUS_STRESS_KNEE: MskTestDefinition = {
  id: 'varus_stress_knee',
  name: 'Varus Stress Test (LCL)',
  region: 'knee',
  description: 'Assesses lateral collateral ligament integrity at 0° and 30° of flexion.',
  typicalUse: 'Lateral knee pain, varus trauma, or lateral instability.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Knee tested',
    },
    {
      id: 'pain_lateral',
      kind: 'yes_no',
      label: 'Lateral pain during test?',
    },
    {
      id: 'laxity_30deg',
      kind: 'text',
      label: 'Laxity at 30° flexion',
      notesPlaceholder: 'Compare with contralateral knee.',
    },
    {
      id: 'laxity_0deg',
      kind: 'text',
      label: 'Laxity in extension (0°)',
    },
  ],
  normalTemplate: 'Varus stress: no significant lateral pain or increased laxity relative to contralateral side.',
  sensitivityQualitative: 'low',
  specificityQualitative: 'moderate',
  sensitivity: 'Low',
  specificity: 'Moderate',
};

// Ankle - Talar Tilt Test
export const TALAR_TILT_ANKLE: MskTestDefinition = {
  id: 'talar_tilt_ankle',
  name: 'Talar Tilt Test',
  region: 'ankle',
  description: 'Assesses lateral ankle ligament integrity through varus/valgus talar tilt.',
  typicalUse: 'Lateral ankle sprains, sensation of instability, peroneal or medial pain.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Ankle tested',
    },
    {
      id: 'laxity_varus',
      kind: 'text',
      label: 'Laxity in varus',
      notesPlaceholder: 'Compare with healthy side: similar, slightly increased, very increased.',
    },
    {
      id: 'laxity_valgus',
      kind: 'text',
      label: 'Laxity in valgus (deltoid)',
      notesPlaceholder: 'Optional depending on clinical case.',
    },
    {
      id: 'pain_location',
      kind: 'text',
      label: 'Pain location during test',
      notesPlaceholder: 'Lateral, medial, diffuse, etc.',
    },
  ],
  normalTemplate: 'Talar tilt: mobility comparable to contralateral side without significant pain or clear increased laxity.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'moderate',
  sensitivity: 'Moderate',
  specificity: 'Moderate',
};

// Thoracic - PA Spring Test
export const THORACIC_PA_SPRING: MskTestDefinition = {
  id: 'thoracic_pa_spring',
  name: 'PA Spring Test (thoracic)',
  region: 'thoracic',
  description: 'Segmental posteroanterior pressure on thoracic spine to assess mobility and local sensitivity.',
  typicalUse: 'Mechanical thoracic pain, dorsal stiffness, assessment of hypo- or hypermobile segments.',
  fields: [
    {
      id: 'segments_evaluated',
      kind: 'text',
      label: 'Segments evaluated',
      notesPlaceholder: 'E.g.: T3–T8.',
    },
    {
      id: 'hypomobile_segments',
      kind: 'text',
      label: 'Hypomobile and painful segments',
      notesPlaceholder: 'E.g.: T5–T6 with reproducible local pain.',
    },
    {
      id: 'hypermobile_segments',
      kind: 'text',
      label: 'Hypermobile segments (if any)',
      notesPlaceholder: 'Optional if increased laxity is detected.',
    },
  ],
  normalTemplate: 'Thoracic PA: symmetric segmental mobility without significant pain or evident hypermobility.',
  sensitivityQualitative: 'low',
  specificityQualitative: 'low',
  sensitivity: 'Low',
  specificity: 'Low',
};

// Cervical - CFRT
export const CFRT_CERVICAL: MskTestDefinition = {
  id: 'cfrt_cervical',
  name: 'Cervical Flexion-Rotation Test (CFRT)',
  region: 'cervical',
  description: 'Assesses C1–C2 contribution to cervical rotation in maximum flexion position.',
  typicalUse: 'Cervicogenic headaches, high cervical rotation limitation, marked range asymmetries.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Side compared (right vs left)',
    },
    {
      id: 'rotation_right_deg',
      kind: 'text',
      label: 'Approximate right rotation',
      notesPlaceholder: 'E.g.: ~40° in maximum flexion.',
    },
    {
      id: 'rotation_left_deg',
      kind: 'text',
      label: 'Approximate left rotation',
      notesPlaceholder: 'E.g.: ~30° in maximum flexion.',
    },
    {
      id: 'headache_reproduction',
      kind: 'yes_no',
      label: 'Patient\'s typical headache reproduced?',
    },
  ],
  normalTemplate: 'CFRT: cervical rotation in flexion relatively symmetric without clear reproduction of typical headache.',
  sensitivityQualitative: 'high',
  specificityQualitative: 'high',
  sensitivity: 'High',
  specificity: 'High',
};

// Phase 1 High Priority Tests - Missing Tests Implementation

// Ankle - Windlass Test
export const WINDLASS_ANKLE: MskTestDefinition = {
  id: 'windlass_ankle',
  name: 'Windlass Test',
  region: 'ankle',
  description: 'Assesses plantar fascia integrity by dorsiflexing the first metatarsophalangeal joint while maintaining ankle position.',
  typicalUse: 'Patients with plantar heel pain, suspected plantar fasciitis, or medial arch pain.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Side tested',
      notesPlaceholder: 'Right or left',
    },
    {
      id: 'pain_reproduced',
      kind: 'yes_no',
      label: 'Plantar heel or arch pain reproduced?',
    },
    {
      id: 'pain_location',
      kind: 'text',
      label: 'Pain location',
      notesPlaceholder: 'Medial calcaneal tubercle, medial arch, along plantar fascia...',
    },
    {
      id: 'pain_intensity',
      kind: 'score_0_10',
      label: 'Pain intensity (0-10)',
      unit: 'score',
      normalRange: { min: 0, max: 0 },
    },
    {
      id: 'comparison_side',
      kind: 'text',
      label: 'Comparison to contralateral side',
      notesPlaceholder: 'Similar response, more painful, only symptomatic side positive...',
    },
  ],
  normalTemplate: 'Windlass test: passive first MTP dorsiflexion performed without reproduction of plantar heel or arch pain, symmetric to contralateral side.',
  sensitivityQualitative: 'high',
  specificityQualitative: 'moderate',
  sensitivity: 'High',
  specificity: 'Moderate',
  defaultNormalNotes: 'Windlass test negative bilaterally without reproduction of plantar fascia pain.',
};

// Wrist/Hand - Phalen's Test
export const PHALEN_WRIST: MskTestDefinition = {
  id: 'phalen_wrist',
  name: 'Phalen\'s Test',
  region: 'wrist',
  description: 'Wrist flexion test to assess median nerve compression (carpal tunnel syndrome).',
  typicalUse: 'Patients with hand numbness, tingling, or pain in median nerve distribution, suspected carpal tunnel syndrome.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Side tested',
      notesPlaceholder: 'Right, left, or bilateral (performed separately)',
    },
    {
      id: 'symptom_reproduction',
      kind: 'yes_no',
      label: 'Patient\'s typical symptoms reproduced?',
    },
    {
      id: 'time_to_symptoms',
      kind: 'text',
      label: 'Time to symptom onset (seconds)',
      notesPlaceholder: 'E.g., symptoms appear after 30 seconds, immediately, after 60 seconds...',
    },
    {
      id: 'symptom_distribution',
      kind: 'text',
      label: 'Symptom distribution',
      notesPlaceholder: 'Thumb, index, middle, radial half of ring finger (median distribution)...',
    },
    {
      id: 'comparison_side',
      kind: 'text',
      label: 'Comparison to contralateral side',
      notesPlaceholder: 'Similar, more symptomatic, only one side positive...',
    },
  ],
  normalTemplate: 'Phalen\'s test: maintained wrist flexion for 60 seconds without reproduction of median nerve symptoms, symmetric bilateral response.',
  sensitivityQualitative: 'high',
  specificityQualitative: 'moderate',
  sensitivity: 'High',
  specificity: 'Moderate',
  defaultNormalNotes: 'Phalen\'s test negative bilaterally without reproduction of median nerve symptoms during maintained wrist flexion.',
};

// Knee - Thessaly Test (converted from legacy to with fields)
export const THESSALY_KNEE: MskTestDefinition = {
  id: 'thessaly_knee',
  name: 'Thessaly Test',
  region: 'knee',
  description: 'Weight-bearing rotation test at 5° and 20° knee flexion to assess meniscal involvement and internal knee structure sensitivity.',
  typicalUse: 'Patients with knee pain, suspected meniscal involvement, or internal derangement, especially in weight-bearing positions.',
  fields: [
    {
      id: 'side_tested',
      kind: 'text',
      label: 'Knee tested',
      notesPlaceholder: 'Right or left',
    },
    {
      id: 'pain_5deg',
      kind: 'yes_no',
      label: 'Pain at 5° flexion during rotation?',
    },
    {
      id: 'pain_20deg',
      kind: 'yes_no',
      label: 'Pain at 20° flexion during rotation?',
    },
    {
      id: 'clicking_or_locking',
      kind: 'yes_no',
      label: 'Mechanical clicking or locking sensation?',
    },
    {
      id: 'instability_sensation',
      kind: 'yes_no',
      label: 'Sensation of giving way or instability?',
    },
    {
      id: 'symptom_description',
      kind: 'text',
      label: 'Symptom description',
      notesPlaceholder: 'Joint line pain, locking, clicking, instability, no symptoms...',
    },
  ],
  normalTemplate: 'Thessaly test: weight-bearing rotation at 5° and 20° knee flexion tolerated without pain, clicking, locking, or instability.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'moderate',
  sensitivity: 'Moderate',
  specificity: 'Moderate',
  defaultNormalNotes: 'Weight-bearing rotation at 5° and 20° tolerated without pain, clicking, or instability.',
};

// Cervical - Distraction Test (converted from legacy to with fields)
export const CERVICAL_DISTRACTION: MskTestDefinition = {
  id: 'cervical_distraction',
  name: 'Cervical Distraction Test',
  region: 'cervical',
  description: 'Manual traction applied to cervical spine to assess relief of radicular symptoms and nerve root compression.',
  typicalUse: 'Patients with cervical radiculopathy, arm pain, paresthesias, or suspected nerve root compression.',
  fields: [
    {
      id: 'symptom_relief',
      kind: 'yes_no',
      label: 'Radicular symptoms relieved with traction?',
    },
    {
      id: 'pain_reduction',
      kind: 'text',
      label: 'Pain reduction (if applicable)',
      notesPlaceholder: 'Complete relief, partial relief, no change, worse...',
    },
    {
      id: 'traction_force',
      kind: 'text',
      label: 'Traction force applied',
      notesPlaceholder: 'Light, moderate, or approximate weight (e.g., 5-10 kg)...',
    },
    {
      id: 'adverse_response',
      kind: 'yes_no',
      label: 'Adverse response (dizziness, nausea)?',
    },
    {
      id: 'comparison_baseline',
      kind: 'text',
      label: 'Comparison to baseline symptoms',
      notesPlaceholder: 'Symptoms decrease, no change, symptoms increase...',
    },
  ],
  normalTemplate: 'Cervical distraction test: gentle manual traction provides comfortable relief of radicular symptoms without adverse response or dizziness.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'moderate',
  sensitivity: 'Moderate',
  specificity: 'Moderate',
  defaultNormalNotes: 'Gentle traction provides comfortable relief without adverse response or dizziness.',
};

// Wrist/Hand Tests
export const FINKELSTEIN_WRIST: MskTestDefinition = {
  id: 'finkelstein_wrist',
  name: 'Finkelstein\'s Test',
  region: 'wrist',
  description: 'Assesses for De Quervain\'s tenosynovitis by ulnar deviation with thumb in fist.',
  typicalUse: 'Patients with radial wrist pain, suspected De Quervain\'s tenosynovitis.',
  fields: [
    {
      id: 'pain_reproduced',
      kind: 'yes_no',
      label: 'Pain reproduced during test?',
    },
    {
      id: 'pain_location',
      kind: 'text',
      label: 'Pain location',
      notesPlaceholder: 'Radial styloid, first dorsal compartment, etc.',
    },
    {
      id: 'pain_intensity',
      kind: 'score_0_10',
      label: 'Pain intensity (0-10)',
      unit: 'score',
      normalRange: { min: 0, max: 0 },
    },
    {
      id: 'test_notes',
      kind: 'text',
      label: 'Additional notes',
      notesPlaceholder: 'Severity, quality of pain, comparison to contralateral side.',
    },
  ],
  normalTemplate: 'Finkelstein\'s test: negative for pain reproduction at radial styloid or first dorsal compartment.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'moderate',
  sensitivity: 'Moderate',
  specificity: 'Moderate',
  defaultNormalNotes: 'Finkelstein\'s test negative bilaterally without reproduction of radial wrist pain.',
};

export const UCL_STRESS_WRIST: MskTestDefinition = {
  id: 'ucl_stress_wrist',
  name: 'Ulnar Collateral Ligament (UCL) Stress Test',
  region: 'wrist',
  description: 'Assesses the integrity of the ulnar collateral ligament of the wrist with radial deviation stress.',
  typicalUse: 'Patients with ulnar wrist pain, suspected UCL sprain or instability.',
  fields: [
    {
      id: 'pain_reproduced',
      kind: 'yes_no',
      label: 'Pain reproduced during stress?',
    },
    {
      id: 'laxity_present',
      kind: 'yes_no',
      label: 'Laxity or instability detected?',
    },
    {
      id: 'comparison_side',
      kind: 'text',
      label: 'Comparison to contralateral side',
      notesPlaceholder: 'More lax than opposite, similar, etc.',
    },
    {
      id: 'pain_location',
      kind: 'text',
      label: 'Pain location',
      notesPlaceholder: 'Ulnar side of wrist, TFCC region, etc.',
    },
    {
      id: 'test_notes',
      kind: 'text',
      label: 'Additional notes',
      notesPlaceholder: 'End feel, quality of laxity, associated symptoms.',
    },
  ],
  normalTemplate: 'UCL stress test: negative for pain and laxity, stable compared to contralateral side.',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'moderate',
  sensitivity: 'Moderate',
  specificity: 'Moderate',
  defaultNormalNotes: 'UCL stress test negative bilaterally without pain reproduction or excessive laxity.',
};

export const GRIP_STRENGTH_WRIST: MskTestDefinition = {
  id: 'grip_strength_wrist',
  name: 'Grip Strength Testing',
  region: 'wrist',
  description: 'Establishes baseline grip strength and identifies deficits using dynamometer.',
  typicalUse: 'Assessment of functional hand strength, baseline for treatment progress, comparison between sides.',
  fields: [
    {
      id: 'right_grip_kg',
      kind: 'angle_bilateral',
      label: 'Right grip strength (kg)',
      unit: 'kg',
      notesPlaceholder: 'Record best of 3 attempts. Compare to normative values for age/gender.',
    },
    {
      id: 'left_grip_kg',
      kind: 'angle_bilateral',
      label: 'Left grip strength (kg)',
      unit: 'kg',
      notesPlaceholder: 'Record best of 3 attempts. Compare to normative values for age/gender.',
    },
    {
      id: 'deficit_percentage',
      kind: 'text',
      label: 'Deficit percentage (if applicable)',
      notesPlaceholder: 'E.g., 20% deficit on right compared to left.',
    },
    {
      id: 'pain_during_grip',
      kind: 'yes_no',
      label: 'Pain during grip testing?',
    },
    {
      id: 'test_notes',
      kind: 'text',
      label: 'Additional notes',
      notesPlaceholder: 'Fatigue, consistency across attempts, compensatory patterns.',
    },
  ],
  normalTemplate: 'Grip strength: within normal limits bilaterally, symmetric (typically <10% difference between sides).',
  sensitivityQualitative: 'moderate',
  specificityQualitative: 'moderate',
  sensitivity: 'Moderate',
  specificity: 'Moderate',
  defaultNormalNotes: 'Grip strength within normal limits bilaterally, symmetric without pain reproduction.',
};

export const WRIST_ROM_WRIST: MskTestDefinition = {
  id: 'wrist_rom_wrist',
  name: 'Wrist Range of Motion Assessment',
  region: 'wrist',
  description: 'Quantifies active and passive wrist movements: flexion, extension, radial deviation, ulnar deviation.',
  typicalUse: 'Baseline mobility assessment, identification of limitations, pain provocation during movement.',
  fields: [
    {
      id: 'flexion_right',
      kind: 'angle_bilateral',
      label: 'Right wrist flexion (°)',
      unit: 'deg',
      normalRange: { min: 0, max: 80 },
      notesPlaceholder: 'Normal: 0-80°',
    },
    {
      id: 'flexion_left',
      kind: 'angle_bilateral',
      label: 'Left wrist flexion (°)',
      unit: 'deg',
      normalRange: { min: 0, max: 80 },
      notesPlaceholder: 'Normal: 0-80°',
    },
    {
      id: 'extension_right',
      kind: 'angle_bilateral',
      label: 'Right wrist extension (°)',
      unit: 'deg',
      normalRange: { min: 0, max: 70 },
      notesPlaceholder: 'Normal: 0-70°',
    },
    {
      id: 'extension_left',
      kind: 'angle_bilateral',
      label: 'Left wrist extension (°)',
      unit: 'deg',
      normalRange: { min: 0, max: 70 },
      notesPlaceholder: 'Normal: 0-70°',
    },
    {
      id: 'radial_deviation_right',
      kind: 'angle_bilateral',
      label: 'Right radial deviation (°)',
      unit: 'deg',
      normalRange: { min: 0, max: 20 },
      notesPlaceholder: 'Normal: 0-20°',
    },
    {
      id: 'radial_deviation_left',
      kind: 'angle_bilateral',
      label: 'Left radial deviation (°)',
      unit: 'deg',
      normalRange: { min: 0, max: 20 },
      notesPlaceholder: 'Normal: 0-20°',
    },
    {
      id: 'ulnar_deviation_right',
      kind: 'angle_bilateral',
      label: 'Right ulnar deviation (°)',
      unit: 'deg',
      normalRange: { min: 0, max: 30 },
      notesPlaceholder: 'Normal: 0-30°',
    },
    {
      id: 'ulnar_deviation_left',
      kind: 'angle_bilateral',
      label: 'Left ulnar deviation (°)',
      unit: 'deg',
      normalRange: { min: 0, max: 30 },
      notesPlaceholder: 'Normal: 0-30°',
    },
    {
      id: 'pain_during_movement',
      kind: 'yes_no',
      label: 'Pain during any movement?',
    },
    {
      id: 'pain_location',
      kind: 'text',
      label: 'Pain location (if present)',
      notesPlaceholder: 'Which movements provoke pain, location of pain.',
    },
    {
      id: 'test_notes',
      kind: 'text',
      label: 'Additional notes',
      notesPlaceholder: 'End feel, quality of movement, compensatory patterns, stiffness.',
    },
  ],
  normalTemplate: 'Wrist ROM: Flexion 0-80°, Extension 0-70°, Radial deviation 0-20°, Ulnar deviation 0-30° bilaterally without pain.',
  sensitivityQualitative: 'high',
  specificityQualitative: 'moderate',
  sensitivity: 'High',
  specificity: 'Moderate',
  defaultNormalNotes: 'Wrist range of motion within normal limits bilaterally: flexion 0-80°, extension 0-70°, radial deviation 0-20°, ulnar deviation 0-30° without pain reproduction.',
};

export const MSK_TEST_LIBRARY: (PhysicalTest | MskTestDefinition)[] = [
  // Tests with specific fields (new model)
  SLR_LUMBAR,
  CERVICAL_ROTATION,
  EMPTY_CAN_SHOULDER,
  SLUMP_LUMBAR,
  PRONE_INSTABILITY_LUMBAR,
  FABER_HIP,
  FADIR_HIP,
  TRENDELENBURG_HIP,
  LACHMAN_KNEE,
  MCMURRAY_KNEE,
  PATELLOFEMORAL_GRIND_KNEE,
  ANKLE_ANTERIOR_DRAWER,
  THOMPSON_ANKLE,
  NEER_SHOULDER,
  HAWKINS_KENNEDY_SHOULDER,
  DROP_ARM_SHOULDER,
  APPREHENSION_RELOCATION_SHOULDER,
  SPURLING_CERVICAL,
  ULTT_A_CERVICAL,
  CFRT_CERVICAL,
  VALGUS_STRESS_KNEE,
  VARUS_STRESS_KNEE,
  TALAR_TILT_ANKLE,
  THORACIC_PA_SPRING,
  // Phase 1 High Priority - New tests with fields
  WINDLASS_ANKLE,
  PHALEN_WRIST,
  THESSALY_KNEE,
  CERVICAL_DISTRACTION,
  // Wrist/Hand tests with specific fields
  FINKELSTEIN_WRIST,
  UCL_STRESS_WRIST,
  GRIP_STRENGTH_WRIST,
  WRIST_ROM_WRIST,
  // Legacy tests (without fields, backward compatible)
  {
    id: 'external-rotation-lag',
    name: 'External Rotation Lag Sign',
    region: 'shoulder',
    description: 'Assesses the ability to maintain external rotation in an elevated position.',
    defaultNormalNotes:
      'Maintains externally rotated position without lag or drop, symmetric to the opposite shoulder.',
  },
  {
    id: "o'brien",
    name: "O'Brien Test",
    region: 'shoulder',
    description: 'Resisted shoulder flexion with pronation/supination to check labral sensitivity.',
    defaultNormalNotes:
      'Compression/rotation resisted without reproduction of deep shoulder or AC joint pain.',
  },
  {
    id: 'spurling',
    name: 'Spurling Test',
    region: 'cervical',
    description: 'Extension with axial load assessing nerve root provocation.',
    defaultNormalNotes:
      'Cervical extension with axial load negative for radicular reproduction; patient remains comfortable.',
  },
  {
    id: 'ultt-median',
    name: 'Upper Limb Tension Test (Median Nerve)',
    region: 'cervical',
    description: 'Sequential nerve tension sequence for median nerve sensitivity.',
    defaultNormalNotes:
      'Median nerve tension sequence completed bilaterally without reproduction of distal neural symptoms.',
  },
  // Note: Thessaly Test and Cervical Distraction Test now have field definitions above
  // ANKLE_ANTERIOR_DRAWER already defined above with fields
  {
    id: 'talar-tilt',
    name: 'Talar Tilt Test',
    region: 'ankle',
    description: 'Inversion stress assessing lateral ankle ligament response.',
    defaultNormalNotes:
      'Inversion stress symmetrical bilaterally without lateral ankle pain or laxity.',
  },
];

export const regions: MSKRegion[] = ['shoulder', 'cervical', 'lumbar', 'knee', 'ankle', 'hip', 'thoracic', 'wrist'];

export const regionLabels: Record<MSKRegion, string> = {
  shoulder: 'Shoulder',
  cervical: 'Cervical',
  lumbar: 'Lumbar',
  knee: 'Knee',
  ankle: 'Ankle',
  hip: 'Hip',
  thoracic: 'Thoracic',
  wrist: 'Wrist/Hand',
};

export const getTestsByRegion = (region: MSKRegion): (PhysicalTest | MskTestDefinition)[] =>
  MSK_TEST_LIBRARY.filter((test) => test.region === region);

// Helper to check if a test has field definitions
export const hasFieldDefinitions = (
  test: PhysicalTest | MskTestDefinition
): test is MskTestDefinition => {
  return 'fields' in test && Array.isArray(test.fields) && test.fields.length > 0;
};

// Helper to get test definition (with fields) or legacy test
export const getTestDefinition = (
  testId: string
): MskTestDefinition | PhysicalTest | undefined => {
  return MSK_TEST_LIBRARY.find((test) => test.id === testId);
};
