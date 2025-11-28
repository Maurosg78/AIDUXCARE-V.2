export type TranscriptionSegment = { text: string; isFinal?: boolean; startMs?: number; endMs?: number };
export type CaptureStatus = 'idle'|'requesting_permission'|'recording'|'stopping'|'stopped'|'error';
export type Listener<T> = (arg:T)=>void;
export type SessionStats = { durationMs: number; bytes: number; language: string; status: CaptureStatus };

export type Options = {
  language?: string;
  onTranscriptionUpdate?: (segments: TranscriptionSegment[]) => void;
  onTranscriptionComplete?: (segments: TranscriptionSegment[]) => void;
};

export type CaptureSession = {
  start: ()=>Promise<void>;
  stop: ()=>Promise<void>;
  status?: CaptureStatus;
};

export class AudioCaptureServiceReal {
  private language: string = 'es';
  private status: CaptureStatus = 'idle';
  private segs: TranscriptionSegment[] = [];
  private onSeg?: Listener<TranscriptionSegment>;
  private onErr?: Listener<Error>;
  private onStat?: Listener<CaptureStatus>;
  private opts: Options = {};

  constructor(options?: Options){ if(options) this.opts = options; }

  onSegment(cb: Listener<TranscriptionSegment>){ this.onSeg = cb; }
  onError(cb: Listener<Error>){ this.onErr = cb; }
  onStatus(cb: Listener<CaptureStatus>){ this.onStat = cb; }

  isSupported(): boolean { return true; }
  setLanguage(lang: string){ this.language = lang; }
  getStatusMessage(_s?: CaptureStatus): string { return 'OK'; }
  getSessionStats(): SessionStats {
    return { durationMs: 0, bytes: 0, language: this.language, status: this.status };
  }

  async startCapture(): Promise<void> { this.status='recording'; this.onStat?.(this.status); }
  async stopCapture(): Promise<void> { this.status='stopping'; this.onStat?.(this.status); this.status='stopped'; this.onStat?.(this.status); this.opts.onTranscriptionComplete?.(this.segs); }
  async start(): Promise<void> { return this.startCapture(); }
  async stop(): Promise<void> { return this.stopCapture(); }
  cleanup(): void { this.segs = []; this.status='idle'; this.onStat?.(this.status); }
}
const instance = new AudioCaptureServiceReal();
export default instance;
