'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type Profile = {
  id: string
  username: string | null
  full_name: string | null
  bio: string | null
  avatar_url: string | null
}

export default function ProfileSettingsPage() {
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, full_name, bio, avatar_url')
        .eq('id', user.id)
        .single()
      if (error) setError(error.message)
      else setProfile(data as Profile)
    }
    load()
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return
    setError(null)
    setMessage(null)
    setSaving(true)
    type UserUpdate = Database['public']['Tables']['users']['Update']
    const updatePayload: UserUpdate = {
      username: profile.username,
      full_name: profile.full_name,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
    }

    const { error } = await supabase
      .from('users')
      // @ts-expect-error Supabase SSR client generics can narrow to `never` here
      // The payload conforms to Database['public']['Tables']['users']['Update']
      .update(updatePayload)
      .eq('id', user.id)
    setSaving(false)
    if (error) setError(error.message)
    else setMessage('Profile updated')
  }

  if (loading) return <div className="p-6 text-center">Loading…</div>
  if (!user) return <div className="p-6 text-center">Please sign in to edit your profile.</div>
  if (!profile) return <div className="p-6 text-center">Loading profile…</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Profile Settings</h1>
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}
        {message && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{message}</div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            className="w-full px-3 py-2 border rounded-md"
            value={profile.username ?? ''}
            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input
            className="w-full px-3 py-2 border rounded-md"
            value={profile.full_name ?? ''}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            className="w-full px-3 py-2 border rounded-md"
            rows={4}
            value={profile.bio ?? ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Avatar URL</label>
          <input
            className="w-full px-3 py-2 border rounded-md"
            value={profile.avatar_url ?? ''}
            onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
