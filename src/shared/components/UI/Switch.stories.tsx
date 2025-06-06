// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
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
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {
    label: 'Activar notificaciones',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Activar notificaciones',
    helperText: 'Recibirás actualizaciones importantes',
  },
};

export const WithError: Story = {
  args: {
    label: 'Activar notificaciones',
    error: 'Debes activar las notificaciones',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    label: 'Switch pequeño',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    label: 'Switch mediano',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    label: 'Switch grande',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    label: 'Switch outline',
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    label: 'Switch filled',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Switch deshabilitado',
    disabled: true,
  },
};

export const Checked: Story = {
  args: {
    label: 'Switch activado',
    defaultChecked: true,
  },
}; 