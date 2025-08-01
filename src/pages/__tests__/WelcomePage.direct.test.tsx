import { describe, it, expect } from 'vitest';

describe('Test Directo - Verificar jsdom', () => {
  it('debe tener document disponible', () => {
    expect(document).toBeDefined();
    expect(window).toBeDefined();
    expect(navigator).toBeDefined();
  });

  it('debe poder crear elementos DOM', () => {
    const div = document.createElement('div');
    div.textContent = 'Test';
    document.body.appendChild(div);
    
    expect(document.body.querySelector('div')).toBeDefined();
    expect(document.body.querySelector('div')?.textContent).toBe('Test');
  });

  it('debe tener localStorage disponible', () => {
    expect(localStorage).toBeDefined();
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
  });
}); 