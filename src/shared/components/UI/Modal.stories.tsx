import type { Meta, StoryObj } from "@storybook/react";
import { Modal } from "./Modal";
import { useState } from "react";

const meta = {
  title: "UI/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl", "full"],
    },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

const ModalTemplate = (args: React.ComponentProps<typeof Modal>) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button
        className="px-4 py-2 bg-primary-500 text-white rounded"
        onClick={() => setIsOpen(true)}
      >
        Abrir Modal
      </button>
      <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export const Default: Story = {
  render: ModalTemplate,
  args: {
    title: "Título del Modal",
    description: "Esta es una descripción del modal que explica su propósito.",
    children: (
      <div className="space-y-4">
        <p>Este es el contenido del modal.</p>
        <button className="px-4 py-2 bg-primary-500 text-white rounded">
          Acción Principal
        </button>
      </div>
    ),
  },
};

export const Small: Story = {
  render: ModalTemplate,
  args: {
    size: "sm",
    title: "Modal Pequeño",
    children: (
      <p>
        Este es un modal de tamaño pequeño, ideal para confirmaciones rápidas.
      </p>
    ),
  },
};

export const Large: Story = {
  render: ModalTemplate,
  args: {
    size: "lg",
    title: "Modal Grande",
    description: "Ideal para contenido extenso o formularios complejos.",
    children: (
      <div className="space-y-4">
        <p>
          Este es un modal de tamaño grande que puede contener más contenido.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-100 rounded">Columna 1</div>
          <div className="p-4 bg-gray-100 rounded">Columna 2</div>
        </div>
      </div>
    ),
  },
};

export const FullWidth: Story = {
  render: ModalTemplate,
  args: {
    size: "full",
    title: "Modal de Ancho Completo",
    children: (
      <div className="space-y-4">
        <p>Este modal ocupa todo el ancho de la pantalla.</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-100 rounded">Sección 1</div>
          <div className="p-4 bg-gray-100 rounded">Sección 2</div>
          <div className="p-4 bg-gray-100 rounded">Sección 3</div>
        </div>
      </div>
    ),
  },
};

export const WithoutHeader: Story = {
  render: ModalTemplate,
  args: {
    children: (
      <div className="text-center">
        <p>Este modal no tiene encabezado ni descripción.</p>
        <button className="mt-4 px-4 py-2 bg-primary-500 text-white rounded">
          Cerrar
        </button>
      </div>
    ),
  },
};

export const WithForm: Story = {
  render: ModalTemplate,
  args: {
    title: "Formulario de Contacto",
    description: "Complete el formulario para contactarnos.",
    children: (
      <form className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Nombre
          </label>
          <input
            type="text"
            id="name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-700"
          >
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
