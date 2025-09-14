import React from 'react'
import { renderToString } from 'react-dom/server'

// Mock the Providers to avoid running Supabase in tests
jest.mock('@/app/providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock next/font to avoid side effects
jest.mock('next/font/google', () => ({
  Inter: () => ({ variable: '--font-inter' }),
}))

import RootLayout from '@/app/layout'

describe('RootLayout', () => {
  it('renders children within layout (SSR string)', () => {
    const html = renderToString(
      <RootLayout>
        <div data-testid="content">Hello</div>
      </RootLayout>
    )
    expect(html).toContain('data-testid="content"')
    expect(html).toContain('Hello')
  })
})
/// <reference types="jest" />
