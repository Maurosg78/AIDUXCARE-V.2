import Ajv from "ajv";
import schema from "../../../../prompt-registry/clinical-analysis/schema.json";

const ajv = new Ajv({ 
  allErrors: true, 
  strict: false 
});

const validate = ajv.compile(schema);

export function validateClinicalOutput(data: any) {
  const valid = validate(data);
  
  if (!valid) {
    console.error("[VALIDATION_ERROR]", validate.errors);
    return { valid: false, errors: validate.errors };
  }
  
  return { valid: true };
}

export function assertClinicalOutput(data: any): void {
  const result = validateClinicalOutput(data);
  
  if (!result.valid) {
    throw new Error(`Schema validation failed: ${JSON.stringify(result.errors)}`);
  }
}
