import type { Meta, StoryObj } from "@storybook/react";
import { Tabs } from "./Tabs";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "pills", "underline"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const tabs = [
  {
    id: "tab1",
    label: "Pestaña 1",
    content: (
      <div className="p-4 bg-gray-50 rounded">
        <h3 className="text-lg font-medium">Contenido de la Pestaña 1</h3>
        <p className="mt-2">Este es el contenido de la primera pestaña.</p>
      </div>
    ),
  },
  {
    id: "tab2",
    label: "Pestaña 2",
    content: (
      <div className="p-4 bg-gray-50 rounded">
        <h3 className="text-lg font-medium">Contenido de la Pestaña 2</h3>
        <p className="mt-2">Este es el contenido de la segunda pestaña.</p>
      </div>
    ),
  },
  {
    id: "tab3",
    label: "Pestaña 3",
    content: (
      <div className="p-4 bg-gray-50 rounded">
        <h3 className="text-lg font-medium">Contenido de la Pestaña 3</h3>
        <p className="mt-2">Este es el contenido de la tercera pestaña.</p>
      </div>
    ),
  },
];

export const Default: Story = {
  args: {
    tabs,
  },
};

export const Pills: Story = {
  args: {
    tabs,
    variant: "pills",
  },
};

export const Underline: Story = {
  args: {
    tabs,
    variant: "underline",
  },
};

export const Small: Story = {
  args: {
    tabs,
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    tabs,
    size: "lg",
  },
};

export const WithDisabledTab: Story = {
  args: {
    tabs: [
      ...tabs,
      {
        id: "tab4",
        label: "Pestaña Deshabilitada",
        content: (
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="text-lg font-medium">Contenido de la Pestaña 4</h3>
            <p className="mt-2">Este es el contenido de la cuarta pestaña.</p>
          </div>
        ),
        disabled: true,
      },
    ],
  },
};

export const WithCustomContent: Story = {
  args: {
    tabs: [
      {
        id: "profile",
        label: "Perfil",
        content: (
          <div className="p-4 bg-gray-50 rounded">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full" />
              <div>
                <h3 className="text-lg font-medium">Juan Pérez</h3>
                <p className="text-gray-500">juan.perez@ejemplo.com</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Rol</span>
                <span>Administrador</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Departamento</span>
                <span>TI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Último acceso</span>
                <span>Hace 2 horas</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "settings",
        label: "Configuración",
        content: (
          <div className="p-4 bg-gray-50 rounded">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">
                  Notificaciones
                </h4>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="email"
                      className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="email"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Notificaciones por email
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="push"
                      className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="push"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Notificaciones push
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label
                  htmlFor="theme"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tema
                </label>
                <select
                  id="theme"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  <option>Claro</option>
                  <option>Oscuro</option>
                  <option>Sistema</option>
                </select>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "security",
        label: "Seguridad",
        content: (
          <div className="p-4 bg-gray-50 rounded">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700">
                  Cambiar contraseña
                </h4>
                <div className="mt-2 space-y-2">
                  <div>
                    <label
                      htmlFor="current-password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Contraseña actual
                    </label>
                    <input
                      type="password"
                      id="current-password"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      id="new-password"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Confirmar nueva contraseña
                    </label>
                    <input
                      type="password"
                      id="confirm-password"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">
                  Autenticación de dos factores
                </h4>
                <div className="mt-2">
                  <button className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600">
                    Activar 2FA
                  </button>
                </div>
              </div>
            </div>
          </div>
        ),
      },
    ],
  },
};
