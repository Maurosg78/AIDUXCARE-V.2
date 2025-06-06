// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import Accordion from './Accordion';

const meta = {
  title: 'UI/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'bordered', 'separated'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  {
    id: 'item-1',
    title: '¿Qué es AiDuxCare?',
    content: (
      <div className="space-y-2">
        <p>
          AiDuxCare es una plataforma de inteligencia artificial diseñada para
          mejorar la experiencia del usuario en el cuidado de la salud.
        </p>
        <p>
          Utiliza algoritmos avanzados para analizar y optimizar los procesos de
          atención médica, proporcionando recomendaciones personalizadas y
          mejorando la eficiencia operativa.
        </p>
      </div>
    ),
  },
  {
    id: 'item-2',
    title: '¿Cómo funciona?',
    content: (
      <div className="space-y-2">
        <p>
          La plataforma utiliza machine learning para analizar grandes volúmenes de
          datos médicos y generar insights valiosos.
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Análisis de datos en tiempo real</li>
          <li>Predicción de tendencias</li>
          <li>Optimización de recursos</li>
          <li>Personalización de la atención</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'item-3',
    title: '¿Qué beneficios ofrece?',
    content: (
      <div className="space-y-2">
        <p>
          AiDuxCare ofrece múltiples beneficios tanto para profesionales de la
          salud como para pacientes:
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded">
            <h4 className="font-medium mb-2">Para Profesionales</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Mejor gestión del tiempo</li>
              <li>Decisiones más precisas</li>
              <li>Reducción de errores</li>
            </ul>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <h4 className="font-medium mb-2">Para Pacientes</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Atención más rápida</li>
              <li>Mejor seguimiento</li>
              <li>Mayor satisfacción</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
];

export const Default: Story = {
  args: {
    items,
  },
};

export const Bordered: Story = {
  args: {
    items,
    variant: 'bordered',
  },
};

export const Separated: Story = {
  args: {
    items,
    variant: 'separated',
  },
};

export const Small: Story = {
  args: {
    items,
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    items,
    size: 'lg',
  },
};

export const WithDefaultOpen: Story = {
  args: {
    items,
    defaultOpen: ['item-1'],
  },
};

export const WithDisabledItem: Story = {
  args: {
    items: [
      ...items,
      {
        id: 'item-4',
        title: 'Funcionalidad en desarrollo',
        content: (
          <p>
            Esta funcionalidad estará disponible próximamente. Estamos trabajando
            para ofrecerte la mejor experiencia.
          </p>
        ),
        disabled: true,
      },
    ],
  },
};

export const WithCustomContent: Story = {
  args: {
    items: [
      {
        id: 'faq',
        title: 'Preguntas Frecuentes',
        content: (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">¿Cómo puedo empezar?</h4>
              <p className="text-sm text-gray-600">
                Para comenzar a usar AiDuxCare, simplemente regístrate en nuestra
                plataforma y sigue el proceso de onboarding.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">¿Es seguro?</h4>
              <p className="text-sm text-gray-600">
                Sí, utilizamos las más altas medidas de seguridad y cumplimos con
                todas las regulaciones de protección de datos.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">¿Necesito capacitación?</h4>
              <p className="text-sm text-gray-600">
                No, la plataforma está diseñada para ser intuitiva y fácil de usar.
                Sin embargo, ofrecemos capacitación opcional.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: 'pricing',
        title: 'Planes y Precios',
        content: (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded">
              <h4 className="font-medium mb-2">Básico</h4>
              <p className="text-2xl font-bold mb-2">$99/mes</p>
              <ul className="space-y-2 text-sm">
                <li>✓ Funcionalidades básicas</li>
                <li>✓ Soporte por email</li>
                <li>✓ Actualizaciones</li>
              </ul>
            </div>
            <div className="p-4 border border-primary-500 rounded">
              <h4 className="font-medium mb-2">Profesional</h4>
              <p className="text-2xl font-bold mb-2">$199/mes</p>
              <ul className="space-y-2 text-sm">
                <li>✓ Todas las funcionalidades básicas</li>
                <li>✓ Soporte prioritario</li>
                <li>✓ API access</li>
              </ul>
            </div>
            <div className="p-4 border border-gray-200 rounded">
              <h4 className="font-medium mb-2">Empresarial</h4>
              <p className="text-2xl font-bold mb-2">$499/mes</p>
              <ul className="space-y-2 text-sm">
                <li>✓ Todas las funcionalidades</li>
                <li>✓ Soporte 24/7</li>
                <li>✓ Personalización</li>
              </ul>
            </div>
          </div>
        ),
      },
    ],
  },
}; 