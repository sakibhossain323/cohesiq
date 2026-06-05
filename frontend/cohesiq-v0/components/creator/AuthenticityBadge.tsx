import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Shield } from "lucide-react";

interface Props {
  score?: number;
  size?: "sm" | "md";
}

interface ScoreTier {
  label: string;
  flags: string[];
  colorClass: string;
  iconClass: string;
  Icon: React.ElementType;
}

function getTier(score: number): ScoreTier {
  if (score >= 80) return {
    label: "Verified",
    flags: ["Authentic Growth", "Organic Engagement"],
    colorClass: "border-green-200 bg-green-50 text-green-700 dark:bg-green-950/40 dark:border-green-800 dark:text-green-300",
    iconClass: "text-green-500",
    Icon: ShieldCheck,
  };
  if (score >= 60) return {
    label: "Mostly Organic",
    flags: ["Mostly Organic", "Minor Patterns Detected"],
    colorClass: "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300",
    iconClass: "text-amber-500",
    Icon: Shield,
  };
  if (score >= 40) return {
    label: "Mixed Signals",
    flags: ["Mixed Signals", "Review Recommended"],
    colorClass: "border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300",
    iconClass: "text-orange-500",
    Icon: ShieldAlert,
  };
  return {
    label: "Suspicious",
    flags: ["Anomalous Growth", "Suspicious Activity"],
    colorClass: "border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300",
    iconClass: "text-red-500",
    Icon: ShieldAlert,
  };
}

export function AuthenticityBadge({ score, size = "sm" }: Props) {
  const isSmall = size === "sm";

  if (score === undefined || score === null) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium cursor-help
              border-muted-foreground/20 bg-muted text-muted-foreground
              ${isSmall ? "text-xs" : "text-sm"}`}>
              <ShieldQuestion className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} />
              Trust: Pending
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-56 text-center">
            <p className="font-medium mb-1">Authenticity score not yet computed</p>
            <p className="text-xs text-muted-foreground">
              AI-powered trust scoring is coming soon. It analyzes follower growth patterns,
              engagement authenticity, and content consistency.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const tier = getTier(score);
  const { Icon } = tier;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium cursor-help
            ${tier.colorClass} ${isSmall ? "text-xs" : "text-sm"}`}>
            <Icon className={`${isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} ${tier.iconClass}`} />
            Trust: {score}/100
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-64">
          <p className="font-medium mb-1">{tier.label} · {score}/100</p>
          <ul className="text-xs text-muted-foreground space-y-0.5 mb-2">
            {tier.flags.map(f => <li key={f}>· {f}</li>)}
          </ul>
          <p className="text-xs text-muted-foreground border-t pt-1.5 mt-1">
            AI-scored — analyzes follower growth patterns, engagement authenticity,
            and content consistency. Powered by Cohesiq Authenticity Engine.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
