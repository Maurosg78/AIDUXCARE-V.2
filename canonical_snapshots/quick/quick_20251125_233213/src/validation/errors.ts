import type { ZodError, ZodIssue, ZodSchema } from "zod";

export interface ValidationError {
  field: string;
  message: string;
}

export function formatValidationErrors(error: ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: formatErrorMessage(issue),
  }));
}

function formatErrorMessage(issue: ZodIssue): string {
  switch (issue.code) {
    case "invalid_enum_value": {
      const opts = (issue as any).options as string[] | undefined;
      return `Invalid value. Must be one of: ${opts?.join(", ") ?? "unknown options"}`;
    }
    case "too_small": {
      const min = (issue as any).minimum as number | undefined;
      const typ = (issue as any).type as string | undefined;
      if (typ === "string") return `Must be at least ${min ?? "?"} characters`;
      return `Must be at least ${min ?? "?"}`;
    }
    case "too_big": {
      const max = (issue as any).maximum as number | undefined;
      const typ = (issue as any).type as string | undefined;
      if (typ === "string") return `Must be no more than ${max ?? "?"} characters`;
      return `Must be no more than ${max ?? "?"}`;
    }
    default:
      return (issue as any).message ?? "Invalid value";
  }
}

export function assertValid<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = formatValidationErrors(result.error);
    throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
  }
  return result.data;
}
