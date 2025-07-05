import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "filled"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    disabled: {
      control: "boolean",
    },
    fullWidth: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    label: "Correo electrónico",
    placeholder: "ejemplo@correo.com",
    type: "email",
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Contraseña",
    type: "password",
    helperText: "La contraseña debe tener al menos 8 caracteres",
  },
};

export const WithError: Story = {
  args: {
    label: "Nombre de usuario",
    error: "Este nombre de usuario ya está en uso",
    defaultValue: "usuario123",
  },
};

export const WithIcons: Story = {
  args: {
    label: "Buscar",
    placeholder: "Buscar...",
    leftIcon: (
      <svg
        className="h-5 w-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
    rightIcon: (
      <svg
        className="h-5 w-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    label: "Input pequeño",
    placeholder: "Escribe algo...",
  },
};

export const Medium: Story = {
  args: {
    size: "md",
    label: "Input mediano",
    placeholder: "Escribe algo...",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    label: "Input grande",
    placeholder: "Escribe algo...",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    label: "Input outline",
    placeholder: "Escribe algo...",
  },
};

export const Filled: Story = {
  args: {
    variant: "filled",
    label: "Input filled",
    placeholder: "Escribe algo...",
  },
};

export const Disabled: Story = {
  args: {
    label: "Input deshabilitado",
    placeholder: "No puedes escribir aquí",
    disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    label: "Input ancho completo",
    placeholder: "Escribe algo...",
    fullWidth: true,
  },
};
