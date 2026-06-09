'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const STATUSES = ['draft', 'active', 'in_progress', 'completed', 'cancelled', 'archived']

export function CampaignFilterBar() {
  const router = useRouter()
  const params = useSearchParams()

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.push(`/admin/campaigns?${next.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <select
        defaultValue={params.get('status') ?? ''}
        onChange={(e) => update('status', e.target.value)}
        className="text-sm border rounded px-3 py-1.5 bg-background"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s.replace('_', ' ')}</option>
        ))}
      </select>
      <select
        defaultValue={params.get('visibility') ?? ''}
        onChange={(e) => update('visibility', e.target.value)}
        className="text-sm border rounded px-3 py-1.5 bg-background"
      >
        <option value="">All visibility</option>
        <option value="public">Public</option>
        <option value="private">Private</option>
      </select>
    </div>
  )
}
