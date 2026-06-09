"use client";

import { useState, useTransition } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ApplicationStatusBadge } from "@/components/application/ApplicationStatusBadge";
import { getAvatarInitials } from "@/lib/avatar";
import { formatBDT, formatDate } from "@/lib/utils";
import { Send, XCircle, Star, Users, ExternalLink, Loader2, ChevronRight, BookmarkX, BookmarkPlus, Lock } from "lucide-react";
import type { Application, ApplicationStatus } from "@/lib/types";
import { updateApplicationStatusAction } from "../_actions/campaign-actions";
import Link from "next/link";

interface ApplicationDrawerProps {
  application: Application | null;
  campaignId: string;
  campaignActive: boolean;
  onClose: () => void;
  onStatusChange: (applicationId: string, newStatus: ApplicationStatus) => void;
  onSendOffer: (app: Application) => void;
  onReShortlist?: (app: Application) => void;
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube", instagram: "Instagram", facebook: "Facebook",
  tiktok: "TikTok", twitter_x: "Twitter/X", linkedin: "LinkedIn",
};

export function ApplicationDrawer({
  application,
  campaignId,
  campaignActive,
  onClose,
  onStatusChange,
  onSendOffer,
  onReShortlist,
}: ApplicationDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  if (!application) return null;

  const creator = application.creator;
  const creatorName = creator?.display_name || "Unknown Creator";
  const initials = getAvatarInitials(creatorName);
  const status = application.status;
  const isApplicant = status === "pending"; // creator-initiated, awaiting brand
  const isShortlisted = status === "shortlisted";
  const canOffer = isApplicant || isShortlisted;
  const isDeclined = ["rejected", "declined", "withdrawn"].includes(status);

  const handleAction = (newStatus: ApplicationStatus, reason?: string) => {
    startTransition(async () => {
      const result = await updateApplicationStatusAction(application.id, newStatus, campaignId, reason);
      if (result.success) {
        onStatusChange(application.id, newStatus);
        setShowRejectForm(false);
        setRejectionReason("");
        onClose();
      }
    });
  };

  return (
    <Sheet open={!!application} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-border">
              <AvatarImage
                src={creator?.profile_photo_url || `https://api.dicebear.com/9.x/initials/svg?seed=${creatorName}`}
                alt={creatorName}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-base leading-tight">{creatorName}</p>
              <p className="text-sm text-muted-foreground capitalize font-normal">
                {creator?.primary_niche?.replace(/_/g, " ") || "Creator"}
              </p>
            </div>
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <ApplicationStatusBadge status={status} />
            <span className="text-xs text-muted-foreground">
              {isApplicant ? "Applied" : "Added"} {formatDate(application.applied_at)}
            </span>
          </SheetDescription>
        </SheetHeader>

        <Separator className="mb-4" />

        {(creator as any)?.social_profiles?.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Platforms</h4>
            <div className="grid grid-cols-2 gap-2">
              {(creator as any).social_profiles.map((sp: any) => (
                <div key={sp.platform} className="flex flex-col bg-muted/40 rounded-lg p-3">
                  <span className="text-xs text-muted-foreground mb-1">{PLATFORM_LABELS[sp.platform] || sp.platform}</span>
                  <span className="font-semibold text-sm">{sp.follower_count?.toLocaleString() ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">followers</span>
                  {sp.engagement_rate != null && (
                    <span className="text-xs text-green-600 font-medium mt-1">{sp.engagement_rate.toFixed(1)}% ER</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-5">
          {(creator as any)?.average_rating != null && (
            <div className="flex flex-col items-center bg-muted/40 rounded-lg p-3">
              <Star className="h-4 w-4 text-yellow-500 mb-1" />
              <span className="font-bold text-sm">{Number((creator as any).average_rating).toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">Rating</span>
            </div>
          )}
          {(creator as any)?.total_collaborations != null && (
            <div className="flex flex-col items-center bg-muted/40 rounded-lg p-3">
              <Users className="h-4 w-4 text-primary mb-1" />
              <span className="font-bold text-sm">{(creator as any).total_collaborations}</span>
              <span className="text-xs text-muted-foreground">Collabs</span>
            </div>
          )}
          {application.proposed_rate != null && (
            <div className="flex flex-col items-center bg-muted/40 rounded-lg p-3">
              <span className="text-xs text-muted-foreground mb-1">Proposed</span>
              <span className="font-bold text-sm">{formatBDT(application.proposed_rate)}</span>
            </div>
          )}
        </div>

        {application.proposal_text && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Proposal</h4>
            <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">
              {application.proposal_text}
            </p>
          </div>
        )}

        {/* Actions */}
        {canOffer && !showRejectForm && (
          <div className="flex flex-col gap-2 mt-4">
            <Button
              className="w-full"
              disabled={isPending || !campaignActive}
              onClick={() => onSendOffer(application)}
            >
              {campaignActive ? <Send className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
              Send Offer
            </Button>
            {!campaignActive && (
              <p className="text-xs text-muted-foreground text-center">
                Launch the campaign to start sending offers.
              </p>
            )}
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
              disabled={isPending}
              onClick={() => (isApplicant ? setShowRejectForm(true) : handleAction("withdrawn"))}
            >
              {isApplicant ? <XCircle className="mr-2 h-4 w-4" /> : <BookmarkX className="mr-2 h-4 w-4" />}
              {isApplicant ? "Decline applicant" : "Remove from shortlist"}
            </Button>
          </div>
        )}

        {showRejectForm && (
          <div className="mt-4 space-y-3 border border-destructive/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-destructive">Decline applicant</h4>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Reason (shown to creator, optional)</Label>
              <Textarea
                rows={3}
                placeholder="e.g. Budget not aligned, niche mismatch..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowRejectForm(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isPending}
                onClick={() => handleAction("rejected", rejectionReason || undefined)}
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm decline
              </Button>
            </div>
          </div>
        )}

        {isDeclined && (
          <div className="flex flex-col gap-2 mt-4">
            {application.rejection_reason && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 mb-1">
                <p className="text-xs font-semibold text-destructive mb-1">Decline reason</p>
                <p className="text-sm text-foreground">{application.rejection_reason}</p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              disabled={isPending}
              onClick={() => onReShortlist?.(application)}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookmarkPlus className="mr-2 h-4 w-4" />}
              Re-add to Shortlist
            </Button>
          </div>
        )}

        <Separator className="my-4" />

        <Button variant="ghost" size="sm" asChild className="w-full text-muted-foreground">
          <Link href={`/brand/dashboard/creators/${creator?.id}`} target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Full Profile
            <ChevronRight className="ml-auto h-4 w-4" />
          </Link>
        </Button>
      </SheetContent>
    </Sheet>
  );
}
