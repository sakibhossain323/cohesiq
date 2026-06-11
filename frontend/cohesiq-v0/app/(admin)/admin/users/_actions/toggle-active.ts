'use server'

import { auth } from '@clerk/nextjs/server'
import { fetchApi } from '@/lib/api/client'
import { revalidatePath } from 'next/cache'

export async function toggleUserActive(userId: string) {
  const { getToken } = await auth()
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')
  await fetchApi(`/admin/users/${userId}/toggle-active`, { method: 'PATCH', token })
  revalidatePath('/admin/users')
}
