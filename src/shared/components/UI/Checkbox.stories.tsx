// Storybook legacy compatibility
import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
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
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {
    label: 'Acepto los términos y condiciones',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Acepto recibir notificaciones',
    helperText: 'Te enviaremos actualizaciones importantes',
  },
};

export const WithError: Story = {
  args: {
    label: 'Acepto los términos y condiciones',
    error: 'Debes aceptar los términos y condiciones',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Checkbox pequeño',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    label: 'Checkbox mediano',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Checkbox grande',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    label: 'Checkbox outline',
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    label: 'Checkbox filled',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Checkbox deshabilitado',
    disabled: true,
  },
};

export const Checked: Story = {
  args: {
    label: 'Checkbox marcado',
    defaultChecked: true,
  },
}; 