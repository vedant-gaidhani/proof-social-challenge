'use client'

import { useEffect, useState } from 'react'

type Group = {
  id: string
  name: string
  invite_code: string
  description: string | null
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/groups')
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'Failed to load groups')
      setGroups(body.groups ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load groups')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function createGroup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/groups', { method: 'POST', body: JSON.stringify({ name, description }) })
    const body = await res.json()
    if (!res.ok) setError(body?.error ?? 'Failed to create group')
    setName(''); setDescription('')
    load()
  }

  async function joinGroup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/groups/join', { method: 'POST', body: JSON.stringify({ inviteCode }) })
    const body = await res.json()
    if (!res.ok) setError(body?.error ?? 'Failed to join group')
    setInviteCode('')
    load()
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Groups</h1>
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Create Group</h2>
        <form onSubmit={createGroup} className="space-y-3">
          <input className="w-full px-3 py-2 border rounded" placeholder="Group name" value={name} onChange={e => setName(e.target.value)} />
          <input className="w-full px-3 py-2 border rounded" placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
          <button className="px-4 py-2 rounded bg-indigo-600 text-white">Create</button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Join via Invite</h2>
        <form onSubmit={joinGroup} className="space-y-3">
          <input className="w-full px-3 py-2 border rounded" placeholder="Invite code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
          <button className="px-4 py-2 rounded bg-emerald-600 text-white">Join</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Your Groups</h2>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <ul className="space-y-2">
            {groups.map(g => (
              <li key={g.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{g.name}</div>
                  {g.description && <div className="text-sm text-gray-500">{g.description}</div>}
                </div>
                <div className="text-xs text-gray-500">Invite: {g.invite_code}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
