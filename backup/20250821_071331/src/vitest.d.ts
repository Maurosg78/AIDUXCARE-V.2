// Declaraciones de tipos para vitest
declare module 'vitest' {
  export const describe: (name: string, fn: () => void) => void;
  export const it: (name: string, fn: () => void | Promise<void>) => void;
  export const test: (name: string, fn: () => void | Promise<void>) => void;
  export const expect: any;
  export const beforeEach: (fn: () => void | Promise<void>) => void;
  export const afterEach: (fn: () => void | Promise<void>) => void;
  export const beforeAll: (fn: () => void | Promise<void>) => void;
  export const afterAll: (fn: () => void | Promise<void>) => void;
  export const vi: {
    fn: (implementation?: any) => any;
    mock: (module: string, factory: () => any) => void;
    clearAllMocks: () => void;
    resetAllMocks: () => void;
    restoreAllMocks: () => void;
  };
  export const expectTypeOf: any;
}

declare module '@testing-library/react' {
  export const render: any;
  export const screen: any;
  export const fireEvent: any;
  export const waitFor: any;
  export const within: any;
}

declare module '@testing-library/jest-dom' {
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