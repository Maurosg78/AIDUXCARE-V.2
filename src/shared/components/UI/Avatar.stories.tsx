// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
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
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    fallback: 'JD',
  },
};

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/300',
    alt: 'Avatar de usuario',
    fallback: 'JD',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    fallback: 'JD',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    fallback: 'JD',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    fallback: 'JD',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    fallback: 'JD',
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    fallback: 'JD',
  },
};

export const WithLongName: Story = {
  args: {
    fallback: 'Juan Diego',
  },
};

export const WithError: Story = {
  args: {
    src: 'https://invalid-url.com/avatar.jpg',
    alt: 'Avatar de usuario',
    fallback: 'JD',
  },
}; 