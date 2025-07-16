// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Modal } from '../Modal';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  headerTitle: 'Título de prueba',
  headerDescription: 'Descripción de prueba',
  children: <div>Contenido del modal</div>,
};

afterEach(() => {
  cleanup();
});

describe('Modal', () => {
  it('renderiza el modal cuando isOpen es true', () => {
    render(<Modal {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).to.exist;
    expect(screen.getByText('Título de prueba')).to.exist;
    expect(screen.getByText('Descripción de prueba')).to.exist;
    expect(screen.getByText('Contenido del modal')).to.exist;
  });

  it('no renderiza el modal cuando isOpen es false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    // El modal no debe estar en el DOM
    expect(screen.queryByRole('dialog')).to.be.null;
  });

  it('llama a onClose al hacer click en el backdrop', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
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
    render(<Modal {...defaultProps} onClose={onClose} />);
    // Buscar todos los botones con aria-label
    const closeButtons = screen.getAllByLabelText(/cerrar modal/i);
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledOnce();
  });
}); 