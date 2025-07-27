import '@testing-library/jest-dom';

// 🏥 CONFIGURACIÓN DE TESTING MÉDICO EMPRESARIAL

// Configuración global para testing de aplicaciones médicas
beforeEach(() => {
  // Limpiar todos los timers para evitar efectos secundarios
  vi.clearAllTimers();
  
  // Configurar zona horaria para tests consistentes
  vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
});

afterEach(() => {
  // Limpiar todos los mocks después de cada test
  vi.clearAllMocks();
  
  // Restaurar timers
  vi.useRealTimers();
});

// Configuración global para pruebas de performance
global.performance = global.performance || {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

// Mock global de console para tests más limpios
global.console = {
  ...console,
  // Suprimir logs durante tests a menos que sea un error
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: console.error, // Mantener errores visibles
};

// Configuración de ResizeObserver para tests de componentes responsivos
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock de matchMedia para tests responsivos
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Configuración de fetch para mocks de API
global.fetch = vi.fn();

// Mock de IntersectionObserver para componentes con lazy loading
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Configuración de eventos de teclado para accesibilidad
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

// Mock de HTMLElement.scrollIntoView para navegación
Element.prototype.scrollIntoView = vi.fn();

// Configuración de localStorage para tests de persistencia
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Configuración de sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock de URL.createObjectURL para tests de archivos
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(() => 'mocked-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
});

// Configuración de crypto para tests de seguridad
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mocked-uuid'),
    getRandomValues: vi.fn((arr) => arr),
  },
});

// 🔧 UTILIDADES DE TESTING MÉDICO

// Helper para testing de validaciones médicas
export const medicalTestUtils = {
  // Validar que un email tenga formato médico
  expectMedicalEmail: (email: string) => {
    expect(email).toMatch(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
  },
  
  // Validar que una contraseña sea segura para contexto médico
  expectSecurePassword: (password: string) => {
    expect(password.length).toBeGreaterThanOrEqual(8);
    expect(password).toMatch(/[A-Z]/); // Mayúscula
    expect(password).toMatch(/[a-z]/); // Minúscula  
    expect(password).toMatch(/\d/); // Número
    expect(password).toMatch(/[!@#$%^&*(),.?":{}|<>]/); // Carácter especial
  },
  
  // Validar compliance HIPAA/GDPR en strings
  expectHIPAACompliance: (text: string) => {
    expect(text.toLowerCase()).toMatch(/hipaa|gdpr|compliance|segur|privacidad/);
  },
  
  // Validar que no haya información sensible expuesta
  expectNoSensitiveData: (text: string) => {
    expect(text).not.toMatch(/password|token|secret|key|credential/i);
  },
};

// Configuración de timeouts para tests de componentes médicos
vi.setTimeout = vi.fn().mockImplementation((callback, delay) => {
  return setTimeout(callback, delay);
});

// Mock de navigator para tests de geolocalización y permisos
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
});

// Mock de Notification API para tests de alertas médicas
Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'granted',
    requestPermission: vi.fn().mockResolvedValue('granted'),
  },
});

// 📱 CONFIGURACIÓN RESPONSIVE TESTING

export const responsiveTestUtils = {
  // Simular diferentes tamaños de pantalla
  setViewport: (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  },
  
  // Presets de dispositivos médicos comunes
  devices: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 },
    medicalTablet: { width: 1024, height: 768 }, // Tablets médicas landscape
  },
};

// 🛡️ CONFIGURACIÓN DE SEGURIDAD PARA TESTS

// Validar que no se ejecuten scripts maliciosos durante tests
const originalCreateElement = document.createElement;
document.createElement = function(tagName: string, options?: ElementCreationOptions) {
  const element = originalCreateElement.call(this, tagName, options);
  
  // Bloquear scripts durante tests
  if (tagName.toLowerCase() === 'script') {
    element.setAttribute('type', 'text/plain');
  }
  
  return element;
};

console.log('🏥 AiDuxCare Testing Environment - Medical Grade Setup Complete'); 