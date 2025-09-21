export class DeepgramService {
  private apiKey: string = import.meta.env.VITE_DEEPGRAM_API_KEY;
  private baseUrl = 'https://api.deepgram.com/v1/listen';

  async transcribeAudio(audioBlob: Blob, language: string): Promise<string> {
    const languageCode = language === 'es' ? 'es' : 'en';
    
    console.log('📤 Sending to Deepgram:', {
      model: 'nova-3-general',
      language: languageCode,
      blobType: audioBlob.type,
      blobSize: audioBlob.size
    });
    
    const response = await fetch(`${this.baseUrl}?model=nova-3-general&language=${languageCode}&smart_format=true`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiKey}`
        // Let browser handle Content-Type automatically
      },
      body: audioBlob
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Deepgram error:', response.status, errorText);
      throw new Error(`Deepgram error: ${response.status}`);
    }
    
    const result = await response.json();
    return result.results.channels[0].alternatives[0].transcript;
  }
}
