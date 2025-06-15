import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Drawer } from '../Drawer';

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
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Título de prueba')).toBeInTheDocument();
    expect(screen.getByText('Descripción de prueba')).toBeInTheDocument();
    expect(screen.getByText('Contenido del drawer')).toBeInTheDocument();
  });

  it('no renderiza el drawer cuando isOpen es false', () => {
    render(<Drawer {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('llama a onClose al hacer click en el backdrop', () => {
    const onClose = vi.fn();
    render(<Drawer {...defaultProps} onClose={onClose} />);
    const backdrop = screen.getByRole('dialog').previousSibling;
    if (backdrop && backdrop instanceof HTMLElement) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('llama a onClose al hacer click en el botón de cerrar', () => {
    const onClose = vi.fn();
    render(<Drawer {...defaultProps} onClose={onClose} />);
    const closeButton = screen.getByLabelText(/cerrar drawer/i);
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });
}); 