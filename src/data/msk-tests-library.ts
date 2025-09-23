export interface MSKTest {
  id: string;
  name: string;
  category: 'mobility' | 'strength' | 'balance' | 'flexibility' | 'special' | 'neurological' | 'orthopedic';
  normalRange: {
    min?: number;
    max?: number;
    unit: string;
    description: string;
  }
  instructions: string;
}

export const MSK_TESTS_LIBRARY: MSKTest[] = [
  // MOBILITY
  {
    id: 'tug',
    name: 'Timed Up and Go (TUG)',
    category: 'mobility',
    normalRange: {
      max: 12,
      unit: 'seconds',
      description: '<12 sec normal'
    },
    instructions: 'Rise from chair, walk 3m, turn, return'
  },
  {
    id: '6mwt',
    name: '6 Minute Walk Test',
    category: 'mobility',
    normalRange: {
      min: 400,
      max: 700,
      unit: 'meters',
      description: '400-700m expected'
    },
    instructions: 'Walk maximum distance in 6 minutes'
  },
  // STRENGTH
  {
    id: '30sts',
    name: '30-Second Sit to Stand',
    category: 'strength',
    normalRange: {
      min: 12,
      unit: 'reps',
      description: '>12 reps normal'
    },
    instructions: '30 seconds sit-to-stand repetitions'
  },
  {
    id: 'grip',
    name: 'Grip Strength',
    category: 'strength',
    normalRange: {
      min: 20,
      max: 40,
      unit: 'kg',
      description: 'M:35-45kg, F:20-30kg'
    },
    instructions: 'Dynamometer, best of 3'
  },
  // BALANCE
  {
    id: 'berg',
    name: 'Berg Balance Scale',
    category: 'balance',
    normalRange: {
      min: 45,
      max: 56,
      unit: 'points',
      description: '45-56 low risk'
    },
    instructions: '14-item balance assessment'
  },
  {
    id: 'sls',
    name: 'Single Leg Stance',
    category: 'balance',
    normalRange: {
      min: 30,
      unit: 'seconds',
      description: '>30 sec normal'
    },
    instructions: 'Stand on one leg, eyes open'
  },
  // FLEXIBILITY
  {
    id: 'shoulder-flex',
    name: 'Shoulder Flexion ROM',
    category: 'flexibility',
    normalRange: {
      min: 160,
      max: 180,
      unit: 'degrees',
      description: '160-180°'
    },
    instructions: 'Active shoulder flexion'
  },
  {
    id: 'hip-flex',
    name: 'Hip Flexion ROM',
    category: 'flexibility',
    normalRange: {
      min: 110,
      max: 120,
      unit: 'degrees',
      description: '110-120°'
    },
    instructions: 'Supine hip flexion'
  },
  {
    id: 'knee-flex',
    name: 'Knee Flexion ROM',
    category: 'flexibility',
    normalRange: {
      min: 130,
      max: 140,
      unit: 'degrees',
      description: '130-140°'
    },
    instructions: 'Prone knee flexion'
  },
  // SPECIAL TESTS
  {
    id: 'slr',
    name: 'Straight Leg Raise',
    category: 'special',
    normalRange: {
      min: 70,
      max: 90,
      unit: 'degrees',
      description: '70-90° normal'
    },
    instructions: 'Passive SLR to symptoms'
  },
  {
    id: 'orthostatic-vitals',
    name: 'Orthostatic Blood Pressure Measurement',
    category: 'special',
    normalRange: {
      description: '<20 mmHg drop systolic, <10 mmHg diastolic',
      unit: 'mmHg'
    },
    instructions: 'Blood pressure supine, sitting, standing (1 and 3 min)'
  },
  {
    id: 'hip-rom-strength',
    name: 'Hip Range of Motion and Strength Assessment',
    category: 'special',
    normalRange: {
      description: 'ROM: 110-120° flexion, Strength: 4+/5 all planes',
      unit: 'degrees/grade'
    },
    instructions: 'Assess hip flexion, extension, abduction, adduction ROM and strength'
  },
  // NEUROLOGICAL TESTS - ADDED FOR AI SUGGESTIONS
  {
    id: "neurological-screen",
    name: "Neurological Screen (Dermatomes, Myotomes, Reflexes)",
    category: "neurological",
    normalRange: {
      description: "Normal sensation, 4+/5 strength, normal reflexes",
      unit: "clinical assessment"
    },
    instructions: "Test dermatomes, myotomes, and deep tendon reflexes"
  },
  // ORTHOPEDIC TESTS - ADDED FOR AI SUGGESTIONS
  {
    id: "lumbar-repeated-movement",
    name: "Lumbar Repeated Movement Assessment",
    category: "orthopedic",
    normalRange: {
      description: "Centralization of symptoms, increased ROM",
      unit: "clinical response"
    },
    instructions: "Repeated flexion/extension movements to assess mechanical response"
  }
];
