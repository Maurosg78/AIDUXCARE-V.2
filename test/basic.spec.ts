import { describe, it, expect } from 'vitest';

describe('setup jest-dom', () => {
  it('extiende expect con toBeInTheDocument', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    expect(el).toBeInTheDocument();
  });
});
