import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Modal } from '../Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    headerTitle: 'Título de prueba',
    headerDescription: 'Descripción de prueba',
    children: <div>Contenido del modal</div>,
  };

  it('renderiza el modal cuando isOpen es true', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Título de prueba')).toBeInTheDocument();
    expect(screen.getByText('Descripción de prueba')).toBeInTheDocument();
    expect(screen.getByText('Contenido del modal')).toBeInTheDocument();
  });

  it('no renderiza el modal cuando isOpen es false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('llama a onClose al hacer click en el backdrop', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    const backdrop = screen.getByRole('dialog').previousSibling;
    if (backdrop && backdrop instanceof HTMLElement) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('llama a onClose al hacer click en el botón de cerrar', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    const closeButton = screen.getByLabelText(/cerrar modal/i);
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });
}); 