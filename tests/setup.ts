// tests/setup.ts (fynfloo-dashboard)
import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/server';

// ─── MSW lifecycle ────────────────────────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
  vi.clearAllMocks();
});
afterAll(() => server.close());

// ─── Next.js router mock ──────────────────────────────────────────────────────
// Individual test files override useRouter when they need mockPush assertions.

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({
    storeId: 'store-123',
    id: 'product-123',
  }),
  usePathname: () => '/dashboard/store-123/products/product-123',
}));

// ─── Next.js Image mock ───────────────────────────────────────────────────────
// JSX is not available in .ts setup files — use createElement directly.

type ImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  [key: string]: unknown;
};

vi.mock('next/image', () => ({
  default: async ({ src, alt, width, height, className }: ImageProps) => {
    const React = await import('react');
    return React.createElement('img', { src, alt, width, height, className });
  },
}));

// ─── console.error filter ─────────────────────────────────────────────────────
// Suppress known React test warnings that are expected and not actionable.

const originalError = console.error;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('Warning: ReactDOM.render') ||
      msg.includes('Warning: An update to') ||
      msg.includes('act(...)')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
