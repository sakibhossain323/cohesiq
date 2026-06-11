import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import { DELIVERABLE_DEFINITIONS } from "@/lib/deliverables";
import type { DeliverableCode, PlatformType } from "@/lib/types";
import { CAMPAIGN_PLATFORMS, CAMPAIGN_DELIVERABLES_BY_PLATFORM } from "./constants";
import type { DeliverableFormState } from "./types";

interface Props {
  selectedPlatforms: PlatformType[];
  deliverableState: DeliverableFormState;
  carouselIdx: number;
  onCarouselChange: (idx: number) => void;
  onToggle: (code: DeliverableCode) => void;
  onUpdate: (code: DeliverableCode, updates: Partial<{ quantity: string; notes: string }>) => void;
}

export function DeliverableCarousel({
  selectedPlatforms, deliverableState, carouselIdx, onCarouselChange, onToggle, onUpdate,
}: Props) {
  const supportedPlatforms = selectedPlatforms.filter(p => CAMPAIGN_DELIVERABLES_BY_PLATFORM[p]?.length);
  if (supportedPlatforms.length === 0) return null;

  const idx = Math.min(carouselIdx, Math.max(0, supportedPlatforms.length - 1));
  const activePlatform = supportedPlatforms[idx];

  return (
    <div className="cc-subpanel">
      <div className="cc-subhead">
        <Layers className="h-4 w-4 text-brand-primary" />
        Content Deliverables
      </div>

      <div className="px-6 pt-2 pb-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <PlatformBadge platform={activePlatform} />
          <span className="font-display font-bold text-base">
            {CAMPAIGN_PLATFORMS.find(p => p.value === activePlatform)?.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">{idx + 1} / {supportedPlatforms.length}</span>
          <button type="button" disabled={idx === 0} onClick={() => onCarouselChange(idx - 1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" disabled={idx >= supportedPlatforms.length - 1} onClick={() => onCarouselChange(idx + 1)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-6 pt-3 flex items-center gap-2">
        {supportedPlatforms.map((platform, i) => (
          <button key={platform} type="button" onClick={() => onCarouselChange(i)}
            className={cn("h-1.5 rounded-full transition-all",
              i === idx ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/40")} />
        ))}
      </div>

      <div className="px-6 pb-6 pt-4 grid gap-3">
        {(CAMPAIGN_DELIVERABLES_BY_PLATFORM[activePlatform] || []).map(code => {
          const definition = DELIVERABLE_DEFINITIONS[code];
          const value = deliverableState[code] || { selected: false, quantity: "1", notes: "" };
          return (
            <div key={code} className={cn(
              "grid gap-3 rounded-xl border p-4 transition-colors sm:grid-cols-[minmax(0,1fr)_96px]",
              value.selected ? "border-primary bg-brand-soft/50" : "border-border bg-background"
            )}>
              <button type="button" aria-pressed={value.selected} onClick={() => onToggle(code)}
                className="flex min-w-0 items-center gap-3 text-left">
                <span className={cn("flex h-4 w-4 shrink-0 rounded border-2",
                  value.selected ? "border-primary bg-primary" : "border-muted-foreground/40")} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{definition.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {definition.platform === "youtube"
                      ? "Creator pricing can match seeded YouTube rates."
                      : "Creator rate cards can match this exact format."}
                  </span>
                </span>
              </button>
              <div className="space-y-1.5">
                <Label htmlFor={`qty-${code}`} className="text-xs text-muted-foreground">Qty</Label>
                <Input id={`qty-${code}`} type="number" min="1" disabled={!value.selected}
                  value={value.quantity} onChange={e => onUpdate(code, { quantity: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor={`notes-${code}`} className="sr-only">Notes for {definition.label}</Label>
                <Input id={`notes-${code}`} disabled={!value.selected} value={value.notes}
                  onChange={e => onUpdate(code, { notes: e.target.value })}
                  placeholder={`Optional notes for ${definition.label.toLowerCase()}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
