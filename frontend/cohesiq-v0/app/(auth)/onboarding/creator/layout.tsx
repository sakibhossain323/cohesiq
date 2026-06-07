'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { OnboardingShell } from '../_components/OnboardingShell';
import { OnboardingStepper } from '../_components/OnboardingStepper';

const STEP_PATHS = [
  '/onboarding/creator/personal-info',
  '/onboarding/creator/niches',
  '/onboarding/creator/platforms',
];

export default function CreatorOnboardingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentStepIndex = Math.max(0, STEP_PATHS.indexOf(pathname));

  return (
    <OnboardingShell
      accent="warm"
      eyebrow="Creator onboarding"
      title={
        <>
          Build a profile brands <span className="ob-grad">come looking for.</span>
        </>
      }
      lead="Three quick steps. The richer your profile, the higher you rank when brands search your niche."
      note={
        <>
          Step <strong>{currentStepIndex + 1}</strong> of 3
        </>
      }
      rail={<OnboardingStepper current={currentStepIndex} />}
    >
      {children}
    </OnboardingShell>
  );
}
