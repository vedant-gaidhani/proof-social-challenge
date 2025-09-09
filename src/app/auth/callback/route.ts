import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')
    const redirectTo = requestUrl.searchParams.get('next') ?? '/'

    if (error) {
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/signin?error=${error}&error_description=${error_description}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/signin?error=missing_code`
      )
    }

    const cookieStore = await cookies()
    const response = NextResponse.redirect(new URL(redirectTo, requestUrl.origin))

    // Initialize the Supabase client with cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            return cookie?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              path: '/',
            })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              path: '/',
            })
          }
        }
      }
    )

    // Exchange the code for a session
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/signin?error=${sessionError.message}`
      )
    }

    // Successful authentication, redirect to next path or home page with cookies attached
    return response
  } catch (err) {
    console.error('Auth callback error:', err)
    return NextResponse.redirect(
      `${new URL(request.url).origin}/auth/signin?error=unknown_error`
    )
  }
}
