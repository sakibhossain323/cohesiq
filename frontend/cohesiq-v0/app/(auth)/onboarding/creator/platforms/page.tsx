'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useOnboarding } from '@/components/providers/OnboardingProvider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';
import { completeOnboarding, submitCreatorOnboarding } from '../../_actions/onboarding';

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

  const handleComplete = async (syncPlatform: "youtube" | "tiktok" | null = null) => {
    if (!syncPlatform && data.creatorPlatforms.length === 0 && (!handle || !profileUrl)) {
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
      if (!token) {
        setError('Authentication token unavailable. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      // 1. Save all data to backend via Server Action (runs on Next.js server using Docker-internal URL)
      const backendRes = await submitCreatorOnboarding(token, {
        role: data.role || 'creator',
        creatorProfile: data.creatorProfile as Record<string, unknown>,
        creatorNiches: data.creatorNiches,
        creatorPlatforms: finalPlatforms,
      });

      if ('error' in backendRes) {
        throw new Error(backendRes.error);
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

      if (syncPlatform === "youtube") {
        window.location.href = '/creator/dashboard/connect-youtube?autoStart=true';
        return;
      }
      if (syncPlatform === "tiktok") {
        window.location.href = '/creator/dashboard/connect-tiktok?autoStart=true';
        return;
      }
      window.location.href = '/creator/dashboard';
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

      <div className="rounded-md border border-border bg-muted/40 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Verify with YouTube OAuth</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Finish onboarding and sync your channel directly from Google.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => handleComplete("youtube")}
            disabled={isSubmitting}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Sync YouTube'}
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted/40 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">Verify with TikTok OAuth</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Finish onboarding and sync your TikTok profile directly from your authorized account.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleComplete("tiktok")}
            disabled={isSubmitting}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Sync TikTok'}
          </Button>
        </div>
      </div>

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
        <div className="flex gap-3">
          <Button onClick={() => handleComplete()} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Complete Onboarding'}
          </Button>
        </div>
      </div>
    </div>
  );
}
