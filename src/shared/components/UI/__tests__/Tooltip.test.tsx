import { render, screen, fireEvent } from '@testing-library/react';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  it('renderiza el contenido hijo', () => {
    render(
      <Tooltip content="Texto del tooltip">
        <button>Botón</button>
      </Tooltip>
    );
    expect(screen.getByText('Botón')).toBeInTheDocument();
  });

  it('muestra el tooltip al hacer hover', () => {
    render(
      <Tooltip content="Texto del tooltip">
        <button>Botón</button>
      </Tooltip>
    );
    fireEvent.mouseEnter(screen.getByText('Botón'));
    expect(screen.getByText('Texto del tooltip')).toBeInTheDocument();
  });

  it('oculta el tooltip al salir del hover', () => {
    render(
      <Tooltip content="Texto del tooltip">
        <button>Botón</button>
      </Tooltip>
    );
    const button = screen.getByText('Botón');
    fireEvent.mouseEnter(button);
    expect(screen.getByText('Texto del tooltip')).toBeInTheDocument();
    fireEvent.mouseLeave(button);
    expect(screen.queryByText('Texto del tooltip')).not.toBeInTheDocument();
  });
}); 