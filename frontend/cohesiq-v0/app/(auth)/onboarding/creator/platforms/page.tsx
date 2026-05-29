'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useOnboarding } from '@/components/providers/OnboardingProvider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { completeOnboarding } from '@/app/actions/onboarding';

export default function PlatformsStep() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { data, updateData } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [platform, setPlatform] = useState('youtube');
  const [handle, setHandle] = useState('');
  const [profileUrl, setProfileUrl] = useState('');

  const handleAddPlatform = () => {
    if (!handle || !profileUrl) return;
    
    updateData('creatorPlatforms', [
      ...data.creatorPlatforms,
      { platform, handle, profileUrl, followerCount: null }
    ]);
    
    setHandle('');
    setProfileUrl('');
  };

  const handleComplete = async () => {
    if (data.creatorPlatforms.length === 0 && (!handle || !profileUrl)) {
      setError('Please add at least one platform');
      return;
    }
    
    // If they filled out the fields but didn't click Add, add it automatically
    let finalPlatforms = [...data.creatorPlatforms];
    if (handle && profileUrl) {
      finalPlatforms.push({ platform, handle, profileUrl, followerCount: null });
      updateData('creatorPlatforms', finalPlatforms);
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      
      // 1. Save all data to backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: data.role || 'creator',
          creatorProfile: data.creatorProfile,
          creatorNiches: data.creatorNiches,
          creatorPlatforms: finalPlatforms
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        console.error("Backend validation error:", errData);
        throw new Error(errData?.detail ? JSON.stringify(errData.detail) : 'Failed to save profile data');
      }

      // 2. Set Clerk onboardingComplete
      const clerkRes = await completeOnboarding('creator', data.creatorProfile.displayName);
      if (clerkRes?.error) {
        throw new Error(clerkRes.error);
      }

      // 3. Reload Clerk user to refresh the JWT with the new metadata
      if (user) {
        await user.reload();
      }

      window.location.href = '/dashboard/creator';
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Connect your platforms</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add at least one platform where you post content.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Added Platforms List */}
      {data.creatorPlatforms.length > 0 && (
        <div className="space-y-3 mb-6">
          <Label>Added Platforms</Label>
          <div className="space-y-2">
            {data.creatorPlatforms.map((p, i) => (
              <div key={i} className="flex justify-between items-center p-3 border rounded-md bg-muted/50">
                <div>
                  <p className="font-medium capitalize">{p.platform}</p>
                  <p className="text-xs text-muted-foreground">{p.handle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Platform Form */}
      <div className="space-y-4 border p-4 rounded-md">
        <h3 className="text-sm font-medium">Add Platform</h3>
        
        <div className="space-y-2">
          <Label>Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger>
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="twitter_x">X (Twitter)</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Handle / Username</Label>
            <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@username" />
          </div>
          <div className="space-y-2">
            <Label>Profile URL</Label>
            <Input value={profileUrl} onChange={(e) => setProfileUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>

        <Button type="button" variant="secondary" onClick={handleAddPlatform} className="w-full">
          Add to List
        </Button>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => router.push('/onboarding/creator/niches')} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={handleComplete} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Complete Onboarding'}
        </Button>
      </div>
    </div>
  );
}
