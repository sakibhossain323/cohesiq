'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useOnboarding } from '@/components/providers/OnboardingProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NICHES = [
  { id: 1, name: 'Technology' },
  { id: 2, name: 'Gaming' },
  { id: 3, name: 'Fashion' },
  { id: 4, name: 'Beauty' },
  { id: 5, name: 'Food' },
  { id: 6, name: 'Travel' },
  { id: 7, name: 'Lifestyle' },
  { id: 8, name: 'Education' },
  { id: 9, name: 'Finance' },
  { id: 10, name: 'Fitness' },
  { id: 11, name: 'Parenting' },
  { id: 12, name: 'Entertainment' },
  { id: 13, name: 'News' },
  { id: 14, name: 'Other' },
];

export default function NichesStep() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();

  const [primaryNiche, setPrimaryNiche] = useState<string>(data.creatorNiches.primary?.toString() || '');
  const [subNiches, setSubNiches] = useState<number[]>(data.creatorNiches.sub);

  const toggleSubNiche = (nicheId: number) => {
    setSubNiches((prev) =>
      prev.includes(nicheId)
        ? prev.filter((id) => id !== nicheId)
        : [...prev, nicheId].slice(0, 3) // max 3 sub-niches
    );
  };

  const handleNext = () => {
    updateData('creatorNiches', {
      primary: parseInt(primaryNiche),
      sub: subNiches,
    });
    router.push('/onboarding/creator/platforms');
  };

  const handleBack = () => {
    router.push('/onboarding/creator/personal-info');
  };

  return (
    <>
      <div className="ob-stage-head">
        <span className="ob-stage-step">Step 02 · Your niches</span>
        <h2 className="ob-stage-title">What do you create?</h2>
        <p className="ob-stage-sub">
          Niches power our matching engine — they decide which campaigns surface for you.
        </p>
      </div>

      <div className="ob-form">
        <div className="ob-field">
          <label htmlFor="primaryNiche" className="ob-label">
            Primary niche <span className="req">*</span>
          </label>
          <Select value={primaryNiche} onValueChange={setPrimaryNiche} required>
            <SelectTrigger id="primaryNiche" className="ob-control w-full">
              <SelectValue placeholder="Select your main niche" />
            </SelectTrigger>
            <SelectContent>
              {NICHES.map((niche) => (
                <SelectItem key={niche.id} value={niche.id.toString()}>
                  {niche.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ob-field">
          <label className="ob-label">
            Sub-niches
            <span className="opt">{subNiches.length}/3 selected</span>
          </label>
          <div className="ob-chips">
            {NICHES.filter((n) => n.id.toString() !== primaryNiche).map((niche) => {
              const selected = subNiches.includes(niche.id);
              const locked = !selected && subNiches.length >= 3;
              return (
                <button
                  key={niche.id}
                  type="button"
                  className="ob-chip"
                  aria-pressed={selected}
                  disabled={locked}
                  onClick={() => toggleSubNiche(niche.id)}
                >
                  <Check className="chk" strokeWidth={3} />
                  {niche.name}
                </button>
              );
            })}
          </div>
          <span className="ob-hint">Pick up to three areas you also cover.</span>
        </div>
      </div>

      <div className="ob-actions">
        <button type="button" className="btn btn-ghost" onClick={handleBack}>
          <ArrowLeft className="ico" /> Back
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleNext} disabled={!primaryNiche}>
          Next step <ArrowRight className="ico arrow" />
        </button>
      </div>
    </>
  );
}
