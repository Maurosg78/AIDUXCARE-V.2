// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { Tabs } from '../Tabs';

const tabs = [
  { id: 'tab-1', label: 'Tab 1', content: <div>Contenido 1</div> },
  { id: 'tab-2', label: 'Tab 2', content: <div>Contenido 2</div> },
];

afterEach(() => {
  cleanup();
});

describe('Tabs', () => {
  it('renderiza los tabs y el contenido del primero por defecto', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText('Tab 1')).to.exist;
    expect(screen.getByText('Tab 2')).to.exist;
    expect(screen.getByText('Contenido 1')).to.exist;
  });

  it('cambia de tab al hacer click y muestra el contenido correspondiente', async () => {
    render(<Tabs tabs={tabs} />);
    const tab2Buttons = screen.getAllByText('Tab 2');
    fireEvent.click(tab2Buttons[0]);
    const tabpanel = await screen.findByRole('tabpanel');
    expect(within(tabpanel).getByText('Contenido 2')).to.exist;
    expect(within(tabpanel).queryByText('Contenido 1')).to.not.exist;
  });
}); 