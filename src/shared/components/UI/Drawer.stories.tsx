// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import { Drawer } from './Drawer';
import { useState } from 'react';

const meta = {
  title: 'UI/Drawer',
  component: Drawer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: ['left', 'right', 'top', 'bottom'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const DrawerTemplate = (args: React.ComponentProps<typeof Drawer>) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        className="px-4 py-2 bg-primary-500 text-white rounded"
        onClick={() => setIsOpen(true)}
      >
        Abrir Drawer
      </button>
      <Drawer {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export const Default: Story = {
  render: DrawerTemplate,
  args: {
    title: 'Título del Drawer',
    description: 'Esta es una descripción del drawer que explica su propósito.',
    children: (
      <div className="space-y-4">
        <p>Este es el contenido del drawer.</p>
        <button className="px-4 py-2 bg-primary-500 text-white rounded">
          Acción Principal
        </button>
      </div>
    ),
  },
};

export const Left: Story = {
  render: DrawerTemplate,
  args: {
    position: 'left',
    title: 'Drawer Izquierdo',
    children: (
      <div className="space-y-4">
        <p>Este drawer se abre desde la izquierda.</p>
        <nav className="space-y-2">
          <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
            Inicio
          </button>
          <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
            Perfil
          </button>
          <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
            Configuración
          </button>
        </nav>
      </div>
    ),
  },
};

export const Top: Story = {
  render: DrawerTemplate,
  args: {
    position: 'top',
    size: 'full',
    title: 'Drawer Superior',
    children: (
      <div className="space-y-4">
        <p>Este drawer se abre desde arriba y ocupa todo el ancho.</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-100 rounded">Sección 1</div>
          <div className="p-4 bg-gray-100 rounded">Sección 2</div>
          <div className="p-4 bg-gray-100 rounded">Sección 3</div>
        </div>
      </div>
    ),
  },
};

export const Bottom: Story = {
  render: DrawerTemplate,
  args: {
    position: 'bottom',
    size: 'full',
    title: 'Drawer Inferior',
    children: (
      <div className="space-y-4">
        <p>Este drawer se abre desde abajo y ocupa todo el ancho.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-100 rounded">Columna 1</div>
          <div className="p-4 bg-gray-100 rounded">Columna 2</div>
        </div>
      </div>
    ),
  },
};

export const Small: Story = {
  render: DrawerTemplate,
  args: {
    size: 'sm',
    title: 'Drawer Pequeño',
    children: (
      <p>Este es un drawer de tamaño pequeño, ideal para menús de navegación.</p>
    ),
  },
};

export const Large: Story = {
  render: DrawerTemplate,
  args: {
    size: 'lg',
    title: 'Drawer Grande',
    description: 'Ideal para contenido extenso o formularios complejos.',
    children: (
      <div className="space-y-4">
        <p>Este es un drawer de tamaño grande que puede contener más contenido.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-100 rounded">Columna 1</div>
          <div className="p-4 bg-gray-100 rounded">Columna 2</div>
        </div>
      </div>
    ),
  },
};

export const WithoutHeader: Story = {
  render: DrawerTemplate,
  args: {
    children: (
      <div className="text-center">
        <p>Este drawer no tiene encabezado ni descripción.</p>
        <button className="mt-4 px-4 py-2 bg-primary-500 text-white rounded">
          Cerrar
        </button>
      </div>
    ),
  },
};

export const WithForm: Story = {
  render: DrawerTemplate,
  args: {
    title: 'Formulario de Contacto',
    description: 'Complete el formulario para contactarnos.',
    children: (
      <form className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nombre
          </label>
          <input
            type="text"
            id="name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">
            Mensaje
          </label>
          <textarea
            id="message"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
          >
            Enviar
          </button>
        </div>
      </form>
    ),
  },
}; 