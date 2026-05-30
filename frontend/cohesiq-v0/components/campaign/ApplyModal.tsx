"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitApplication } from "@/lib/api/applications";
import type { Campaign } from "@/lib/types";

interface ApplyModalProps {
  campaign: Campaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ApplyModal({ campaign, open, onOpenChange, onSuccess }: ApplyModalProps) {
  const [proposalText, setProposalText] = useState("");
  const [proposedRate, setProposedRate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { getToken } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to apply to campaigns.",
          variant: "destructive",
        });
        return;
      }

      await submitApplication(campaign.id, token, {
        proposal_text: proposalText,
        proposed_rate: proposedRate ? parseInt(proposedRate) : undefined,
      });

      toast({
        title: "Application submitted!",
        description: `Your application to "${campaign.title}" has been sent successfully.`,
      });

      setProposalText("");
      setProposedRate("");

      if (onSuccess) {
        onSuccess();
      } else {
        onOpenChange(false);
      }
    } catch (err: any) {
      const message = err?.message?.includes("already applied")
        ? "You have already applied to this campaign."
        : err?.message || "Failed to submit application. Please try again.";
      toast({
        title: "Submission failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply to Campaign</DialogTitle>
          <DialogDescription>
            Submit your application to {campaign.brand.brand_name}&apos;s campaign: &quot;{campaign.title}&quot;
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proposal">Your Proposal</Label>
            <Textarea
              id="proposal"
              placeholder="Tell the brand why you'd be a great fit for this campaign..."
              value={proposalText}
              onChange={e => setProposalText(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">Proposed Rate (BDT)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ৳
              </span>
              <Input
                id="rate"
                type="number"
                placeholder="50000"
                value={proposedRate}
                onChange={e => setProposedRate(e.target.value)}
                className="pl-8"
                min={0}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Campaign budget: Up to {campaign.budget_per_creator_max.toLocaleString()} BDT
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
