'use server'

import { auth } from '@clerk/nextjs/server'
import { askAdminAssistant, type AssistantReply } from '@/lib/api/admin'

export async function askAssistant(question: string): Promise<AssistantReply> {
  const { getToken } = await auth()
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')
  return askAdminAssistant(token, question)
}
