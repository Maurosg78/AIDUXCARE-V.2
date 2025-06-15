// Importar los matchers de jest-dom para que estén disponibles en todos los tests
require('@testing-library/jest-dom');

const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno desde .env.local para que los tests accedan a las llaves de API
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Limpiar después de cada prueba
const { afterEach } = require('vitest');
const { cleanup } = require('@testing-library/react');

afterEach(() => {
  cleanup();
}); 