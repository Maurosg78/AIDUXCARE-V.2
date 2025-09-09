export class WebSpeechSTTService {
  static async transcribe(audioBlob: Blob): Promise<string> {
    return "Transcripción de ejemplo";
  }
  
  static isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
}
