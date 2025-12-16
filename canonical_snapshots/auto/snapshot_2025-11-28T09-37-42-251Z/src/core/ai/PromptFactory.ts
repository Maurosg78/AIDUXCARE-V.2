/** Contratos exportados y estables para selección de modelo */
export type CaseComplexity = 'simple'|'moderate'|'critical';
export type MedicalSpecialty = 'fisioterapia'|'psicologia'|'medicina_general';
export const isCaseComplexity = (v:string): v is CaseComplexity => v==='simple'||v==='moderate'||v==='critical';
export default {};