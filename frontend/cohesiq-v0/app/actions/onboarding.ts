'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'

export async function completeOnboarding(role: 'creator' | 'brand', name?: string) {
  const { userId } = await auth()

  if (!userId) {
    return { error: 'No signed-in user' }
  }

  const client = await clerkClient()

  try {
    // Try to split the name into first and last name for Clerk
    let firstName = name;
    let lastName = undefined;
    if (name && name.includes(' ')) {
      const parts = name.split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    }

    await client.users.updateUser(userId, {
      firstName,
      lastName,
      publicMetadata: {
        role,
        onboardingComplete: true,
      },
    })
    
    return { success: true }
  } catch (err) {
    console.error('Error updating user metadata:', err)
    return { error: 'There was an error updating the user metadata.' }
  }
}

export async function resetOnboarding() {
  const { userId } = await auth()

  if (!userId) {
    return { error: 'No signed-in user' }
  }

  const client = await clerkClient()

  try {
    await client.users.updateUser(userId, {
      publicMetadata: {
        onboardingComplete: false,
      },
    })
    return { success: true }
  } catch (err) {
    console.error('Error resetting user metadata:', err)
    return { error: 'There was an error resetting the user metadata.' }
  }
}
