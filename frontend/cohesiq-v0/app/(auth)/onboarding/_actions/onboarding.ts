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

// ── Onboarding Data Submission ────────────────────────────────────────────────
// These Server Actions POST onboarding data to the FastAPI backend from the
// Next.js server using BACKEND_API_URL (Docker internal network). This means
// the browser never needs a public API URL for these critical mutations.

export async function submitBrandOnboarding(
  token: string,
  payload: { role: string; brandProfile: Record<string, unknown> }
): Promise<{ success: true } | { error: string }> {
  const apiBase = process.env.BACKEND_API_URL || 'http://backend:8000';
  try {
    const res = await fetch(`${apiBase}/auth/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: text || 'Failed to save brand profile data' };
    }
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Network error submitting brand onboarding' };
  }
}

export async function submitCreatorOnboarding(
  token: string,
  payload: {
    role: string;
    creatorProfile: Record<string, unknown>;
    creatorNiches: unknown;
    creatorPlatforms: unknown;
  }
): Promise<{ success: true } | { error: string }> {
  const apiBase = process.env.BACKEND_API_URL || 'http://backend:8000';
  try {
    const res = await fetch(`${apiBase}/auth/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      const message = errData?.detail
        ? JSON.stringify(errData.detail)
        : 'Failed to save creator profile data';
      return { error: message };
    }
    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Network error submitting creator onboarding' };
  }
}
