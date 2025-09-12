export class LanguageSync {
  private static instance: LanguageSync;
  private currentLanguage: 'es' | 'en' = 'en';
  private listeners: Set<(lang: string) => void> = new Set();
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new LanguageSync();
    }
    return this.instance;
  }
  
  setLanguage(lang: 'es' | 'en') {
    console.log(`🔄 [LanguageSync] Cambiando idioma de ${this.currentLanguage} a ${lang}`);
    this.currentLanguage = lang;
    
    // Notificar a todos los componentes
    this.listeners.forEach(listener => {
      listener(lang);
    });
    
    // Verificar sincronización después de 100ms
    setTimeout(() => {
      this.verifySync();
    }, 100);
  }
  
  getLanguage() {
    return this.currentLanguage;
  }
  
  subscribe(listener: (lang: string) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private verifySync() {
    const elements = document.querySelectorAll('[data-lang-check]');
    let errors = 0;
    
    elements.forEach((el) => {
      const expectedLang = el.getAttribute('data-expected-lang');
      if (expectedLang && expectedLang !== this.currentLanguage) {
        console.error(`❌ Elemento no sincronizado:`, el);
        errors++;
      }
    });
    
    if (errors === 0) {
      console.log(`✅ [LanguageSync] Todos los elementos sincronizados en ${this.currentLanguage.toUpperCase()}`);
    } else {
      console.error(`❌ [LanguageSync] ${errors} elementos no sincronizados`);
    }
  }
}
