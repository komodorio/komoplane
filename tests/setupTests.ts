import 'jest-environment-jsdom';

// Polyfill for Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock import.meta for Vite compatibility
Object.defineProperty(global, 'importMeta', {
  value: {
    env: {
      DEV: false,
      PROD: true,
    },
  },
});

// Mock window.heap for analytics
Object.defineProperty(window, 'heap', {
  value: {
    track: jest.fn(),
  },
  writable: true,
});

// Mock window object
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/',
    search: '',
    hash: '',
    href: 'http://localhost',
  },
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock console methods for cleaner test output
const originalWarn = console.warn;
const originalError = console.error;

beforeEach(() => {
  // Reset console mocks before each test
  console.warn = jest.fn();
  console.error = jest.fn();
  
  // Reset heap mock
  if (window.heap && window.heap.track) {
    (window.heap.track as jest.Mock).mockClear();
  }
});

afterEach(() => {
  // Restore original console methods after each test
  console.warn = originalWarn;
  console.error = originalError;
});
