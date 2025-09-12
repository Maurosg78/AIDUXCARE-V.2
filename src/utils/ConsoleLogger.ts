import { Language } from '../i18n/translations';

export class ConsoleLogger {
  private static messages = {
    es: {
      analyzingNormal: '🔍 Análisis Normal (-1 crédito)',
      analyzingPro: '✨ Análisis PRO (-3 créditos)',
      complexCase: '⚠️ Caso complejo detectado - Se sugiere IA Pro',
      consumingCredits: '💳 Consumiendo {amount} créditos',
      addingCredits: '💳 Agregando créditos: {pack}',
      startingAnalysis: '🔍 Iniciando análisis con razonamiento controlado...',
      aiReasoning: '💭 Razonamiento de la IA:',
      quality: '📊 Calidad:'
    },
    en: {
      analyzingNormal: '🔍 Normal Analysis (-1 credit)',
      analyzingPro: '✨ PRO Analysis (-3 credits)',
      complexCase: '⚠️ Complex case detected - AI Pro suggested',
      consumingCredits: '💳 Consuming {amount} credits',
      addingCredits: '💳 Adding credits: {pack}',
      startingAnalysis: '🔍 Starting analysis with controlled reasoning...',
      aiReasoning: '💭 AI reasoning:',
      quality: '📊 Quality:'
    }
  };

  static log(key: keyof typeof ConsoleLogger.messages['es'], language: Language, params?: Record<string, any>) {
    let message = this.messages[language][key];
    
    if (params) {
      Object.keys(params).forEach(param => {
        message = message.replace(`{${param}}`, params[param]);
      });
    }
    
    console.log(message);
  }
}
