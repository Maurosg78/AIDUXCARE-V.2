import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'filled'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
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
type Story = StoryObj<typeof Select>;

const options = [
  { value: '1', label: 'Opción 1' },
  { value: '2', label: 'Opción 2' },
  { value: '3', label: 'Opción 3' },
  { value: '4', label: 'Opción 4', disabled: true },
  { value: '5', label: 'Opción 5' },
];

export const Default: Story = {
  args: {
    label: 'Selecciona una opción',
    options,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Selecciona una opción',
    helperText: 'Esta es una descripción de ayuda',
    options,
  },
};

export const WithError: Story = {
  args: {
    label: 'Selecciona una opción',
    error: 'Debes seleccionar una opción',
    options,
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Select pequeño',
    options,
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    label: 'Select mediano',
    options,
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Select grande',
    options,
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    label: 'Select outline',
    options,
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    label: 'Select filled',
    options,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Select deshabilitado',
    options,
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Select ancho completo',
    options,
    fullWidth: true,
  },
}; 