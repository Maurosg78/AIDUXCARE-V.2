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
