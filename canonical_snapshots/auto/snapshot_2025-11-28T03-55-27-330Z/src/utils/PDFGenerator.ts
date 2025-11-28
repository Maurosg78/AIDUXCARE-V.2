// @ts-nocheck
export class PDFGenerator {
  static async generateSOAPReport(_data:any): Promise<any> { return undefined; }
  static async download(_blob:any,_filename:string): Promise<void> {}
}
// exports nombrados apuntando a los estáticos
export const generateSOAPReport = PDFGenerator.generateSOAPReport;
export const download = PDFGenerator.download;
// default export compatible con import default
export default PDFGenerator;
