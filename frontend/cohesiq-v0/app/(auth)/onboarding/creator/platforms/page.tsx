'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import {
  ArrowLeft,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Music2,
  Plus,
  RefreshCw,
  TriangleAlert,
  Twitter,
  X,
  Youtube,
} from 'lucide-react';
import { useOnboarding } from '@/components/providers/OnboardingProvider';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { completeOnboarding, submitCreatorOnboarding } from '../../_actions/onboarding';

const PLATFORMS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter_x', label: 'X (Twitter)' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'other', label: 'Other' },
];

function PlatformGlyph({ platform }: { platform: string }) {
  const map: Record<string, React.ReactNode> = {
    youtube: <Youtube />,
    instagram: <Instagram />,
    tiktok: <Music2 />,
    facebook: <Facebook />,
    twitter_x: <Twitter />,
    linkedin: <Linkedin />,
    other: <Globe />,
  };
  return <>{map[platform] ?? <Globe />}</>;
}

type SyncPlatform = 'youtube' | 'tiktok' | null;

export default function PlatformsStep() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { data, updateData } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncing, setSyncing] = useState<SyncPlatform>(null);
  const [error, setError] = useState<string | null>(null);

  const [platform, setPlatform] = useState('youtube');
  const [handle, setHandle] = useState('');
  const [profileUrl, setProfileUrl] = useState('');

  const handleAddPlatform = () => {
    if (!handle || !profileUrl) return;

    updateData('creatorPlatforms', [
      ...data.creatorPlatforms,
      { platform, handle, profileUrl, followerCount: null },
    ]);

    setHandle('');
    setProfileUrl('');
  };

  const handleRemovePlatform = (index: number) => {
    updateData(
      'creatorPlatforms',
      data.creatorPlatforms.filter((_, i) => i !== index)
    );
  };

  const handleComplete = async (syncPlatform: SyncPlatform = null) => {
    // OAuth sync provides the platform, so a manual entry isn't required then.
    if (!syncPlatform && data.creatorPlatforms.length === 0 && (!handle || !profileUrl)) {
      setError('Please add at least one platform or verify with YouTube / TikTok');
      return;
    }

    // If they filled out the fields but didn't click Add, add it automatically
    let finalPlatforms = [...data.creatorPlatforms];
    if (handle && profileUrl) {
      finalPlatforms.push({ platform, handle, profileUrl, followerCount: null });
      updateData('creatorPlatforms', finalPlatforms);
    }

    setIsSubmitting(true);
    setSyncing(syncPlatform);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication token unavailable. Please try again.');
        setIsSubmitting(false);
        setSyncing(null);
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

      // 4. Route to the OAuth connect flow when syncing, otherwise the dashboard.
      if (syncPlatform === 'youtube') {
        window.location.href = '/creator/dashboard/connect-youtube?autoStart=true';
        return;
      }
      if (syncPlatform === 'tiktok') {
        window.location.href = '/creator/dashboard/connect-tiktok?autoStart=true';
        return;
      }
      window.location.href = '/creator/dashboard';
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsSubmitting(false);
      setSyncing(null);
    }
  };

  const platformLabel = (value: string) => PLATFORMS.find((p) => p.value === value)?.label ?? value;

  return (
    <>
      <div className="ob-stage-head">
        <span className="ob-stage-step">Step 03 · Platforms</span>
        <h2 className="ob-stage-title">Where do you post?</h2>
        <p className="ob-stage-sub">
          Verify with OAuth for an instant, trusted sync — or add a platform manually. Verified
          handles boost your authenticity score and match rank.
        </p>
      </div>

      {error && (
        <div className="ob-alert" role="alert" style={{ marginBottom: 'var(--space-6)' }}>
          <TriangleAlert />
          <span>{error}</span>
        </div>
      )}

      <div className="ob-form">
        {/* ── OAuth sync ─────────────────────────────────────── */}
        <div className="ob-sync">
          <div className="ob-sync-row">
            <span className="ob-sync-glyph yt">
              <Youtube />
            </span>
            <div className="ob-sync-meta">
              <div className="t">Verify with YouTube</div>
              <div className="d">Sync your channel &amp; subscriber count directly from Google.</div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleComplete('youtube')}
              disabled={isSubmitting}
            >
              <RefreshCw className={`ico${syncing === 'youtube' ? ' spin' : ''}`} />
              {syncing === 'youtube' ? 'Syncing…' : 'Sync YouTube'}
            </button>
          </div>

          <div className="ob-sync-row">
            <span className="ob-sync-glyph tt">
              <Music2 />
            </span>
            <div className="ob-sync-meta">
              <div className="t">Verify with TikTok</div>
              <div className="d">Sync your TikTok profile from your authorized account.</div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => handleComplete('tiktok')}
              disabled={isSubmitting}
            >
              <RefreshCw className={`ico${syncing === 'tiktok' ? ' spin' : ''}`} />
              {syncing === 'tiktok' ? 'Syncing…' : 'Sync TikTok'}
            </button>
          </div>
        </div>

        <div className="ob-divider">or add manually</div>

        {/* ── Added platforms ────────────────────────────────── */}
        {data.creatorPlatforms.length > 0 && (
          <div className="ob-field">
            <span className="ob-label">Added platforms</span>
            <div className="ob-added">
              {data.creatorPlatforms.map((p, i) => (
                <div key={`${p.platform}-${i}`} className="ob-added-row">
                  <span className="ob-added-glyph">
                    <PlatformGlyph platform={p.platform} />
                  </span>
                  <div className="ob-added-meta">
                    <div className="nm">{platformLabel(p.platform)}</div>
                    <div className="hd">{p.handle}</div>
                  </div>
                  <button
                    type="button"
                    className="ob-added-remove"
                    aria-label={`Remove ${platformLabel(p.platform)}`}
                    onClick={() => handleRemovePlatform(i)}
                  >
                    <X className="ico" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Manual add panel ───────────────────────────────── */}
        <div className="ob-panel">
          <span className="ob-panel-title">Add a platform</span>

          <div className="ob-field">
            <label className="ob-label">Platform</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="ob-control w-full">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="ob-grid-2">
            <div className="ob-field">
              <label className="ob-label">Handle / username</label>
              <Input
                className="ob-control"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@username"
              />
            </div>
            <div className="ob-field">
              <label className="ob-label">Profile URL</label>
              <Input
                className="ob-control"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>

          <button type="button" className="btn btn-ghost" onClick={handleAddPlatform}>
            <Plus className="ico" /> Add to list
          </button>
        </div>
      </div>

      <div className="ob-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.push('/onboarding/creator/niches')}
          disabled={isSubmitting}
        >
          <ArrowLeft className="ico" /> Back
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => handleComplete()}
          disabled={isSubmitting}
        >
          {isSubmitting && !syncing ? 'Saving…' : 'Complete onboarding'}
        </button>
      </div>
    </>
  );
}
