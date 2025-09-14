import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-white/10 bg-white/[0.02]">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-white/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>
          © {new Date().getFullYear()} PROOF. All rights reserved.
        </p>
        <nav className="flex items-center gap-4">
          <Link className="hover:text-white transition-colors" href="/">Home</Link>
          <Link className="hover:text-white transition-colors" href="/settings/profile">Profile</Link>
          <Link className="hover:text-white transition-colors" href="/auth/signin">Sign in</Link>
        </nav>
      </div>
    </footer>
  )
}
