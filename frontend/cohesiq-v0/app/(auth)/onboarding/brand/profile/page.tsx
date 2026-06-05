'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useOnboarding } from '@/components/providers/OnboardingProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { completeOnboarding, submitBrandOnboarding } from '../../_actions/onboarding';

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
    <div className="flex min-h-screen flex-col bg-muted/30 p-4">
      <div className="mx-auto w-full max-w-2xl flex-1 mt-10">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Brand Setup</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Tell us about your brand to start posting campaigns.
        </p>

        <div className="bg-background rounded-lg border shadow-sm p-6 space-y-6">
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brandName">Brand Name *</Label>
              <Input 
                id="brandName" 
                name="brandName" 
                value={formData.brandName} 
                onChange={handleChange} 
                placeholder="Acme Corp" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Brand Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="What does your brand do?" 
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input 
                  id="website" 
                  name="website" 
                  value={formData.website} 
                  onChange={handleChange} 
                  placeholder="https://..." 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  name="city" 
                  value={formData.city} 
                  onChange={handleChange} 
                  placeholder="Dhaka" 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleComplete} disabled={isSubmitting || !formData.brandName}>
              {isSubmitting ? 'Saving...' : 'Complete Onboarding'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
