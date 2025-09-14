import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const runtime = 'nodejs'

async function createClient(response?: NextResponse) {
  const cookieStore = await cookies()
  const res = response ?? NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const c = cookieStore.get(name)
          return c?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: '', ...options, maxAge: 0 })
        },
      },
    }
  )
  return { supabase, response: res }
}

export async function GET() {
  const { supabase } = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('groups')
    .select('id, name, invite_code, description, avatar_url, created_at, updated_at, created_by')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ groups: data })
}

export async function POST(request: Request) {
  const { response, supabase } = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const name: string | undefined = body.name
  const description: string | undefined = body.description
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  // Simple invite code generator
  const invite_code = Math.random().toString(36).slice(2, 10)

  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, description: description ?? null, invite_code, created_by: user.id })
    .select('id, name, invite_code, description, created_by, created_at, updated_at')
    .single()

  if (error || !group) return NextResponse.json({ error: error?.message ?? 'Failed to create group' }, { status: 400 })

  // Make creator an admin member (ignore errors if policy blocks; not critical to creation)
  await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id, role: 'admin' })

  return NextResponse.json({ group }, { headers: response.headers })
}
