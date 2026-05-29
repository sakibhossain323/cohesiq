'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/components/providers/OnboardingProvider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
      sub: subNiches
    });
    router.push('/onboarding/creator/platforms');
  };

  const handleBack = () => {
    router.push('/onboarding/creator/personal-info');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Select your niches</h2>
        <p className="text-sm text-muted-foreground mt-1">
          What topics do you create content about?
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="primaryNiche">Primary Niche *</Label>
          <Select value={primaryNiche} onValueChange={setPrimaryNiche} required>
            <SelectTrigger id="primaryNiche">
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

        <div className="space-y-3">
          <Label>Sub-Niches (Select up to 3)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {NICHES.filter((n) => n.id.toString() !== primaryNiche).map((niche) => (
              <div key={niche.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`niche-${niche.id}`}
                  checked={subNiches.includes(niche.id)}
                  onCheckedChange={() => toggleSubNiche(niche.id)}
                  disabled={!subNiches.includes(niche.id) && subNiches.length >= 3}
                />
                <label
                  htmlFor={`niche-${niche.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {niche.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!primaryNiche}>
          Next Step
        </Button>
      </div>
    </div>
  );
}
