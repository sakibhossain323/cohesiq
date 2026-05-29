import { 
  Youtube, 
  Instagram, 
  Facebook, 
  Twitter,
  Linkedin,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformType } from "@/lib/types";

interface PlatformBadgeProps {
  platform: PlatformType;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const platformConfig: Record<PlatformType, { icon: LucideIcon; label: string; color: string }> = {
  youtube: { icon: Youtube, label: "YouTube", color: "text-red-600" },
  instagram: { icon: Instagram, label: "Instagram", color: "text-pink-600" },
  facebook: { icon: Facebook, label: "Facebook", color: "text-blue-600" },
  tiktok: { icon: Twitter, label: "TikTok", color: "text-foreground" }, // Using Twitter icon as placeholder
  twitter_x: { icon: Twitter, label: "X", color: "text-foreground" },
  linkedin: { icon: Linkedin, label: "LinkedIn", color: "text-blue-700" },
  snapchat: { icon: Twitter, label: "Snapchat", color: "text-yellow-500" }, // Placeholder
  other: { icon: Twitter, label: "Other", color: "text-muted-foreground" },
};

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function PlatformBadge({ platform, showLabel = false, size = "md" }: PlatformBadgeProps) {
  const config = platformConfig[platform];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cn(sizeClasses[size], config.color)} />
      {showLabel && (
        <span className={cn("font-medium text-foreground", textSizeClasses[size])}>
          {config.label}
        </span>
      )}
    </div>
  );
}

export function getPlatformLabel(platform: PlatformType): string {
  return platformConfig[platform].label;
}
