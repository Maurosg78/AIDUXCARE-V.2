// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Accordion from '../Accordion';

// Limpieza del DOM tras cada test
afterEach(() => {
  cleanup();
});

describe('Accordion', () => {
  const items = [
    {
      id: 'item-1',
      title: 'Título 1',
      content: 'Contenido 1',
    },
    {
      id: 'item-2',
      title: 'Título 2',
      content: 'Contenido 2',
    },
  ];

  it('renderiza correctamente los items', () => {
    render(<Accordion items={items} />);
    // Usar getByRole para botones
    expect(screen.getByRole('button', { name: /Título 1/i })).to.exist;
    expect(screen.getByRole('button', { name: /Título 2/i })).to.exist;
  });

  it('muestra el contenido al hacer clic en un item', async () => {
    render(<Accordion items={items} />);
    const button = screen.getByRole('button', { name: /Título 1/i });
    fireEvent.click(button);
    // Esperar a que el contenido sea visible
    await waitFor(() => {
      expect(screen.getByText('Contenido 1')).to.exist;
    });
  });

  it('oculta el contenido al hacer clic nuevamente', async () => {
    render(<Accordion items={items} />);
    const button = screen.getByRole('button', { name: /Título 1/i });
    fireEvent.click(button); // abrir
    fireEvent.click(button); // cerrar
    // Esperar a que el contenido esté oculto (no exista en el DOM o tenga clase de oculto)
    await waitFor(() => {
      const content = screen.queryByText('Contenido 1');
      // Puede ser null si se desmonta, o tener clase de oculto
      if (content) {
        expect(content.parentElement?.className).to.match(/opacity-0/);
      } else {
        expect(content).to.be.null;
      }
    });
  });

  it('mantiene abierto el item por defecto', async () => {
    render(<Accordion items={items} defaultOpen="item-1" />);
    // Esperar a que el contenido esté presente
    await waitFor(() => {
      expect(screen.getByText('Contenido 1')).to.exist;
    });
  });

  it('deshabilita correctamente un item', async () => {
    const itemsWithDisabled = [
      ...items,
      {
        id: 'item-3',
        title: 'Título 3',
        content: 'Contenido 3',
        disabled: true,
      },
    ];
    render(<Accordion items={itemsWithDisabled} />);
    // Buscar el botón deshabilitado
    const disabledButton = screen.getByRole('button', { name: /Título 3 \+/ });
    expect(disabledButton).to.have.property('disabled', true);
    fireEvent.click(disabledButton);
    // El contenido debe estar oculto (pero puede estar en el DOM, así que validamos la clase de oculto)
    const content = screen.getByText('Contenido 3');
    await waitFor(() => {
      expect(content.parentElement?.className).to.match(/opacity-0|hidden/);
    });
  });

  it('aplica correctamente las variantes', () => {
    const { container } = render(<Accordion items={items} variant="bordered" />);
    // Debe tener las clases de bordered
    const first = container.firstChild as HTMLElement; // Fix: asegurar HTMLElement para className
    expect(first.className).to.match(/border/);
    expect(first.className).to.match(/rounded-lg/);
    expect(first.className).to.match(/divide-y/);
    expect(first.className).to.match(/divide-gray-200/);
  });

  it('aplica correctamente los tamaños', () => {
    const { container } = render(<Accordion items={items} size="lg" />);
    const buttons = container.getElementsByTagName('button');
    expect(buttons[0].className).to.match(/text-lg/);
  });

  it('llama a onChange cuando se abre/cierra un item', () => {
    const onChange = vi.fn();
    render(<Accordion items={items} onChange={onChange} />);
    const button = screen.getByRole('button', { name: /Título 1/i });
    fireEvent.click(button);
    // Fix: usar nthCalledWith para aserciones de mocks en Vitest
    expect(onChange).to.have.nthCalledWith(1, 'item-1', true);
    fireEvent.click(button);
    expect(onChange).to.have.nthCalledWith(2, 'item-1', false);
  });
}); 