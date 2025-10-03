import 'dotenv/config';
import '@testing-library/jest-dom/vitest';

import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();        // limpia el DOM entre tests
  vi.clearAllMocks();
});

// defaults seguros en tests
if (!process.env.AIDUX_ENABLE_FIREBASE) process.env.AIDUX_ENABLE_FIREBASE = '0';
if (!process.env.AIDUX_USE_EMULATORS) process.env.AIDUX_USE_EMULATORS = '0';
