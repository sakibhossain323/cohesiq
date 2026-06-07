'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { BarChart3, LayoutPanelLeft, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react';
import { useOnboarding } from '@/components/providers/OnboardingProvider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { completeOnboarding, submitBrandOnboarding } from '../../_actions/onboarding';
import { OnboardingShell } from '../../_components/OnboardingShell';

const BRAND_POINTS = [
  { icon: <Sparkles />, label: 'AI-ranked creator matches by niche & engagement' },
  { icon: <ShieldCheck />, label: 'Authenticity scoring — fake-follower detection built in' },
  { icon: <LayoutPanelLeft />, label: 'Brief-to-payment campaign workspace' },
  { icon: <BarChart3 />, label: 'ROI tracking on every collaboration' },
];

export default function BrandProfileStep() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { data, updateData } = useOnboarding();
  const [formData, setFormData] = useState(data.brandProfile);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);
    updateData('brandProfile', formData);

    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication token unavailable. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // 1. Save data to backend via Server Action (runs on Next.js server using Docker-internal URL)
      const backendRes = await submitBrandOnboarding(token, {
        role: data.role || 'brand',
        brandProfile: formData as Record<string, unknown>,
      });

      if ('error' in backendRes) {
        throw new Error(backendRes.error);
      }

      // 2. Set Clerk onboardingComplete
      const clerkRes = await completeOnboarding('brand', data.brandProfile.brandName);
      if (clerkRes?.error) {
        throw new Error(clerkRes.error);
      }

      // 3. Reload Clerk user to refresh the JWT with the new metadata
      if (user) {
        await user.reload();
      }

      window.location.href = '/brand/dashboard';
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingShell
      accent="brand"
      eyebrow="Brand onboarding"
      title={
        <>
          Find creators who actually <span className="ob-grad">fit your brand.</span>
        </>
      }
      lead="Set up your brand once. Then post a brief and let the matching engine surface the right creators — no DMs, no guesswork."
      note={<strong>Final step</strong>}
      rail={
        <ul className="ob-points">
          {BRAND_POINTS.map((point) => (
            <li key={point.label}>
              <span className="pi">{point.icon}</span>
              <span>{point.label}</span>
            </li>
          ))}
        </ul>
      }
    >
      <div className="ob-stage-head">
        <span className="ob-stage-step">Brand profile</span>
        <h2 className="ob-stage-title">Set up your brand</h2>
        <p className="ob-stage-sub">Tell us who you are so creators know exactly who they&apos;re working with.</p>
      </div>

      {error && (
        <div className="ob-alert" role="alert" style={{ marginBottom: 'var(--space-6)' }}>
          <TriangleAlert />
          <span>{error}</span>
        </div>
      )}

      <div className="ob-form">
        <div className="ob-field">
          <label htmlFor="brandName" className="ob-label">
            Brand name <span className="req">*</span>
          </label>
          <Input
            id="brandName"
            name="brandName"
            className="ob-control"
            value={formData.brandName}
            onChange={handleChange}
            placeholder="e.g. Aarong"
            required
          />
        </div>

        <div className="ob-field">
          <label htmlFor="description" className="ob-label">
            Brand description <span className="opt">Optional</span>
          </label>
          <Textarea
            id="description"
            name="description"
            className="ob-control"
            value={formData.description}
            onChange={handleChange}
            placeholder="What does your brand do, and what kind of creators are you looking for?"
            rows={4}
          />
        </div>

        <div className="ob-grid-2">
          <div className="ob-field">
            <label htmlFor="website" className="ob-label">
              Website <span className="opt">Optional</span>
            </label>
            <Input
              id="website"
              name="website"
              className="ob-control"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://…"
            />
          </div>

          <div className="ob-field">
            <label htmlFor="city" className="ob-label">
              City <span className="opt">Optional</span>
            </label>
            <Input
              id="city"
              name="city"
              className="ob-control"
              value={formData.city}
              onChange={handleChange}
              placeholder="Dhaka"
            />
          </div>
        </div>
      </div>

      <div className="ob-actions end">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleComplete}
          disabled={isSubmitting || !formData.brandName}
        >
          {isSubmitting ? 'Saving…' : 'Complete onboarding'}
        </button>
      </div>
    </OnboardingShell>
  );
}
