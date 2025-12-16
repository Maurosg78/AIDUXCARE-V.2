export class PromptFactory {
  static generateSOAPPrompt(text: string): string {
    return `Ontario SOAP: ${text}`;
  }
}
