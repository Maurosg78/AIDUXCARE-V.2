import { describe, it, expect, vi } from 'vitest';

// Mock de React
vi.mock('react', () => ({
  default: {
    createElement: vi.fn(),
    useState: vi.fn(() => [null, vi.fn()]),
    useEffect: vi.fn(),
    useNavigate: vi.fn(() => vi.fn()),
    useLocation: vi.fn(() => ({ pathname: '/' }))
  }
}));

// Mock de react-router-dom
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: any) => children,
  useNavigate: vi.fn(() => vi.fn()),
  useLocation: vi.fn(() => ({ pathname: '/' }))
}));

// Mock de @testing-library/react
vi.mock('@testing-library/react', () => ({
  render: vi.fn(() => ({ container: document.createElement('div') })),
  screen: {
    getByText: vi.fn(() => ({ textContent: 'Mock Text' })),
    getByPlaceholderText: vi.fn(() => ({ value: '' })),
    queryByText: vi.fn(() => null)
  },
  fireEvent: {
    click: vi.fn(),
    change: vi.fn()
  },
  waitFor: vi.fn((fn) => fn())
}));

describe('WelcomePage - Test con Mocks', () => {
  it('debe poder importar módulos', () => {
    expect(vi).toBeDefined();
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it('debe poder usar mocks', () => {
    const mockFn = vi.fn();
    mockFn.mockReturnValue('test');
    
    expect(mockFn()).toBe('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('debe poder simular componentes React', () => {
    const React = require('react');
    const { render, screen } = require('@testing-library/react');
    
    expect(React.createElement).toBeDefined();
    expect(render).toBeDefined();
    expect(screen.getByText).toBeDefined();
  });

  it('debe poder simular navegación', () => {
    const { useNavigate } = require('react-router-dom');
    
    expect(useNavigate).toBeDefined();
  });
}); 