"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { getMyBrandProfile, updateBrandProfile } from "@/lib/api/brands";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Building2, Globe, Save } from "lucide-react";
import type { Brand } from "@/lib/types";

export default function BrandProfilePage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  
  const [brand, setBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    brand_name: "",
    niche: "",
    website: "",
    description: "",
    logo_url: "",
  });

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    async function loadData() {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) return;

        const brandData = await getMyBrandProfile(token);
        if (brandData) {
          setBrand(brandData);
          setFormData({
            brand_name: brandData.brand_name || "",
            niche: brandData.niche || "",
            website: brandData.website || "",
            description: brandData.description || "",
            logo_url: brandData.logo_url || "",
          });
        }
      } catch (err) {
        console.error("Failed to load brand profile", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [isLoaded, isSignedIn, getToken]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token || !brand) return;
      
      const updated = await updateBrandProfile(brand.id, formData, token);
      setBrand(updated);
      // Optional: Add a toast notification here
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          Brand Profile
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your company details and public presence on Cohesiq.
        </p>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>This information will be displayed to creators when you invite them to campaigns.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
                  <AvatarImage src={formData.logo_url || `https://api.dicebear.com/9.x/initials/svg?seed=${formData.brand_name}`} />
                  <AvatarFallback className="text-2xl">{formData.brand_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm">Change Logo</Button>
              </div>
              
              <div className="flex-1 space-y-4 w-full">
                <div className="space-y-2">
                  <Label htmlFor="brand_name">Company Name</Label>
                  <Input 
                    id="brand_name" 
                    value={formData.brand_name}
                    onChange={(e) => setFormData({...formData, brand_name: e.target.value})}
                  />
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="niche">Industry / Niche</Label>
                    <Input 
                      id="niche" 
                      value={formData.niche}
                      onChange={(e) => setFormData({...formData, niche: e.target.value})}
                      placeholder="e.g. Consumer Electronics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website URL</Label>
                    <div className="relative">
                      <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="website" 
                        value={formData.website}
                        onChange={(e) => setFormData({...formData, website: e.target.value})}
                        className="pl-9"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-border">
              <Label htmlFor="description">Company Description</Label>
              <Textarea 
                id="description" 
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Tell creators a little bit about your brand, your mission, and the types of products you build."
              />
            </div>
            
            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
