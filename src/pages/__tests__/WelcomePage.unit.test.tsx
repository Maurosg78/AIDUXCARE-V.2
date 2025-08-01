import { describe, it, expect } from 'vitest';

describe('WelcomePage - Test Unitario', () => {
  it('debe poder ejecutar tests básicos', () => {
    expect(1 + 1).toBe(2);
    expect('test').toBe('test');
  });

  it('debe poder usar funciones de array', () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers.length).toBe(5);
    expect(numbers.filter(n => n > 3)).toEqual([4, 5]);
  });

  it('debe poder usar objetos', () => {
    const user = {
      name: 'Test User',
      email: 'test@test.com'
    };
    
    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@test.com');
  });
}); 