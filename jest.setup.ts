import '@testing-library/jest-dom';
// Mock client-only chrome in layout to keep tests lightweight
jest.mock('@/components/Navbar', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/Footer', () => ({ __esModule: true, default: () => null }));

// Polyfill TextEncoder/TextDecoder for react-dom/server in Node test env
// Needed when using renderToString in jsdom environment
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'util';

const g = globalThis as unknown as {
  TextEncoder?: typeof NodeTextEncoder;
  TextDecoder?: typeof NodeTextDecoder;
};

if (!g.TextEncoder) g.TextEncoder = NodeTextEncoder;
if (!g.TextDecoder) g.TextDecoder = NodeTextDecoder;
