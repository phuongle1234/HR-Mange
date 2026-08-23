import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// @testing-library/react's auto-cleanup relies on detecting a global
// `afterEach`, which isn't installed since this project doesn't enable
// Vitest's `globals` option. Register it explicitly instead.
afterEach(() => {
  cleanup();
});
