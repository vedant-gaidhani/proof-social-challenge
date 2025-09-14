import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value
          },
          set(name, value, options) {
            response.cookies.set({ name, value, ...options })
          },
          remove(name, options) {
            response.cookies.delete({ name, ...options })
          },
        },
      }
    )

    // Allow access to auth-related routes and public routes
    const publicRoutes = ['/auth/', '/api/public/']
    if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
      return response
    }

    // Check session for protected routes
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      // Only log if it's not a missing refresh token error
      if (error.status !== 400 || error.code !== 'refresh_token_not_found') {
        console.error('Middleware Session Error:', error)
      }
    }

    // Redirect to signin for protected routes without session, preserve next
    if (!session) {
      const next = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)
      return NextResponse.redirect(new URL(`/auth/signin?next=${next}`, request.url))
    }

    return response
  } catch (err) {
    console.error('Middleware Error:', err)
    return NextResponse.next()
  }
}

// Specify which routes this middleware should run for
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
