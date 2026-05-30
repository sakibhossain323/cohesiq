import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NicheBadgeProps {
  niche?: string | null;
  variant?: "default" | "outline";
  size?: "sm" | "md";
}

const nicheColors: Record<string, string> = {
  technology: "bg-blue-50 text-blue-700 border-blue-200",
  fashion: "bg-pink-50 text-pink-700 border-pink-200",
  food: "bg-orange-50 text-orange-700 border-orange-200",
  travel: "bg-teal-50 text-teal-700 border-teal-200",
  gaming: "bg-purple-50 text-purple-700 border-purple-200",
  fitness: "bg-green-50 text-green-700 border-green-200",
  beauty: "bg-rose-50 text-rose-700 border-rose-200",
  finance: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lifestyle: "bg-amber-50 text-amber-700 border-amber-200",
  other: "bg-gray-50 text-gray-700 border-gray-200",
};

export function NicheBadge({ niche, variant = "default", size = "md" }: NicheBadgeProps) {
  const safeNiche = niche || "other";
  const colorClass = nicheColors[safeNiche.toLowerCase()] ?? nicheColors.other;
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        variant === "default" && colorClass,
        size === "sm" && "px-2 py-0.5 text-xs"
      )}
    >
      {niche || "Unknown"}
    </Badge>
  );
}
