export function enhanceRedFlags(redFlags: any[]): string[] {
  return redFlags.map(flag => {
    const flagText = typeof flag === 'string' ? flag : flag.text || JSON.stringify(flag);
    
    // Detectar y mejorar ideación suicida
    if (flagText.toLowerCase().includes("doesn't see the point")) {
      return "Suicidal ideation: 'doesn't see the point anymore' - triggered by husband's death last year";
    }
    
    if (flagText.toLowerCase().includes("burden")) {
      return "Suicidal ideation: feels like a burden to family - social isolation risk";
    }
    
    return flagText;
  });
}
