import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Hash, Target } from "lucide-react";
import type { CampaignFormData } from "./types";

type FormFields = Pick<
  CampaignFormData,
  "hashtags" | "tracking_notes" | "kpi_reach" | "kpi_engagement_rate" | "kpi_conversions" | "kpi_roi_target"
>;

interface Props extends FormFields {
  onChange: (updates: Partial<CampaignFormData>) => void;
}

export function StepGoals({
  hashtags, tracking_notes, kpi_reach, kpi_engagement_rate, kpi_conversions, kpi_roi_target, onChange,
}: Props) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="hashtags" className="flex items-center gap-1">
          <Hash className="h-3 w-3" /> Hashtags
        </Label>
        <Input id="hashtags" value={hashtags} onChange={e => onChange({ hashtags: e.target.value })}
          placeholder="#brandname, #campaign2026 (comma-separated)" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tracking_notes">Tracking Notes</Label>
        <Textarea id="tracking_notes" rows={2} value={tracking_notes}
          onChange={e => onChange({ tracking_notes: e.target.value })}
          placeholder="UTM parameters, promo codes, or other tracking instructions..." />
      </div>
      <div>
        <Label className="mb-3 flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-muted-foreground" /> KPI Targets
        </Label>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="kpi_reach" className="text-xs text-muted-foreground">Target Reach</Label>
            <Input id="kpi_reach" type="number" min="0" value={kpi_reach}
              onChange={e => onChange({ kpi_reach: e.target.value })} placeholder="e.g. 50000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kpi_engagement_rate" className="text-xs text-muted-foreground">Engagement Rate (%)</Label>
            <Input id="kpi_engagement_rate" type="number" min="0" step="0.1" value={kpi_engagement_rate}
              onChange={e => onChange({ kpi_engagement_rate: e.target.value })} placeholder="e.g. 3.5" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kpi_conversions" className="text-xs text-muted-foreground">Target Conversions</Label>
            <Input id="kpi_conversions" type="number" min="0" value={kpi_conversions}
              onChange={e => onChange({ kpi_conversions: e.target.value })} placeholder="e.g. 200" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="kpi_roi_target" className="text-xs text-muted-foreground">ROI Target (%)</Label>
            <Input id="kpi_roi_target" type="number" min="0" step="0.1" value={kpi_roi_target}
              onChange={e => onChange({ kpi_roi_target: e.target.value })} placeholder="e.g. 150" />
          </div>
        </div>
      </div>
    </>
  );
}
