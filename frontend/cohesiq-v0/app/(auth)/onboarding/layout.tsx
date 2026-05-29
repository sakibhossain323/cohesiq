import { OnboardingProvider } from '@/components/providers/OnboardingProvider';
import { ReactNode } from 'react';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}
