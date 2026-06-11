"use client";

import { useState, useEffect, useTransition } from "react";
import { useAuth } from "@clerk/nextjs";
import { getCampaignsByBrandId } from "@/lib/api/campaigns";
import { getMyBrandProfile } from "@/lib/api/brands";
import { shortlistAction } from "@/app/(dashboards)/brand/dashboard/campaigns/[id]/_actions/campaign-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookmarkPlus } from "lucide-react";
import type { Campaign } from "@/lib/types";

interface InviteModalProps {
  creatorId: string;
}

/**
 * "Add to Shortlist" — bookmarks a creator for a campaign. Works in any campaign
 * status (including draft); the brand sends the actual contract offer later from
 * the campaign pipeline.
 */
export function InviteModal({ creatorId }: InviteModalProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && isLoaded && isSignedIn) {
      setSelectedCampaign("");
      setNote("");
      setError(null);
      loadCampaigns();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isLoaded, isSignedIn]);

  const loadCampaigns = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const brand = await getMyBrandProfile(token);
      if (!brand) throw new Error("Brand profile not found");
      const brandCampaigns = await getCampaignsByBrandId(brand.id);
      setCampaigns(brandCampaigns);
    } catch (err) {
      console.error("Failed to load campaigns", err);
      setError(err instanceof Error ? err.message : "Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShortlist = () => {
    if (!selectedCampaign) return;
    setError(null);
    const campaignTitle = campaigns.find((c) => c.id === selectedCampaign)?.title ?? "the campaign";
    startTransition(async () => {
      const result = await shortlistAction(selectedCampaign, creatorId, note || undefined);
      if (result.success) {
        toast({
          title: "Added to shortlist",
          description: `This creator is shortlisted for "${campaignTitle}".`,
        });
        setOpen(false);
      } else {
        setError(result.error || "Failed to add creator to shortlist");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shrink-0">
          <BookmarkPlus className="mr-2 h-4 w-4" />
          Add to Shortlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Shortlist</DialogTitle>
          <DialogDescription>
            Shortlist this creator for a campaign. You can send a contract offer later from the
            campaign pipeline.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Campaign</label>
            <Select disabled={isLoading} value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading campaigns..." : "Choose a campaign"} />
              </SelectTrigger>
              <SelectContent>
                {campaigns.length === 0 && !isLoading ? (
                  <SelectItem value="none" disabled>No campaigns found</SelectItem>
                ) : (
                  campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Private note (optional)</label>
            <Textarea
              placeholder="Why this creator is a good fit — only you can see this."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={handleShortlist} disabled={!selectedCampaign || isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookmarkPlus className="mr-2 h-4 w-4" />}
            Add to Shortlist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
