// Declaraciones de tipos para vitest
declare module 'vitest' {
  export const describe: unknown;
  export const it: unknown;
  export const test: unknown;
  export const expect: unknown;
  export const beforeEach: unknown;
  export const afterEach: unknown;
  export const beforeAll: unknown;
  export const afterAll: unknown;
  export const vi: unknown;
  export const expectTypeOf: unknown;
}

declare module '@testing-library/react' {
  export const render: unknown;
  export const screen: unknown;
  export const fireEvent: unknown;
  export const waitFor: unknown;
  export const within: unknown;
}

declare module '@testing-library/jest-dom' {
  export const toBeInTheDocument: unknown;
  export const toHaveTextContent: unknown;
  export const toHaveClass: unknown;
  export const toBeVisible: unknown;
  export const toBeDisabled: unknown;
  export const toBeEnabled: unknown;
  export const toHaveValue: unknown;
  export const toBeChecked: unknown;
  export const toHaveAttribute: unknown;
}

declare module 'sinon-chai' {
  export const expect: unknown;
  export const assert: unknown;
  export const should: unknown;
}

declare module 'chai' {
  export const expect: unknown;
  export const assert: unknown;
  export const should: unknown;
} 