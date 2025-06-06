// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'text'],
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
    variant: 'primary',
    children: 'Botón Primario',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Botón Secundario',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Botón Outline',
  },
};

export const Text: Story = {
  args: {
    variant: 'text',
    children: 'Botón Texto',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Botón Pequeño',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Botón Mediano',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Botón Grande',
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Cargando...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Deshabilitado',
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Botón Ancho Completo',
  },
};

export const WithIcons: Story = {
  args: {
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
    children: 'Con Iconos',
  },
}; 