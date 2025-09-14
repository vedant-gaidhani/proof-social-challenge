'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Handle both PKCE (code=...) and OTP (#access_token=...) recovery flows.
    // 1) If "code" is present, explicitly exchange it for a session.
    // 2) Otherwise rely on detectSessionInUrl to process the URL hash and
    //    then wait for a session or PASSWORD_RECOVERY/SIGNED_IN event.
    const init = async () => {
      try {
        // If the redirect carried a PKCE code, exchange it here
        const code = searchParams?.get('code')
        const urlError = searchParams?.get('error')
        const urlErrorDescription = searchParams?.get('error_description')

        if (urlError) {
          setError(urlErrorDescription || 'Password recovery link invalid or expired. Please request a new one.')
          setReady(true)
          return
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            setError(exchangeError.message)
            setReady(true)
            return
          }
          // Remove the code parameter from the URL for cleanliness
          router.replace('/auth/reset-password')
        }

        // Check for an existing session (may be set from the URL hash)
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          setReady(true)
          return
        }

        // If no session yet, wait for auth state changes (e.g. PASSWORD_RECOVERY)
        // Fallback checks are setup outside and cleaned up in the effect's cleanup
      } catch (err) {
        console.error('Reset password init error:', err)
        setError('Something went wrong while verifying the link.')
        setReady(true)
      }
    }
    init()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY')) {
        setReady(true)
      }
    })

    // Fallback: after a short grace period, show an error if still no session
    const timeout = setTimeout(async () => {
      const { data: recheck } = await supabase.auth.getSession()
      if (!recheck.session) {
        setError('Password recovery link invalid or expired. Please request a new one.')
        setReady(true)
      }
    }, 3000)

    return () => {
      listener.subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setMessage('Password updated. Redirecting to sign in...')
    setTimeout(() => router.push('/auth/signin'), 1500)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 shadow-xl">
          <h2 className="text-center text-2xl font-semibold mb-6">Set a new password</h2>
        

        {!ready ? (
          <div className="text-center text-sm text-gray-500">Checking recovery link...</div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            {message && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">{message}</div>
              </div>
            )}
            <div className="space-y-3">
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-500 to-fuchsia-600 hover:from-indigo-400 hover:to-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  )
}
