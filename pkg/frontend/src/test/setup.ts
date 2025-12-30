import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with testing-library matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock fetch globally for tests
global.fetch = vi.fn();

// Mock XMLHttpRequest for analytics tests
global.XMLHttpRequest = vi.fn(() => ({
  open: vi.fn(),
  send: vi.fn(),
  readyState: 4,
  responseText: '{"Analytics": true, "CurVer": "test-version"}',
  onload: null,
}));

// Setup console methods for testing
// eslint-disable-next-line no-console
console.debug = vi.fn();
