import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Hash, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { NICHE_MAP } from "@/lib/api/campaigns";
import { BRAND_CATEGORIES } from "@/lib/brand-categories";
import { VISIBILITY_OPTIONS } from "./constants";
import type { CampaignFormData } from "./types";

type Props = Pick<CampaignFormData, "title" | "description" | "hashtags" | "primary_niche_id" | "brand_category" | "visibility"> & {
  onChange: (updates: Partial<CampaignFormData>) => void;
};

export function StepBrief({ title, description, hashtags, primary_niche_id, brand_category, visibility, onChange }: Props) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Campaign Title <span className="text-destructive">*</span></Label>
        <Input id="title" required value={title}
          onChange={e => onChange({ title: e.target.value })}
          placeholder="e.g. Summer Tech Review 2026" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Brief <span className="text-destructive">*</span></Label>
        <Textarea id="description" required rows={5} value={description}
          onChange={e => onChange({ description: e.target.value })}
          placeholder="Describe the product, the goal, and what you expect the creator to do." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hashtags" className="flex items-center gap-1.5">
          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
          Hashtags
        </Label>
        <Input
          id="hashtags"
          value={hashtags}
          onChange={e => onChange({ hashtags: e.target.value })}
          placeholder="#brandname, #campaign2026 (comma-separated)"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primary_niche">Target Niche</Label>
          <Select value={primary_niche_id} onValueChange={value => onChange({ primary_niche_id: value })}>
            <SelectTrigger className="w-full" id="primary_niche"><SelectValue placeholder="Select niche (optional)" /></SelectTrigger>
            <SelectContent>
              {Object.entries(NICHE_MAP).map(([id, name]) => (
                <SelectItem key={id} value={id} className="capitalize">{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <TooltipProvider>
            <Label htmlFor="brand_category" className="flex items-center gap-1.5">
              Product Category
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>Helps us flag brand conflicts when matching creators.</TooltipContent>
              </Tooltip>
            </Label>
          </TooltipProvider>
          <Select value={brand_category} onValueChange={value => onChange({ brand_category: value })}>
            <SelectTrigger className="w-full" id="brand_category"><SelectValue placeholder="Use brand default" /></SelectTrigger>
            <SelectContent>
              {BRAND_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Visibility</Label>
        <div className="grid grid-cols-2 gap-2">
          {VISIBILITY_OPTIONS.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => onChange({ visibility: opt.value })}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-all",
                visibility === opt.value
                  ? "border-primary bg-brand-soft/60 text-primary ring-1 ring-primary"
                  : "border-border hover:bg-surface-subtle"
              )}>
              <span className={visibility === opt.value ? "text-primary" : "text-muted-foreground"}>
                {opt.icon}
              </span>
              {opt.title}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 ml-auto text-muted-foreground/50 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px]">{opt.description}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
