export const PDFGenerator = {
  generateSOAPReport: async (analysis: any) => new Blob([JSON.stringify(analysis)], { type: "application/pdf" }),
  download: (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
};
