'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/components/providers/OnboardingProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Tell us about yourself</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This information will be displayed on your public creator profile.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name *</Label>
          <Input 
            id="displayName" 
            name="displayName" 
            value={formData.displayName} 
            onChange={handleChange} 
            placeholder="John Doe" 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input 
            id="tagline" 
            name="tagline" 
            value={formData.tagline} 
            onChange={handleChange} 
            placeholder="Tech reviewer & lifestyle vlogger" 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea 
            id="bio" 
            name="bio" 
            value={formData.bio} 
            onChange={handleChange} 
            placeholder="Write a short bio about your content..." 
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          
          <div className="space-y-2">
            <Label htmlFor="gender">Gender (Optional)</Label>
            <Select value={formData.gender} onValueChange={handleSelectChange}>
              <SelectTrigger id="gender">
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

      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} disabled={!formData.displayName}>
          Next Step
        </Button>
      </div>
    </div>
  );
}
