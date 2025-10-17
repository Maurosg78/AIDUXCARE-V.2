/**
 * Mock API for Sign Note feature
 * Used for development without Firebase emulators
 */

export interface SignNoteResponse {
  success: boolean;
  note: {
    id: string;
    status: 'signed';
    signedAt: string;
    immutable_hash: string;
    immutable_signed: boolean;
  };
}

export const signNote = async (noteId: string): Promise<SignNoteResponse> => {
  console.log('🔧 MOCK API: Signing note', noteId);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate random success/failure (90% success)
  if (Math.random() < 0.1) {
    throw new Error('Mock error: Unable to sign note');
  }
  
  // Return mock success response
  return {
    success: true,
    note: {
      id: noteId,
      status: 'signed',
      signedAt: new Date().toISOString(),
      immutable_hash: `mock-sha256-${noteId}-${Date.now()}`,
      immutable_signed: true
    }
  };
};

export default { signNote };

/**
 * Mock data for Patient History feature
 */
import { ClinicalNote } from '@/types/notes';
import { Timestamp } from 'firebase/firestore';

export const mockPatientNotes: Record<string, ClinicalNote[]> = {
  'patient-1': [
    {
      id: 'note-1-1',
      patientId: 'patient-1',
      clinicianUid: 'clinician-1',
      status: 'signed',
      subjective: 'Patient reports significant improvement in lower back pain. Pain level decreased from 8/10 to 4/10. Better sleep quality. Able to walk longer distances without discomfort.',
      objective: 'ROM lumbar flexion improved 15 degrees. Muscle strength testing shows grade 4/5 in hip flexors. No visible swelling. Patient demonstrates proper lifting technique.',
      assessment: 'Lumbar strain showing good response to treatment. Functional improvement noted. Patient compliance excellent with home exercise program.',
      plan: 'Continue current exercise program. Add core strengthening exercises. Return in 1 week. Consider discharge if continued improvement.',
      createdAt: Timestamp.fromDate(new Date('2024-10-15T10:30:00')),
      updatedAt: Timestamp.fromDate(new Date('2024-10-15T11:00:00')),
      signedHash: 'h123abc'
    },
    {
      id: 'note-1-2',
      patientId: 'patient-1',
      clinicianUid: 'clinician-1',
      status: 'submitted',
      subjective: 'Patient reports mild stiffness in the morning. Pain level stable at 4/10. Completed all exercises as prescribed. Some difficulty with new core exercises.',
      objective: 'Posture improved. Core stability test shows mild weakness. Range of motion maintained. No compensatory patterns observed during movement.',
      assessment: 'Continued progress. Core weakness identified as limiting factor. Patient motivated and engaged in treatment.',
      plan: 'Modify core exercise progression. Provide additional education on proper form. Schedule follow-up in 1 week.',
      createdAt: Timestamp.fromDate(new Date('2024-10-08T14:15:00')),
      updatedAt: Timestamp.fromDate(new Date('2024-10-08T14:15:00'))
    },
    {
      id: 'note-1-3',
      patientId: 'patient-1',
      clinicianUid: 'clinician-1',
      status: 'signed',
      subjective: 'Initial assessment. Patient reports acute lower back pain following lifting incident 3 days ago. Pain 8/10, radiating to right leg. Difficulty sitting and standing.',
      objective: 'Antalgic gait observed. Limited lumbar flexion (30 degrees). Positive straight leg raise test on right. Muscle spasm palpable in lumbar paraspinals.',
      assessment: 'Acute lumbar strain with possible nerve irritation. Functional limitations significant. Good candidate for physical therapy intervention.',
      plan: 'Begin gentle mobilization. Patient education on proper body mechanics. Home exercise program initiated. Return in 3 days.',
      createdAt: Timestamp.fromDate(new Date('2024-10-01T09:00:00')),
      updatedAt: Timestamp.fromDate(new Date('2024-10-01T09:30:00')),
      signedHash: 'h456def'
    },
    {
      id: 'note-1-4',
      patientId: 'patient-1',
      clinicianUid: 'clinician-1',
      status: 'draft',
      subjective: 'Patient reports feeling much better today. Pain down to 2/10. Sleeping through the night. Returned to normal daily activities.',
      objective: 'Full ROM in all planes. Strength testing normal. Functional movement screen shows no deficits.',
      assessment: 'Excellent progress. Ready for discharge planning.',
      plan: 'Final exercise review. Home program maintenance. PRN follow-up.',
      createdAt: Timestamp.fromDate(new Date('2024-10-16T16:45:00')),
      updatedAt: Timestamp.fromDate(new Date('2024-10-16T16:45:00'))
    }
  ],
  'patient-2': [
    {
      id: 'note-2-1',
      patientId: 'patient-2',
      clinicianUid: 'clinician-1',
      status: 'signed',
      subjective: 'Post-surgical knee rehabilitation. 6 weeks post ACL reconstruction. Reports mild pain 3/10. Good compliance with restrictions.',
      objective: 'Surgical site healing well. Knee flexion 90 degrees. Extension lacks 5 degrees. Quad strength 3/5. Minimal effusion present.',
      assessment: 'Normal post-surgical progress. Ready to advance strengthening program. Extension ROM priority.',
      plan: 'Progress to closed chain exercises. Focus on terminal knee extension. Continue ice after sessions.',
      createdAt: Timestamp.fromDate(new Date('2024-10-14T11:00:00')),
      updatedAt: Timestamp.fromDate(new Date('2024-10-14T11:30:00')),
      signedHash: 'h789ghi'
    }
  ]
};

/**
 * Mock API for fetching patient notes history
 */
export const getPatientNotes = async (patientId: string): Promise<ClinicalNote[]> => {
  console.log('🔧 MOCK API: Fetching notes for patient', patientId);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Return mock notes for patient
  return mockPatientNotes[patientId] || [];
};
