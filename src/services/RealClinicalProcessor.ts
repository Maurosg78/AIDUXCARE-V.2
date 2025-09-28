// @ts-nocheck
export class RealClinicalProcessor {
  private apiKey: string;
  
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  }
  
  async processTranscript(transcript: string): Promise<any> {
    const prompt = `
    Eres un fisioterapeuta experto. Analiza esta consulta y devuelve JSON con:
    1. entities: array de síntomas/medicamentos/tests encontrados
    2. insights: array de recomendaciones clínicas con severidad
    3. soap: objeto con subjective, objective, assessment, plan
    4. billingCode: código Ontario (A07A inicial, A07B seguimiento)
    
    Transcript: ${transcript}
    
    Responde SOLO con JSON válido, sin markdown.
    `;
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });
      
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('GPT-4 processing failed:', error);
      throw error;
    }
  }
}