// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import { Radio } from './Radio';

const meta: Meta<typeof Radio> = {
  title: 'UI/Radio',
  component: Radio,
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
type Story = StoryObj<typeof Radio>;

export const Default: Story = {
  args: {
    label: 'Opción 1',
    name: 'radio-group',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Opción 1',
    helperText: 'Esta es una descripción de ayuda',
    name: 'radio-group',
  },
};

export const WithError: Story = {
  args: {
    label: 'Opción 1',
    error: 'Debes seleccionar una opción',
    name: 'radio-group',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Radio pequeño',
    name: 'radio-group',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    label: 'Radio mediano',
    name: 'radio-group',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Radio grande',
    name: 'radio-group',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    label: 'Radio outline',
    name: 'radio-group',
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    label: 'Radio filled',
    name: 'radio-group',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Radio deshabilitado',
    disabled: true,
    name: 'radio-group',
  },
};

export const Checked: Story = {
  args: {
    label: 'Radio marcado',
    defaultChecked: true,
    name: 'radio-group',
  },
}; 