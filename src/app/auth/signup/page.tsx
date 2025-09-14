'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const { signUp, signInWithGoogle } = useAuth()
  const [resendLoading, setResendLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const { error } = await signUp(email, password)
    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for the confirmation link.')
    }

    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)

    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
    }

    setLoading(false)
  }

  const handleResendConfirmation = async () => {
    setError(null)
    if (!email) {
      setError('Enter your email above first')
      return
    }
    setResendLoading(true)
    try {
      const { error } = await (await import('@/lib/supabase')).supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setError(error.message)
      else setMessage('Confirmation email sent (if the account requires confirmation).')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 shadow-xl">
          <h2 className="text-center text-2xl font-semibold mb-6">Create your account</h2>
          <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/30 p-3">
              <div className="text-sm text-red-300">{error}</div>
            </div>
          )}
          {message && (
            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 p-3">
              <div className="text-sm text-emerald-300">{message}</div>
            </div>
          )}
          <div className="space-y-3">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="text-sm text-right">
            <Link
              href="/auth/signin"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Already have an account?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-white/10 text-sm font-medium rounded-md text-white bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              Sign up with Google
            </button>
          </div>
        </form>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={resendLoading}
            className="w-full text-sm text-indigo-300 hover:text-indigo-200 underline"
          >
            {resendLoading ? 'Sending…' : 'Resend confirmation email'}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
