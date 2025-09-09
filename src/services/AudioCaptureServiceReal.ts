export type CaptureStatus = 'idle' | 'recording' | 'processing' | 'completed' | 'error';

export interface CaptureSession {
  id: string;
  status: CaptureStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  audioBlob?: Blob;
  transcript?: string;
}

export class AudioCaptureServiceReal {
  static async startCapture(): Promise<CaptureSession> {
    return {
      id: `capture-${Date.now()}`,
      status: 'recording',
      startTime: new Date()
    };
  }
  
  static async stopCapture(sessionId: string): Promise<CaptureSession> {
    return {
      id: sessionId,
      status: 'completed',
      endTime: new Date()
    };
  }
}
