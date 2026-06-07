'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useOnboarding } from '@/components/providers/OnboardingProvider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PersonalInfoStep() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [formData, setFormData] = useState(data.creatorProfile);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, gender: value }));
  };

  const handleNext = () => {
    updateData('creatorProfile', formData);
    router.push('/onboarding/creator/niches');
  };

  return (
    <>
      <div className="ob-stage-head">
        <span className="ob-stage-step">Step 01 · Personal info</span>
        <h2 className="ob-stage-title">Tell us about yourself</h2>
        <p className="ob-stage-sub">
          This is the first thing brands see on your public profile. Make it count.
        </p>
      </div>

      <div className="ob-form">
        <div className="ob-field">
          <label htmlFor="displayName" className="ob-label">
            Display name <span className="req">*</span>
          </label>
          <Input
            id="displayName"
            name="displayName"
            className="ob-control"
            value={formData.displayName}
            onChange={handleChange}
            placeholder="e.g. Maisha Ahmed"
            required
          />
        </div>

        <div className="ob-field">
          <label htmlFor="tagline" className="ob-label">
            Tagline <span className="opt">Optional</span>
          </label>
          <Input
            id="tagline"
            name="tagline"
            className="ob-control"
            value={formData.tagline}
            onChange={handleChange}
            placeholder="Tech reviewer & lifestyle vlogger"
          />
          <span className="ob-hint">One line that captures what you make.</span>
        </div>

        <div className="ob-field">
          <label htmlFor="bio" className="ob-label">
            Bio <span className="opt">Optional</span>
          </label>
          <Textarea
            id="bio"
            name="bio"
            className="ob-control"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Write a short bio about your content, your audience, and the brands you love working with…"
            rows={4}
          />
        </div>

        <div className="ob-grid-2">
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

          <div className="ob-field">
            <label htmlFor="gender" className="ob-label">
              Gender <span className="opt">Optional</span>
            </label>
            <Select value={formData.gender} onValueChange={handleSelectChange}>
              <SelectTrigger id="gender" className="ob-control w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="non_binary">Non-binary</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="ob-actions end">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleNext}
          disabled={!formData.displayName}
        >
          Next step <ArrowRight className="ico arrow" />
        </button>
      </div>
    </>
  );
}
