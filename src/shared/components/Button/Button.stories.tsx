// Storybook legacy compatibility
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'success', 'warning', 'error', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    isLoading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    fullWidth: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Botón Primario',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Botón Secundario',
    variant: 'secondary',
  },
};

export const Accent: Story = {
  args: {
    children: 'Botón de Acento',
    variant: 'accent',
  },
};

export const Success: Story = {
  args: {
    children: 'Botón de Éxito',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Botón de Advertencia',
    variant: 'warning',
  },
};

export const Error: Story = {
  args: {
    children: 'Botón de Error',
    variant: 'error',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Botón Fantasma',
    variant: 'ghost',
  },
};

export const Loading: Story = {
  args: {
    children: 'Cargando...',
    isLoading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Botón Deshabilitado',
    disabled: true,
  },
};

export const WithIcons: Story = {
  args: {
    children: 'Botón con Íconos',
    leftIcon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
    ),
    rightIcon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    ),
  },
};

export const FullWidth: Story = {
  args: {
    children: 'Botón de Ancho Completo',
    fullWidth: true,
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Button size="sm">Botón Pequeño</Button>
      <Button size="md">Botón Mediano</Button>
      <Button size="lg">Botón Grande</Button>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Button variant="primary">Botón Primario</Button>
      <Button variant="secondary">Botón Secundario</Button>
      <Button variant="accent">Botón de Acento</Button>
      <Button variant="success">Botón de Éxito</Button>
      <Button variant="warning">Botón de Advertencia</Button>
      <Button variant="error">Botón de Error</Button>
      <Button variant="ghost">Botón Fantasma</Button>
    </div>
  ),
}; 