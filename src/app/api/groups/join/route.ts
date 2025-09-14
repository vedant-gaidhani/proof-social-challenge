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

export async function POST(request: Request) {
  const { response, supabase } = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const inviteCode: string | undefined = body.inviteCode
  if (!inviteCode) return NextResponse.json({ error: 'inviteCode required' }, { status: 400 })

  const { data: group, error: findError } = await supabase
    .from('groups')
    .select('id, name, invite_code')
    .eq('invite_code', inviteCode)
    .single()

  if (findError || !group) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })

  const { error: joinError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'member' })

  if (joinError) return NextResponse.json({ error: joinError.message }, { status: 400 })

  return NextResponse.json({ ok: true, group }, { headers: response.headers })
}
