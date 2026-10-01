import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// React Testing Library enables both of these on its own only when Vitest globals are on.
// Report state updates that escape act() instead of silently ignoring them.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Unmount everything rendered by a test before the next one starts.
afterEach(() => {
  cleanup();
});
