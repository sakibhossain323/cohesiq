import { OnboardingProvider } from '@/components/providers/OnboardingProvider';
import { ReactNode } from 'react';
import './onboarding.css';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}
