import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WelcomePage from '../WelcomePage';

describe('WelcomePage - Test Funcional', () => {
  it('debe renderizar sin errores', () => {
    const { container } = render(
      <BrowserRouter>
        <WelcomePage />
      </BrowserRouter>
    );
    
    expect(container).toBeDefined();
  });

  it('debe mostrar el título principal', () => {
    render(
      <BrowserRouter>
        <WelcomePage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Bienvenido a')).toBeDefined();
  });

  it('debe mostrar los botones de navegación', () => {
    render(
      <BrowserRouter>
        <WelcomePage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Registrarse')).toBeDefined();
    expect(screen.getByText('Iniciar sesión')).toBeDefined();
  });

  it('debe mostrar campos de formulario', () => {
    render(
      <BrowserRouter>
        <WelcomePage />
      </BrowserRouter>
    );
    
    expect(screen.getByPlaceholderText('Correo electrónico')).toBeDefined();
    expect(screen.getByPlaceholderText('Contraseña')).toBeDefined();
  });
}); 