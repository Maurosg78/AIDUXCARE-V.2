export class FileProcessorService {
  static async processFile(file: File): Promise<string> {
    console.log(`📁 Procesando: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    
    try {
      if (file.type.startsWith('image/')) {
        return await this.processImage(file);
      } else if (file.type.startsWith('audio/')) {
        return await this.processAudio(file);
      } else if (file.type === 'application/pdf') {
        return await this.processPDF(file);
      } else if (file.type.includes('text') || file.name.endsWith('.txt')) {
        return await this.processText(file);
      } else {
        return `[Archivo: ${file.name} - Describir contenido relevante]`;
      }
    } catch (error) {
      console.error('Error procesando archivo:', error);
      return `[Error al procesar ${file.name}]`;
    }
  }
  
  private static async processImage(file: File): Promise<string> {
    return `📷 [Imagen: ${file.name}]
Describir hallazgos visibles:
- Lesiones o anomalías
- Coloración
- Inflamación
- Otros hallazgos relevantes`;
  }
  
  private static async processAudio(file: File): Promise<string> {
    console.log('🎵 Procesando audio con Whisper...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-1');
      formData.append('language', 'es');
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Whisper error: ${response.status}`);
      }
      
      const data = await response.json();
      return `🎤 [Audio: ${file.name}]:\n${data.text}`;
    } catch (error) {
      console.error('Error con Whisper:', error);
      return `[Error transcribiendo: ${file.name}]`;
    }
  }
  
  private static async processPDF(file: File): Promise<string> {
    return `📄 [PDF: ${file.name}]
Extraer información relevante del documento`;
  }
  
  private static async processText(file: File): Promise<string> {
    try {
      const text = await file.text();
      return `📝 [Documento: ${file.name}]:\n${text}`;
    } catch (error) {
      return `[Error leyendo ${file.name}]`;
    }
  }
}
