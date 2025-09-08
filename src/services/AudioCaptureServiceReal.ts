export type CaptureStatus = 'idle' | 'recording' | 'stopped';
export interface CaptureSession { stop: () => void; }
export const AudioCaptureServiceReal = {
  start: async (_opts?: {
    onTranscriptionUpdate?: (segment: any) => void;
    onError?: (err: any) => void;
    onStatusChange?: (s: CaptureStatus) => void;
  }): Promise<CaptureSession> => ({ stop() {} })
};
export { CaptureStatus }; export type { CaptureSession };
