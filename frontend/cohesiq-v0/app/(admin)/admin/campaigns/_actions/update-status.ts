'use server'

import { auth } from '@clerk/nextjs/server'
import { fetchApi } from '@/lib/api/client'
import { revalidatePath } from 'next/cache'

export async function updateCampaignStatus(campaignId: string, status: string) {
  const { getToken } = await auth()
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')
  await fetchApi(`/admin/campaigns/${campaignId}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status }),
  })
  revalidatePath('/admin/campaigns')
}
