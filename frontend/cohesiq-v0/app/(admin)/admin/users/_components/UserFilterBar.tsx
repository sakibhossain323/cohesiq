'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function UserFilterBar() {
  const router = useRouter()
  const params = useSearchParams()

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.push(`/admin/users?${next.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <input
        type="search"
        placeholder="Search email…"
        defaultValue={params.get('search') ?? ''}
        onChange={(e) => update('search', e.target.value)}
        className="text-sm border rounded px-3 py-1.5 bg-background w-56"
      />
      <select
        defaultValue={params.get('role') ?? ''}
        onChange={(e) => update('role', e.target.value)}
        className="text-sm border rounded px-3 py-1.5 bg-background"
      >
        <option value="">All roles</option>
        <option value="creator">Creator</option>
        <option value="brand">Brand</option>
        <option value="admin">Admin</option>
      </select>
      <select
        defaultValue={params.get('is_active') ?? ''}
        onChange={(e) => update('is_active', e.target.value)}
        className="text-sm border rounded px-3 py-1.5 bg-background"
      >
        <option value="">All status</option>
        <option value="true">Active</option>
        <option value="false">Suspended</option>
      </select>
    </div>
  )
}
