// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  it('renderiza el contenido hijo', () => {
    render(
      <Tooltip content="Texto del tooltip">
        <button>Botón</button>
      </Tooltip>
    );
    const buttons = screen.getAllByText('Botón');
    expect(buttons[0]).to.exist;
  });

  it('muestra el tooltip al hacer hover', () => {
    render(
      <Tooltip content="Texto del tooltip">
        <button>Botón</button>
      </Tooltip>
    );
    const buttons = screen.getAllByText('Botón');
    fireEvent.mouseEnter(buttons[0]);
    expect(screen.getByText('Texto del tooltip')).to.exist;
  });

  it('oculta el tooltip al salir del hover', () => {
    render(
      <Tooltip content="Texto del tooltip">
        <button>Botón</button>
      </Tooltip>
    );
    const buttons = screen.getAllByText('Botón');
    fireEvent.mouseEnter(buttons[0]);
    expect(screen.getByText('Texto del tooltip')).to.exist;
    fireEvent.mouseLeave(buttons[0]);
    expect(screen.queryByText('Texto del tooltip')).to.not.exist;
  });
}); 