"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";
import { cn, formatFollowerCount } from "@/lib/utils";
import type { CreatorFilters, PlatformType } from "@/lib/types";

interface CreatorFiltersProps {
  filters: CreatorFilters;
  onFiltersChange: (filters: CreatorFilters) => void;
}

const niches = [
  "Technology",
  "Gaming",
  "Fashion",
  "Beauty",
  "Food",
  "Travel",
  "Lifestyle",
  "Education",
  "Finance",
  "Fitness",
  "Parenting",
  "Entertainment",
  "News",
  "Other",
];

const platforms: { value: PlatformType; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
];

const languages = [
  { value: "bn", label: "Bangla" },
  { value: "en", label: "English" },
];

export function CreatorFilters({ filters, onFiltersChange }: CreatorFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [followerRange, setFollowerRange] = useState<[number, number]>([
    filters.min_followers ?? 1000,
    filters.max_followers ?? 20000000,
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

  const handleFollowerRangeChange = (value: number[]) => {
    setFollowerRange([value[0], value[1]]);
  };

  const handleFollowerRangeCommit = () => {
    onFiltersChange({
      ...filters,
      min_followers: followerRange[0],
      max_followers: followerRange[1],
    });
  };

  const handleLanguageChange = (value: string) => {
    onFiltersChange({
      ...filters,
      language: value === "all" ? undefined : value,
    });
  };

  const handleCityChange = (value: string) => {
    onFiltersChange({
      ...filters,
      city: value || undefined,
    });
  };

  const handleAvailableChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      is_available: checked || undefined,
    });
  };

  const handleMaxRateChange = (value: string) => {
    const maxRate = Number.parseInt(value, 10);
    onFiltersChange({
      ...filters,
      max_rate: Number.isFinite(maxRate) && maxRate > 0 ? maxRate : undefined,
    });
  };

  const clearFilters = () => {
    setFollowerRange([1000, 20000000]);
    onFiltersChange({});
  };

  const hasActiveFilters = [
    filters.niche,
    filters.platform,
    filters.min_followers,
    filters.max_followers,
    filters.language,
    filters.city,
    filters.is_available,
    filters.max_rate,
  ].some(v => v !== undefined);

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
            className="h-8 w-8 p-0 md:hidden"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className={cn("grid gap-5 p-4 md:grid-cols-2 xl:grid-cols-4", !isExpanded && "hidden md:grid")}>
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
                  id={platform.value}
                  checked={filters.platform === platform.value}
                  onCheckedChange={checked => handlePlatformChange(platform.value, !!checked)}
                />
                <label
                  htmlFor={platform.value}
                  className="text-sm text-muted-foreground"
                >
                  {platform.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Follower Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Follower Range</Label>
          <Slider
            value={followerRange}
            onValueChange={handleFollowerRangeChange}
            onValueCommit={handleFollowerRangeCommit}
            min={1000}
            max={20000000}
            step={1000}
            className="py-2"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatFollowerCount(followerRange[0])}</span>
            <span>{formatFollowerCount(followerRange[1])}</span>
          </div>
        </div>

        {/* Language Filter */}
        <div className="space-y-2">
          <Label htmlFor="language" className="text-sm font-medium">
            Language
          </Label>
          <Select value={filters.language ?? "all"} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language">
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {languages.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City Filter */}
        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm font-medium">
            City
          </Label>
          <Input
            id="city"
            placeholder="Enter city..."
            value={filters.city ?? ""}
            onChange={e => handleCityChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max-rate" className="text-sm font-medium">
            Max Rate
          </Label>
          <Input
            id="max-rate"
            inputMode="numeric"
            placeholder="৳250000"
            value={filters.max_rate ?? ""}
            onChange={e => handleMaxRateChange(e.target.value)}
          />
        </div>

        {/* Available Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3">
          <Label htmlFor="available" className="text-sm font-medium">
            Available Only
          </Label>
          <Switch
            id="available"
            checked={filters.is_available ?? false}
            onCheckedChange={handleAvailableChange}
          />
        </div>
      </div>
    </div>
  );
}
