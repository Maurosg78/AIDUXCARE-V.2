import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
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
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    label: 'Descripción',
    placeholder: 'Escribe una descripción...',
    rows: 4,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Descripción',
    placeholder: 'Escribe una descripción...',
    helperText: 'Máximo 500 caracteres',
    rows: 4,
  },
};

export const WithError: Story = {
  args: {
    label: 'Descripción',
    placeholder: 'Escribe una descripción...',
    error: 'La descripción es requerida',
    rows: 4,
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Textarea pequeño',
    placeholder: 'Escribe algo...',
    rows: 3,
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    label: 'Textarea mediano',
    placeholder: 'Escribe algo...',
    rows: 4,
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Textarea grande',
    placeholder: 'Escribe algo...',
    rows: 5,
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    label: 'Textarea outline',
    placeholder: 'Escribe algo...',
    rows: 4,
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    label: 'Textarea filled',
    placeholder: 'Escribe algo...',
    rows: 4,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Textarea deshabilitado',
    placeholder: 'No puedes escribir aquí',
    disabled: true,
    rows: 4,
  },
};

export const FullWidth: Story = {
  args: {
    label: 'Textarea ancho completo',
    placeholder: 'Escribe algo...',
    fullWidth: true,
    rows: 4,
  },
}; 