"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "../_actions/update-profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Globe, Save, CheckCircle2 } from "lucide-react";
import { BRAND_CATEGORIES } from "@/lib/brand-categories";
import type { Brand } from "@/lib/types";

interface ProfileFormProps {
  initialBrand: Brand;
}

export function ProfileForm({ initialBrand }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    brand_name: initialBrand.brand_name || "",
    niche: initialBrand.niche || "",
    brand_category: initialBrand.brand_category || "",
    website: initialBrand.website || "",
    description: initialBrand.description || "",
    logo_url: initialBrand.logo_url || "",
  });

  const handleSave = () => {
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfileAction(initialBrand.id, formData);
      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  return (
    <div className="bd-form-card">
      <div className="bd-form-header">
        <span className="bd-form-num">01</span>
        <div>
          <p className="bd-form-title">Company Information</p>
          <p className="bd-form-desc">
            This information is displayed to creators when you invite them to campaigns.
          </p>
        </div>
      </div>

      <div className="bd-form-body">
        {/* Avatar + brand name row */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex flex-col items-center gap-3 shrink-0">
            <Avatar className="h-24 w-24 border-4 border-surface-subtle shadow-sm">
              <AvatarImage
                src={formData.logo_url || `https://api.dicebear.com/9.x/initials/svg?seed=${formData.brand_name}`}
              />
              <AvatarFallback className="text-2xl bg-brand-soft text-brand font-display font-bold">
                {formData.brand_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">Change Logo</Button>
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div className="space-y-2">
              <Label htmlFor="brand_name">Company Name</Label>
              <Input
                id="brand_name"
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="niche">Industry / Niche</Label>
                <Input
                  id="niche"
                  value={formData.niche}
                  onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                  placeholder="e.g. Consumer Electronics"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand_category">Product Category</Label>
                <Select
                  value={formData.brand_category}
                  onValueChange={(value) => setFormData({ ...formData, brand_category: value })}
                >
                  <SelectTrigger id="brand_category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAND_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used to avoid recommending creators who recently worked with a direct competitor.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="pl-9"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2 pt-4 border-t border-border">
          <Label htmlFor="description">Company Description</Label>
          <Textarea
            id="description"
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Tell creators about your brand, mission, and the types of products you build."
          />
        </div>

        {/* Save row */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {saved ? (
            <span className="flex items-center gap-2 text-sm text-brand font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Changes saved
            </span>
          ) : (
            <span />
          )}
          <Button onClick={handleSave} disabled={isPending}>
            {isPending
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
              : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
