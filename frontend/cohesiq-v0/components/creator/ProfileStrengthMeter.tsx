import { CheckCircle2, Circle } from "lucide-react";
import { computeProfileStrength } from "@/lib/profileStrength";
import type { Creator } from "@/lib/types";

interface ProfileStrengthMeterProps {
  creator: Creator;
}

export function ProfileStrengthMeter({ creator }: ProfileStrengthMeterProps) {
  const { score, items, level, levelColor } = computeProfileStrength(creator);

  const incomplete = items.filter(i => !i.done);

  return (
    <div className="w-full mt-6 pt-6 border-t border-border space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Profile Strength
        </span>
        <span className={`text-xs font-bold ${levelColor}`}>{level}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            score >= 85 ? "bg-purple-500" :
            score >= 65 ? "bg-blue-500" :
            score >= 40 ? "bg-amber-500" :
            "bg-muted-foreground/40"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground text-right">{score}% complete</p>

      {/* Next steps — show up to 3 incomplete items */}
      {incomplete.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-xs font-semibold text-muted-foreground">Next steps:</p>
          {incomplete.slice(0, 3).map(item => (
            <div key={item.label} className="flex items-start gap-2">
              <Circle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground leading-snug">{item.tip}</p>
            </div>
          ))}
        </div>
      )}

      {/* All done */}
      {incomplete.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
          <CheckCircle2 className="h-4 w-4" />
          Profile fully complete!
        </div>
      )}
    </div>
  );
}
