import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from '../Tabs';

describe('Tabs', () => {
  const tabs = [
    { id: 'tab-1', label: 'Tab 1', content: <div>Contenido 1</div> },
    { id: 'tab-2', label: 'Tab 2', content: <div>Contenido 2</div> },
  ];

  it('renderiza los tabs y el contenido del primero por defecto', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Contenido 1')).toBeInTheDocument();
    expect(screen.queryByText('Contenido 2')).not.toBeInTheDocument();
  });

  it('cambia de tab al hacer click y muestra el contenido correspondiente', () => {
    render(<Tabs tabs={tabs} />);
    fireEvent.click(screen.getByText('Tab 2'));
    expect(screen.getByText('Contenido 2')).toBeInTheDocument();
    expect(screen.queryByText('Contenido 1')).not.toBeInTheDocument();
  });
}); 