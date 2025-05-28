import { render, screen, fireEvent } from '@testing-library/react';
import Accordion from '../Accordion';

describe.skip('Accordion', () => {
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
    
    expect(screen.getByText('Título 1')).toBeInTheDocument();
    expect(screen.getByText('Título 2')).toBeInTheDocument();
  });

  it('muestra el contenido al hacer clic en un item', () => {
    render(<Accordion items={items} />);
    
    const button = screen.getByText('Título 1');
    fireEvent.click(button);
    
    expect(screen.getByText('Contenido 1')).toBeVisible();
  });

  it('oculta el contenido al hacer clic nuevamente', () => {
    render(<Accordion items={items} />);
    
    const button = screen.getByText('Título 1');
    fireEvent.click(button);
    fireEvent.click(button);
    
    expect(screen.queryByText('Contenido 1')).not.toBeVisible();
  });

  it('mantiene abierto el item por defecto', () => {
    render(<Accordion items={items} defaultOpen={['item-1']} />);
    
    expect(screen.getByText('Contenido 1')).toBeVisible();
  });

  it('deshabilita correctamente un item', () => {
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
    
    const disabledButton = screen.getByRole('button', { name: 'Título 3' });
    expect(disabledButton).toBeDisabled();
    
    fireEvent.click(disabledButton);
    expect(screen.queryByText('Contenido 3')).not.toBeVisible();
  });

  it('aplica correctamente las variantes', () => {
    const { container } = render(<Accordion items={items} variant="bordered" />);
    
    expect(container.firstChild).toHaveClass('space-y-2');
  });

  it('aplica correctamente los tamaños', () => {
    const { container } = render(<Accordion items={items} size="lg" />);
    
    const buttons = container.getElementsByTagName('button');
    expect(buttons[0]).toHaveClass('text-lg');
  });

  it('llama a onChange cuando se abre/cierra un item', () => {
    const onChange = jest.fn();
    render(<Accordion items={items} onChange={onChange} />);
    
    const button = screen.getByText('Título 1');
    fireEvent.click(button);
    
    expect(onChange).toHaveBeenCalledWith(['item-1']);
    
    fireEvent.click(button);
    expect(onChange).toHaveBeenCalledWith([]);
  });
}); 