"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import { cn, formatBDT } from "@/lib/utils";
import type { CampaignFilters, PlatformType, CampaignStatus } from "@/lib/types";

interface CampaignFiltersComponentProps {
  filters: CampaignFilters;
  onFiltersChange: (filters: CampaignFilters) => void;
}

const niches = [
  "Technology",
  "Fashion",
  "Food",
  "Travel",
  "Gaming",
  "Fitness",
  "Beauty",
  "Finance",
  "Lifestyle",
  "Other",
];

const platforms: { value: PlatformType; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
];

const statuses: { value: CampaignStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "draft", label: "Draft" },
];

export function CampaignFilters({ filters, onFiltersChange }: CampaignFiltersComponentProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [budgetRange, setBudgetRange] = useState<[number, number]>([
    filters.min_budget ?? 1000,
    filters.max_budget ?? 500000,
  ]);

  const handleNicheChange = (value: string) => {
    onFiltersChange({
      ...filters,
      niche: value === "all" ? undefined : value,
    });
  };

  const handlePlatformChange = (platform: PlatformType, checked: boolean) => {
    onFiltersChange({
      ...filters,
      platform: checked ? platform : undefined,
    });
  };

  const handleBudgetRangeChange = (value: number[]) => {
    setBudgetRange([value[0], value[1]]);
  };

  const handleBudgetRangeCommit = () => {
    onFiltersChange({
      ...filters,
      min_budget: budgetRange[0],
      max_budget: budgetRange[1],
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === "all" ? undefined : (value as CampaignStatus),
    });
  };

  const clearFilters = () => {
    setBudgetRange([1000, 500000]);
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Filters</span>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs">
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0 lg:hidden"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className={cn("space-y-6 p-4", !isExpanded && "hidden lg:block")}>
        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm font-medium">
            Status
          </Label>
          <Select value={filters.status ?? "all"} onValueChange={handleStatusChange}>
            <SelectTrigger id="status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Niche Filter */}
        <div className="space-y-2">
          <Label htmlFor="niche" className="text-sm font-medium">
            Niche
          </Label>
          <Select value={filters.niche ?? "all"} onValueChange={handleNicheChange}>
            <SelectTrigger id="niche">
              <SelectValue placeholder="All Niches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Niches</SelectItem>
              {niches.map(niche => (
                <SelectItem key={niche} value={niche}>
                  {niche}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Platform Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Platform</Label>
          <div className="space-y-2">
            {platforms.map(platform => (
              <div key={platform.value} className="flex items-center gap-2">
                <Checkbox
                  id={`campaign-${platform.value}`}
                  checked={filters.platform === platform.value}
                  onCheckedChange={checked => handlePlatformChange(platform.value, !!checked)}
                />
                <label
                  htmlFor={`campaign-${platform.value}`}
                  className="text-sm text-muted-foreground"
                >
                  {platform.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Budget Range (BDT)</Label>
          <Slider
            value={budgetRange}
            onValueChange={handleBudgetRangeChange}
            onValueCommit={handleBudgetRangeCommit}
            min={1000}
            max={500000}
            step={5000}
            className="py-2"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatBDT(budgetRange[0])}</span>
            <span>{formatBDT(budgetRange[1])}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
