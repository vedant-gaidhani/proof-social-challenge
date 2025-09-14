'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/auth'

export default function Navbar() {
  const { user, signOut, loading } = useAuth()

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/30 border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-wide">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-white">P</span>
          <span className="text-white/90">PROOF</span>
        </Link>

        <nav className="flex items-center gap-3">
          {!loading && user ? (
            <>
              <Link href="/settings/profile" className="text-sm text-white/80 hover:text-white transition-colors">
                Profile
              </Link>
              <button
                onClick={() => signOut()}
                className="text-sm text-white/70 hover:text-white/90 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="text-sm text-white/80 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center rounded-md bg-gradient-to-r from-indigo-500 to-fuchsia-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:from-indigo-400 hover:to-fuchsia-500"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

