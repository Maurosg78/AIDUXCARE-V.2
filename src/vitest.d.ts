/// <reference types="vitest" />
/// <reference types="vitest/globals" />

export {};

declare module '@testing-library/react' {
  export const render: any;
  export const screen: any;
  export const fireEvent: any;
  export const waitFor: any;
  export const within: any;
}

declare module '@testing-library/jest-dom/vitest/vitest/vitest' {
  export const toBeInTheDocument: any;
  export const toHaveTextContent: any;
  export const toHaveClass: any;
  export const toBeVisible: any;
  export const toBeDisabled: any;
  export const toBeEnabled: any;
  export const toHaveValue: any;
  export const toBeChecked: any;
  export const toHaveAttribute: any;
}

declare module 'sinon-chai' {
  export const expect: any;
  export const assert: any;
  export const should: any;
}

declare module 'chai' {
  export const expect: any;
  export const assert: any;
  export const should: any;
} 