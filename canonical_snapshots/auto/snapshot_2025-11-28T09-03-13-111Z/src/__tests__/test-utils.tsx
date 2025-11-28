import React from 'react';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

// Configuración de future flags para React Router v7 en tests
const future = {
  v7_startTransition: true,
  v7_relativeSplatPath: true
};

// Wrapper para tests con router configurado
export function renderWithRouter(
  ui: React.ReactElement,
  {
    route = '/',
    routes = [
      {
        path: '/',
        element: ui,
      },
    ],
  } = {}
) {
  const router = createMemoryRouter(routes, {
    initialEntries: [route],
    future
  });

  return {
    ...render(<RouterProvider router={router} />),
    router,
  };
}

// Wrapper para tests que necesitan múltiples rutas
export function renderWithRouterAndRoutes(
  routes: Array<{
    path: string;
    element: React.ReactElement;
  }>,
  {
    route = '/',
  } = {}
) {
  const router = createMemoryRouter(routes, {
    initialEntries: [route],
    future
  });

  return {
    ...render(<RouterProvider router={router} />),
    router,
  };
} 