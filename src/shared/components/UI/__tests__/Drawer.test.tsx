// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Drawer } from '../Drawer';

afterEach(() => {
  cleanup();
});

describe('Drawer', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    headerTitle: 'Título de prueba',
    headerDescription: 'Descripción de prueba',
    children: <div>Contenido del drawer</div>,
  };

  it('renderiza el drawer cuando isOpen es true', () => {
    render(<Drawer {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).to.exist;
    expect(screen.getByText('Título de prueba')).to.exist;
    expect(screen.getByText('Descripción de prueba')).to.exist;
    expect(screen.getByText('Contenido del drawer')).to.exist;
  });

  it('no renderiza el drawer cuando isOpen es false', () => {
    render(<Drawer {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).to.be.null;
  });

  it('llama a onClose al hacer click en el backdrop', () => {
    const onClose = vi.fn();
    render(<Drawer {...defaultProps} onClose={onClose} />);
    // Buscar el backdrop por clase
    const backdrop = document.querySelector('.bg-black');
    if (backdrop && backdrop instanceof HTMLElement) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledOnce();
    } else {
      throw new Error('Backdrop no encontrado');
    }
  });

  it('llama a onClose al hacer click en el botón de cerrar', () => {
    const onClose = vi.fn();
    render(<Drawer {...defaultProps} onClose={onClose} />);
    const closeButtons = screen.getAllByLabelText(/cerrar drawer/i);
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledOnce();
  });
}); 