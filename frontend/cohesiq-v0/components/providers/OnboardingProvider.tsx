'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'creator' | 'brand' | null;

interface OnboardingData {
  role: Role;
  creatorProfile: {
    displayName: string;
    bio: string;
    tagline: string;
    city: string;
    gender: string;
  };
  creatorNiches: {
    primary: number | null;
    sub: number[];
  };
  creatorPlatforms: Array<{
    platform: string;
    handle: string;
    profileUrl: string;
    followerCount: number | null;
  }>;
  brandProfile: {
    brandName: string;
    description: string;
    website: string;
    city: string;
  };
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (section: keyof OnboardingData, payload: any) => void;
  setRole: (role: Role) => void;
}

const defaultData: OnboardingData = {
  role: null,
  creatorProfile: {
    displayName: '',
    bio: '',
    tagline: '',
    city: '',
    gender: '',
  },
  creatorNiches: {
    primary: null,
    sub: [],
  },
  creatorPlatforms: [],
  brandProfile: {
    brandName: '',
    description: '',
    website: '',
    city: '',
  },
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData);

  const updateData = (section: keyof OnboardingData, payload: any) => {
    setData((prev) => ({
      ...prev,
      [section]: Array.isArray(payload) ? payload : { ...prev[section as keyof OnboardingData], ...payload },
    }));
  };

  const setRole = (role: Role) => {
    setData((prev) => ({ ...prev, role }));
  };

  return (
    <OnboardingContext.Provider value={{ data, updateData, setRole }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
