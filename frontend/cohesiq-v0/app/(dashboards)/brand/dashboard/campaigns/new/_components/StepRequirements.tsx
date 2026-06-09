import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Calendar, Info } from "lucide-react";
import { PlatformBadge } from "@/components/shared/PlatformBadge";
import type { DeliverableCode, PlatformType } from "@/lib/types";
import { CAMPAIGN_PLATFORMS } from "./constants";
import { DeliverableCarousel } from "./DeliverableCarousel";
import type { CampaignFormData, DeliverableFormState } from "./types";

type FormFields = Pick<
  CampaignFormData,
  "required_platforms" | "budget_per_creator_max" | "number_of_creators" | "creator_min_followers" | "application_deadline"
>;

interface Props extends FormFields {
  deliverableState: DeliverableFormState;
  carouselIdx: number;
  onCarouselChange: (idx: number) => void;
  onPlatformToggle: (platform: PlatformType) => void;
  onToggleDeliverable: (code: DeliverableCode) => void;
  onUpdateDeliverable: (code: DeliverableCode, updates: Partial<{ quantity: string; notes: string }>) => void;
  onChange: (updates: Partial<CampaignFormData>) => void;
}

export function StepRequirements({
  required_platforms, budget_per_creator_max, number_of_creators,
  creator_min_followers, application_deadline,
  deliverableState, carouselIdx, onCarouselChange,
  onPlatformToggle, onToggleDeliverable, onUpdateDeliverable, onChange,
}: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="creators">Creators Needed <span className="text-destructive">*</span></Label>
          <Input id="creators" type="number" required min="1" value={number_of_creators}
            onChange={e => onChange({ number_of_creators: e.target.value })} />
        </div>
        <div className="space-y-2">
          <TooltipProvider>
            <Label htmlFor="budget" className="flex items-center gap-1.5">
              Budget / creator <span className="text-destructive">*</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>Exact payment terms are finalised in the contract.</TooltipContent>
              </Tooltip>
            </Label>
          </TooltipProvider>
          <div className="relative">
            <Input id="budget" type="number" required min="0" value={budget_per_creator_max}
              onChange={e => onChange({ budget_per_creator_max: e.target.value })}
              placeholder="e.g. 15000" className="pr-12" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">BDT</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="followers">Min. followers <span className="text-destructive">*</span></Label>
          <Input id="followers" type="number" required min="0" value={creator_min_followers}
            onChange={e => onChange({ creator_min_followers: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Deadline
          </Label>
          <Input id="deadline" type="date" value={application_deadline}
            onChange={e => onChange({ application_deadline: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <TooltipProvider>
          <Label className="flex items-center gap-1.5">
            Required Platforms <span className="text-destructive">*</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>Matching only considers creators active on at least one selected platform.</TooltipContent>
            </Tooltip>
          </Label>
        </TooltipProvider>
        <div className="flex flex-wrap gap-2">
          {CAMPAIGN_PLATFORMS.map(platform => {
            const isSelected = required_platforms.includes(platform.value);
            return (
              <button key={platform.value} type="button" aria-pressed={isSelected}
                onClick={() => onPlatformToggle(platform.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                  isSelected
                    ? "border-primary bg-brand-soft/60 text-primary ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground/40 hover:bg-surface-subtle"
                )}>
                <PlatformBadge platform={platform.value} />
                {platform.label}
              </button>
            );
          })}
        </div>
      </div>

      <DeliverableCarousel
        selectedPlatforms={required_platforms}
        deliverableState={deliverableState}
        carouselIdx={carouselIdx}
        onCarouselChange={onCarouselChange}
        onToggle={onToggleDeliverable}
        onUpdate={onUpdateDeliverable}
      />
    </>
  );
}
