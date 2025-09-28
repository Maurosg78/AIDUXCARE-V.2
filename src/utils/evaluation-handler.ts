// @ts-nocheck
export const processEvaluationResults = (results: any) => {
  if (!results) return [];
  
  // Si es un array directo, devolverlo
  if (Array.isArray(results)) return results;
  
  // Si es el objeto estructurado, convertirlo
  if (results.evaluationText || results.measurements || results.tests) {
    return [
      ...(results.measurements || []),
      ...(results.tests || []),
      { raw: results.evaluationText }
    ].filter(Boolean);
  }
  
  return [];
};