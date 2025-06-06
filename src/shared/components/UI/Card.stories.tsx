// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
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
    fullWidth: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Título de la tarjeta</CardTitle>
          <CardDescription>Descripción de la tarjeta</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Contenido de la tarjeta</p>
        </CardContent>
        <CardFooter>
          <p>Pie de la tarjeta</p>
        </CardFooter>
      </>
    ),
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: (
      <>
        <CardHeader>
          <CardTitle>Tarjeta pequeña</CardTitle>
          <CardDescription>Descripción corta</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Contenido reducido</p>
        </CardContent>
      </>
    ),
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    children: (
      <>
        <CardHeader>
          <CardTitle>Tarjeta mediana</CardTitle>
          <CardDescription>Descripción media</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Contenido estándar</p>
        </CardContent>
      </>
    ),
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: (
      <>
        <CardHeader>
          <CardTitle>Tarjeta grande</CardTitle>
          <CardDescription>Descripción extensa</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Contenido amplio</p>
        </CardContent>
      </>
    ),
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: (
      <>
        <CardHeader>
          <CardTitle>Tarjeta outline</CardTitle>
          <CardDescription>Con borde más grueso</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Contenido con estilo outline</p>
        </CardContent>
      </>
    ),
  },
};

export const Filled: Story = {
  args: {
    variant: 'filled',
    children: (
      <>
        <CardHeader>
          <CardTitle>Tarjeta filled</CardTitle>
          <CardDescription>Con fondo gris claro</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Contenido con estilo filled</p>
        </CardContent>
      </>
    ),
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: (
      <>
        <CardHeader>
          <CardTitle>Tarjeta ancho completo</CardTitle>
          <CardDescription>Ocupa todo el ancho disponible</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Contenido que se expande</p>
        </CardContent>
      </>
    ),
  },
};

export const WithImage: Story = {
  args: {
    children: (
      <>
        <img
          src="https://via.placeholder.com/400x200"
          alt="Imagen de ejemplo"
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <CardHeader>
          <CardTitle>Tarjeta con imagen</CardTitle>
          <CardDescription>Incluye una imagen en la parte superior</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Contenido con imagen</p>
        </CardContent>
      </>
    ),
  },
}; 