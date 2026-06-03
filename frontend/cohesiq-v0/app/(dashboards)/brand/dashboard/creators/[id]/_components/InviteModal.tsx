"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { getCampaigns, inviteCreatorToCampaign } from "@/lib/api/campaigns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Mail } from "lucide-react";
import type { Campaign } from "@/lib/types";

interface InviteModalProps {
  creatorId: string;
}

export function InviteModal({ creatorId }: InviteModalProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [brandNotes, setBrandNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && isLoaded && isSignedIn) {
      loadCampaigns();
    }
  }, [open, isLoaded, isSignedIn]);

  const loadCampaigns = async () => {
    setIsLoading(true);
    try {
      // In a real app, you might want to filter to only active campaigns created by the current brand.
      // Assuming getCampaigns returns the current user's campaigns if they are a brand, or we might need a specific endpoint.
      // For now we'll fetch all and assume the backend handles brand scoping or we filter here.
      const allCampaigns = await getCampaigns({});
      setCampaigns(allCampaigns);
    } catch (err) {
      console.error("Failed to load campaigns", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedCampaign) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;

      await inviteCreatorToCampaign(selectedCampaign, creatorId, brandNotes, token);
      setOpen(false);
      // Optional: Add toast success message
    } catch (err) {
      console.error("Failed to invite creator", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shrink-0 bg-primary">
          <Mail className="mr-2 h-4 w-4" />
          Invite to Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Creator</DialogTitle>
          <DialogDescription>
            Select a campaign to invite this creator to collaborate on.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Campaign</label>
            <Select disabled={isLoading} value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading campaigns..." : "Choose a campaign"} />
              </SelectTrigger>
              <SelectContent>
                {campaigns.length === 0 && !isLoading ? (
                  <SelectItem value="none" disabled>No active campaigns found</SelectItem>
                ) : (
                  campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Message (Optional)</label>
            <Textarea 
              placeholder="Hi, we love your content and would like to collaborate..."
              value={brandNotes}
              onChange={(e) => setBrandNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleInvite} disabled={!selectedCampaign || isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send Invitation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
