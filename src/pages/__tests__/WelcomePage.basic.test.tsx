import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WelcomePage from '../WelcomePage';

describe('WelcomePage - Test Básico', () => {
  it('debe renderizar sin errores', () => {
    const { container } = render(
      <BrowserRouter>
        <WelcomePage />
      </BrowserRouter>
    );
    
    expect(container).toBeDefined();
  });

  it('debe mostrar el título', () => {
    render(
      <BrowserRouter>
        <WelcomePage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Bienvenido a')).toBeDefined();
  });
}); 