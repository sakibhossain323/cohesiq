'use client'

import { useTransition } from 'react'
import { updateCampaignStatus } from '../_actions/update-status'
import type { AdminCampaign } from '@/lib/api/admin'

const STATUSES = ['draft', 'active', 'in_progress', 'completed', 'cancelled', 'archived']

export function CampaignsClient({ campaigns }: { campaigns: AdminCampaign[] }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="border-b text-left">
            <th className="py-3 px-4 font-medium">Title</th>
            <th className="py-3 px-4 font-medium">Status</th>
            <th className="py-3 px-4 font-medium">Visibility</th>
            <th className="py-3 px-4 font-medium">Max Budget</th>
            <th className="py-3 px-4 font-medium">Created</th>
            <th className="py-3 px-4 font-medium">Change Status</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <CampaignRow key={c.id} campaign={c} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CampaignRow({ campaign }: { campaign: AdminCampaign }) {
  const [pending, startTransition] = useTransition()

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="py-3 px-4 max-w-48 truncate">{campaign.title}</td>
      <td className="py-3 px-4">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted capitalize">
          {campaign.status.replace('_', ' ')}
        </span>
      </td>
      <td className="py-3 px-4 capitalize">{campaign.visibility}</td>
      <td className="py-3 px-4">{campaign.budget_per_creator_max.toLocaleString('en-US')}</td>
      <td className="py-3 px-4">{new Date(campaign.created_at).toLocaleDateString('en-US', { timeZone: 'UTC' })}</td>
      <td className="py-3 px-4">
        <select
          disabled={pending}
          value={campaign.status}
          onChange={(e) => startTransition(() => updateCampaignStatus(campaign.id, e.target.value))}
          className="text-xs border rounded px-2 py-1 bg-background disabled:opacity-50"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </td>
    </tr>
  )
}
