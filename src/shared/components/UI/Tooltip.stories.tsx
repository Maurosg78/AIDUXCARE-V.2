import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "./Tooltip";

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "filled"],
    },
    position: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: "Este es un tooltip por defecto",
    children: (
      <button className="px-4 py-2 bg-primary-500 text-white rounded">
        Hover me
      </button>
    ),
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    content: "Tooltip con borde",
    children: (
      <button className="px-4 py-2 bg-white border border-gray-200 rounded">
        Hover me
      </button>
    ),
  },
};

export const Filled: Story = {
  args: {
    variant: "filled",
    content: "Tooltip con fondo de color",
    children: (
      <button className="px-4 py-2 bg-gray-100 rounded">Hover me</button>
    ),
  },
};

export const Top: Story = {
  args: {
    position: "top",
    content: "Tooltip en la parte superior",
    children: (
      <button className="px-4 py-2 bg-primary-500 text-white rounded">
        Hover me
      </button>
    ),
  },
};

export const Right: Story = {
  args: {
    position: "right",
    content: "Tooltip en la derecha",
    children: (
      <button className="px-4 py-2 bg-primary-500 text-white rounded">
        Hover me
      </button>
    ),
  },
};

export const Bottom: Story = {
  args: {
    position: "bottom",
    content: "Tooltip en la parte inferior",
    children: (
      <button className="px-4 py-2 bg-primary-500 text-white rounded">
        Hover me
      </button>
    ),
  },
};

export const Left: Story = {
  args: {
    position: "left",
    content: "Tooltip en la izquierda",
    children: (
      <button className="px-4 py-2 bg-primary-500 text-white rounded">
        Hover me
      </button>
    ),
  },
};

export const WithHTML: Story = {
  args: {
    content: (
      <div>
        <strong>Tooltip con HTML</strong>
        <p className="text-xs mt-1">Incluye contenido formateado</p>
      </div>
    ),
    children: (
      <button className="px-4 py-2 bg-primary-500 text-white rounded">
        Hover me
      </button>
    ),
  },
};

export const WithIcon: Story = {
  args: {
    content: "Tooltip con icono",
    children: (
      <button className="p-2 bg-gray-100 rounded-full" aria-label="Información">
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    ),
  },
};
