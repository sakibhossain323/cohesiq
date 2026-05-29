'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export default function CreatorOnboardingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const steps = [
    { name: 'Personal Info', path: '/onboarding/creator/personal-info' },
    { name: 'Niches', path: '/onboarding/creator/niches' },
    { name: 'Platforms', path: '/onboarding/creator/platforms' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.path === pathname);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 p-4">
      <div className="mx-auto w-full max-w-3xl flex-1 mt-10">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Creator Onboarding</h1>
        
        {/* Progress Bar */}
        <div className="mb-8 relative">
          <div className="flex justify-between relative z-10">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isPast = index < currentStepIndex;
              return (
                <div key={step.name} className="flex flex-col items-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isPast
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-muted bg-background text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xs mt-2 font-medium text-muted-foreground">{step.name}</span>
                </div>
              );
            })}
          </div>
          {/* Track line */}
          <div className="absolute top-4 left-0 h-[2px] w-full bg-border -z-10 px-8" />
        </div>

        {/* Form Content */}
        <div className="bg-background rounded-lg border shadow-sm p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
